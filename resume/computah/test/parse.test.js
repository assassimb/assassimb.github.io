import { test } from "node:test";
import assert from "node:assert/strict";
import { parseListing, parsePrice, normalize } from "../src/parse.js";
import { evaluate, negotiation } from "../src/score.js";
import { CARDS } from "./fixtures.js";

const GRANBY = `Gaming PC (RX 6600, 32g RAM, I5)
450 C$700 C$
Mis en vente il y a 16 semaines sur Granby, QC
CPU: I5 9400
GPU: Sapphire RX 6600
RAM: 32G DDR4
SSD: 256g
HDD: 1TB
PSU: 550w Bronze
Renseignements sur le vendeur
Seller Name
Sélection du jour
1 400 $
Skidoo`;

test("full listing: every field", () => {
  const s = parseListing(GRANBY);
  assert.equal(s.title, "Gaming PC (RX 6600, 32g RAM, I5)");
  assert.deepEqual([s.price, s.oldPrice, s.town, s.ageDays], [450, 700, "Granby", 112]);
  assert.equal(s.cpu.name, "Intel Core i5-9400");
  assert.equal(s.gpu.name, "Radeon RX 6600");
  assert.deepEqual(s.ram, { gb: 32, ddr: 4 });
  assert.deepEqual(s.storage, [{ gb: 256, type: "ssd" }, { gb: 1000, type: "hdd" }]);
  assert.deepEqual(s.psu, { watts: 550, rating: "bronze" });
});

test("seller section and other listings are cut off", () => {
  assert.ok(!normalize(GRANBY).includes("Seller Name"));
  assert.ok(!normalize(GRANBY).includes("Skidoo"));
});

test("prices: glued, spaced with NBSP, search card, free", () => {
  assert.deepEqual(parsePrice(normalize("T\n1\u00a0200\u202fC$1\u00a0500 C$")), { price: 1200, oldPrice: 1500 });
  assert.deepEqual(parsePrice(normalize("875 C$ | 1 100 C$ | SLEEPER | Sherbrooke, QC")), { price: 875, oldPrice: 1100 });
  assert.deepEqual(parsePrice("Gratuit | ÉCHANGE"), { price: 0, oldPrice: null });
});

const name = (t, k) => { const p = parseListing(t)[k]; return p?.name || p?.unknown || null; };
test("GPU spellings", () => {
  assert.equal(name("GTX 1660S", "gpu"), "GeForce GTX 1660 SUPER");
  assert.equal(name("gtx 2070", "gpu"), "GeForce RTX 2070"); // typo: there is no GTX 2070
  assert.equal(name("RX 6750XT 12GB", "gpu"), "Radeon RX 6750 XT");
  assert.equal(name("rtx 3060ti", "gpu"), "GeForce RTX 3060 Ti");
  assert.equal(name("GTX670", "gpu"), "GeForce GTX 670");
  assert.equal(name("GTX 1060 3GB", "gpu"), "GeForce GTX 1060 3GB");
  assert.equal(name("RX 570 8GB", "gpu"), "Radeon RX 570");
  assert.equal(name("Arc B580", "gpu"), "Intel Arc B580");
  assert.equal(name("année 2070, 1060 $", "gpu"), null); // bare numbers are not GPUs
});

test("CPU spellings", () => {
  assert.equal(name("i7 12700k", "cpu"), "Intel Core i7-12700K");
  assert.equal(name("I5-9400F", "cpu"), "Intel Core i5-9400F");
  assert.equal(name("AMD RyzenTM 7 5700", "cpu"), "AMD Ryzen 7 5700");
  assert.equal(name("ryzen 5 3600x", "cpu"), "AMD Ryzen 5 3600X");
  assert.equal(name("Intel Core i7 – 16GB", "cpu"), "Intel Core i7"); // unknown model, asks the user
  assert.equal(name("intel 14e gen", "cpu"), "Intel 14e gén.");
});

test("RAM and storage in French units", () => {
  const s = parseListing("32 Go DDR5 RGB, 1TO NVMe, 2 To HDD");
  assert.deepEqual(s.ram, { gb: 32, ddr: 5 });
  assert.deepEqual(s.storage, [{ gb: 1000, type: "ssd" }, { gb: 2000, type: "hdd" }]);
});

test("Granby is a good buy and negotiation stays within 10-20 %", () => {
  const s = parseListing(GRANBY);
  const e = evaluate(s);
  assert.ok(e.buy >= 60, `buy ${e.buy}`);
  const n = negotiation(s);
  assert.deepEqual(n.steps.map(x => x.offer), [400, 380, 360]);
  assert.ok(n.steps.every((x, i, a) => i === 0 || x.buy >= a[i - 1].buy));
});

test("missing CPU or GPU model gives no verdict instead of a wrong one", () => {
  const e = evaluate(parseListing("Pc gaming\n800 C$"));
  assert.equal(e.buy, null);
  assert.equal(e.verdict.key, "unknown");
});

test("every real search card parses without throwing", () => {
  for (const c of CARDS) {
    const s = parseListing(c);
    assert.ok(s.price != null, c);
    evaluate(s); negotiation(s);
  }
});

test("flags from real listings", () => {
  const f = t => parseListing(t).flags;
  assert.equal(f("PC Gaming RTX 4060 Ti\n1 325 C$\nÉchange possible : PC gaming · Laptop · PS5").laptop, false);
  assert.equal(f("ASUS ROG Zephyrus G15\n900 C$").laptop, true);
  assert.equal(f("Carte vidéo MSI RTX-2070 Armor\n375 C$").notPc, true);
  assert.equal(f("GPU MSI GeForce RTX 3080 GAMING X TRIO 10GB\n750 C$").notPc, true);
  assert.equal(f("Pc gamer rtx 2080 super\n900 C$").notPc, false);
  assert.equal(f("Pc gaming a vendre seulement pour piece\n150 C$").parts, true);
});

test("Core Ultra written without 'Ultra'", () => {
  assert.equal(name("RTX 5080 | Core 9 285K", "cpu"), "Intel Core Ultra 9 285K");
});

test("placeholder price gives no verdict", () => {
  assert.equal(evaluate(parseListing("Setup gaming\n1 C$\ni7-12700K RTX 4060")).buy, null);
});

test("a title naming CPU and GPU is a PC even without the word PC", () => {
  assert.equal(parseListing("SLEEPER Dell gaming, i7 12700k, rtx 4060\n875 C$").flags.notPc, false);
});

test("GPU glued to the board maker, monitor titles", () => {
  assert.equal(name("b550m wifi 6 3080zotac Kingston nvme", "gpu"), "GeForce RTX 3080");
  assert.equal(parseListing("MSI 180hz\n190 C$").flags.notPc, true);
});
