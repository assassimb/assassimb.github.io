import "./style.css";
import { CPUS, GPUS } from "./benchmarks.js";
import { parseListing } from "./parse.js";
import { evaluate, negotiation } from "./score.js";
import { loadRecent, record, adminList, adminDelete, adminImport } from "./store.js";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => (n == null ? "?" : `${Math.round(n).toLocaleString("fr-CA")} $`);
const CPU_MAP = new Map(CPUS), GPU_MAP = new Map(GPUS);

const EXAMPLE = `Gaming PC (RX 6600, 32g RAM, I5)
450 C$700 C$
Mis en vente il y a 16 semaines sur Granby, QC
État
D’occasion – comme neuf
CPU: I5 9400
GPU: Sapphire RX 6600
RAM: 32G DDR4
SSD: 256g
HDD: 1TB
PSU: 550w Bronze`;

const LABELS = { cpu: "Processeur + carte mère", gpu: "Carte graphique", ram: "Mémoire vive", storage: "Stockage", psu: "Bloc d'alimentation", case: "Boîtier et ventilos", build: "Monté, testé, Windows" };

// Current analysis; overrides are the user's own prices for parts.
let state = null;

$("cpu-list").innerHTML = CPUS.map(([n]) => `<option value="${esc(n)}">`).join("");
$("gpu-list").innerHTML = GPUS.map(([n]) => `<option value="${esc(n)}">`).join("");

$("form").addEventListener("submit", e => { e.preventDefault(); analyse(); });
$("example").addEventListener("click", () => { $("text").value = EXAMPLE; $("link").value = ""; $("price").value = ""; analyse(); });

function analyse(saved) {
  const text = $("text").value.trim();
  if (!text) return;
  const specs = parseListing(text);
  const typedPrice = Number($("price").value);
  if ($("price").value !== "" && typedPrice >= 0) specs.price = typedPrice;
  else if (specs.price != null) $("price").placeholder = `auto : ${specs.price}`;
  state = { id: saved?.id || crypto.randomUUID?.() || String(Date.now()), text, link: $("link").value.trim(), specs, overrides: saved?.overrides || {} };
  if (saved?.cpuPick) pick("cpu", saved.cpuPick, false);
  if (saved?.gpuPick) pick("gpu", saved.gpuPick, false);
  render();
}

function pick(kind, name, rerender = true) {
  const score = (kind === "cpu" ? CPU_MAP : GPU_MAP).get(name);
  if (!score) return;
  state.specs[kind] = { name, score, picked: true };
  state[kind + "Pick"] = name;
  if (rerender) render();
}

function render() {
  const { specs, overrides } = state;
  const ev = evaluate(specs, overrides);
  const neg = negotiation(specs, overrides);
  save(ev, neg);

  const v = ev.verdict;
  const ratioTxt = ev.ratio == null ? "" : `<p class="ratio">Pièces estimées à <b>${money(ev.value)}</b> pour <b>${money(specs.price)}</b> demandés (${Math.round(ev.ratio * 100)} %).</p>`;
  const meta = [specs.town, specs.ageDays != null ? `en vente depuis ${ageText(specs.ageDays)}` : null, specs.oldPrice ? `baissé de ${money(specs.oldPrice)}` : null].filter(Boolean).join(" · ");

  $("result").innerHTML = `
    <div class="panel verdict v-${v.key}">
      <div class="score-bubble"><span>${ev.buy ?? "?"}</span><small>/100</small></div>
      <div class="verdict-txt">
        <p class="kicker">${esc(specs.title || "Annonce")}</p>
        <h2>${esc(v.label)}</h2>
        ${ratioTxt}
        ${meta ? `<p class="meta">${esc(meta)}</p>` : ""}
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <h3>Pièces</h3>
        <table class="parts">
          <thead><tr><th>Pièce</th><th>Détecté</th><th class="num">Valeur estimée</th></tr></thead>
          <tbody>${ev.parts.map(p => partRow(p, specs)).join("")}</tbody>
          <tfoot><tr><td colspan="2">Total</td><td class="num"><b>${money(ev.value)}</b></td></tr></tfoot>
        </table>
        <p class="hint">Les valeurs sont des estimations. Corrige-les si tu connais mieux le prix d'une pièce.</p>
      </div>

      <div class="panel">
        <h3>Performance</h3>
        ${ev.perf ? `
          <p class="tier">${esc(ev.perf.tier)}</p>
          ${bar("Carte graphique", specs.gpu, ev.perf.gpu, "RTX 4060")}
          ${bar("Processeur", specs.cpu, ev.perf.cpu, "Ryzen 5 7600")}
        ` : `<p class="hint">Aucune pièce reconnue pour l'instant.</p>`}
        ${ev.notes.length ? `<ul class="notes">${ev.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
      </div>
    </div>

    ${neg ? negPanel(neg, specs) : ""}
  `;
  $("result").hidden = false;
  wireResult();
  renderRecent();
}

function partRow(p, specs) {
  const s = specs[p.key];
  let found = "";
  if (p.key === "cpu" || p.key === "gpu") {
    found = s?.score ? `${esc(s.name)} <span class="bench">${s.score.toLocaleString("fr-CA")} pts</span>`
      : `<input class="pick" data-kind="${p.key}" list="${p.key}-list" placeholder="${s?.unknown ? esc(s.unknown) + " : modèle ?" : "Choisis le modèle"}" />`;
  } else if (p.key === "ram") found = s ? `${s.gb} Go${s.ddr ? " DDR" + s.ddr : ""}` : "non précisée";
  else if (p.key === "storage") found = s?.length ? s.map(d => `${d.gb >= 1000 ? d.gb / 1000 + " To" : d.gb + " Go"} ${d.type.toUpperCase()}`).join(" + ") : "non précisé";
  else if (p.key === "psu") found = s?.watts ? `${s.watts} W${s.rating ? " " + esc(s.rating) : ""}` : "supposé standard";
  else found = p.key === "case" ? "supposé standard" : "inclus";
  return `<tr><td>${LABELS[p.key]}</td><td>${found}</td>
    <td class="num"><input class="val" data-key="${p.key}" type="number" min="0" step="5" value="${p.value ?? ""}" placeholder="?" aria-label="Valeur de ${LABELS[p.key]}" /></td></tr>`;
}

function bar(label, part, ratio, ref) {
  if (ratio == null) return `<div class="bar"><div class="bar-head"><span>${label}</span><span>?</span></div></div>`;
  const pct = Math.min(ratio / 1.6, 1) * 100;
  return `<div class="bar">
    <div class="bar-head"><span>${label}</span><span>${Math.round(ratio * 100)} % d'une ${ref}</span></div>
    <div class="track"><div class="fill" style="width:${pct}%"></div><div class="ref" style="left:${100 / 1.6}%"></div></div>
  </div>`;
}

function negPanel(neg, specs) {
  return `<div class="panel neg">
    <h3>Négociation</h3>
    <p class="advice">${esc(neg.advice)}</p>
    <table class="steps">
      <thead><tr><th>Offre</th><th class="num">Prix</th><th class="num">Score</th></tr></thead>
      <tbody>${neg.steps.map(s => `<tr class="${neg.target === s ? "target" : ""}">
        <td>-${Math.round(s.cut * 100)} %</td><td class="num">${money(s.offer)}</td><td class="num">${s.buy}</td></tr>`).join("")}</tbody>
    </table>
    <div class="odds">
      <div class="bar-head"><span>Chances qu'il accepte</span><span>${neg.odds} %</span></div>
      <div class="track"><div class="fill" style="width:${neg.odds}%"></div></div>
      <p class="hint">${esc(oddsWhy(specs))}</p>
    </div>
    <label for="msg">Message à envoyer</label>
    <div class="msg-row"><textarea id="msg" rows="2">${esc(neg.message)}</textarea><button type="button" id="copy" class="ghost">Copier</button></div>
  </div>`;
}

function oddsWhy(specs) {
  const why = [];
  if (specs.oldPrice) why.push("le prix a déjà baissé");
  if (specs.ageDays >= 28) why.push(`en vente depuis ${ageText(specs.ageDays)}`);
  if (specs.flags.open) why.push("le vendeur se dit ouvert aux offres");
  if (specs.flags.firm) why.push("le vendeur annonce un prix ferme");
  return why.length ? "Parce que " + why.join(", ") + "." : "Rien dans l'annonce n'indique si le vendeur est pressé.";
}

function ageText(d) {
  if (d < 1) return "aujourd'hui";
  if (d < 14) return `${d} jour${d > 1 ? "s" : ""}`;
  if (d < 60) return `${Math.round(d / 7)} semaines`;
  return `${Math.round(d / 30)} mois`;
}

function wireResult() {
  document.querySelectorAll("#result .val").forEach(inp => inp.addEventListener("change", () => {
    const n = inp.value === "" ? null : Number(inp.value);
    if (n == null) delete state.overrides[inp.dataset.key]; else state.overrides[inp.dataset.key] = n;
    render();
  }));
  document.querySelectorAll("#result .pick").forEach(inp => inp.addEventListener("change", () => pick(inp.dataset.kind, inp.value)));
  $("copy")?.addEventListener("click", async e => {
    try { await navigator.clipboard.writeText($("msg").value); e.target.textContent = "Copié"; } catch { $("msg").select(); }
  });
}

function save(ev, neg) {
  const s = state.specs;
  record({
    id: state.id, at: new Date().toISOString(), link: state.link, text: state.text.slice(0, 4000),
    title: s.title, town: s.town, price: s.price, oldPrice: s.oldPrice, ageDays: s.ageDays,
    cpu: s.cpu?.name || s.cpu?.unknown || null, gpu: s.gpu?.name || s.gpu?.unknown || null,
    ram: s.ram?.gb || null, storage: (s.storage || []).map(d => `${d.gb} ${d.type}`).join(" + "),
    value: ev.value, buy: ev.buy, verdict: ev.verdict.label, target: neg?.target?.offer ?? null, odds: neg?.odds ?? null,
    overrides: state.overrides, cpuPick: state.cpuPick || null, gpuPick: state.gpuPick || null,
  });
}

function renderRecent() {
  const list = loadRecent().slice(0, 6);
  $("recent-wrap").hidden = !list.length;
  $("recent").innerHTML = list.map(e => `<li><button type="button" data-id="${esc(e.id)}">
    <span class="r-score v-${verdictKey(e.buy)}">${e.buy ?? "?"}</span>
    <span class="r-title">${esc(e.title || "Annonce")}</span>
    <span class="r-meta">${money(e.price)}${e.town ? " · " + esc(e.town) : ""}</span></button></li>`).join("");
  $("recent").querySelectorAll("button").forEach(b => b.addEventListener("click", () => reopen(b.dataset.id)));
}

const verdictKey = b => (b == null ? "unknown" : b >= 75 ? "buy" : b >= 60 ? "good" : b >= 45 ? "nego" : "pass");

function reopen(id) {
  const e = loadRecent().find(x => x.id === id);
  if (!e) return;
  $("text").value = e.text; $("link").value = e.link || ""; $("price").value = "";
  analyse(e);
  window.scrollTo({ top: $("result").offsetTop - 16, behavior: "smooth" });
}

// ---- admin --------------------------------------------------------------------
// The name is checked by the server. Once it works it is remembered in this browser,
// so coming back opens the listings straight away ("Sortir" forgets it).

const WHO_KEY = "computah-who";
const remembered = () => { try { return localStorage.getItem(WHO_KEY); } catch { return null; } };
const remember = name => { try { name ? localStorage.setItem(WHO_KEY, name) : localStorage.removeItem(WHO_KEY); } catch { /* private mode */ } };
let adminPass = null;
const ADMIN_ERRORS = { unauthorized: "Connais pas. Essaie encore.", offline: "Le serveur répond pas. Réessaie dans une minute.", server: "Le serveur a eu un problème." };
const calm = matchMedia("(prefers-reduced-motion: reduce)");

// Each letter of the question gets its own span so it can float in one after the other.
$("who").innerHTML = [...$("who").textContent].map((ch, i) =>
  ch === " " ? " " : `<span style="--i:${i}">${esc(ch)}</span>`).join("");
$("who").setAttribute("aria-label", "T'es qui toé?");

// A handful of soap bubbles drifting up behind the login.
$("sheet-bubbles").innerHTML = Array.from({ length: 14 }, (_, i) => {
  const size = 30 + ((i * 37) % 110), left = (i * 53) % 100, delay = -((i * 7) % 18), dur = 14 + ((i * 5) % 12);
  return `<span style="--s:${size}px;--x:${left}%;--d:${delay}s;--t:${dur}s;--h:${(i * 47) % 360}deg"></span>`;
}).join("");

function showLogin() {
  $("admin").classList.remove("unlocked");
  $("admin-lock").hidden = false; $("admin-lock").classList.remove("leaving");
  $("admin-table").hidden = true; $("admin-err").hidden = true; $("admin-pass").value = "";
  setTimeout(() => $("admin-pass").focus(), calm.matches ? 0 : 700);
}

function unlock(list) {
  $("admin").classList.add("unlocked");
  const show = () => { $("admin-lock").hidden = true; renderAdmin(list); };
  if (calm.matches) return show();
  $("admin-lock").classList.add("leaving");
  setTimeout(show, 420);
}

$("admin-open").addEventListener("click", async () => {
  $("admin").showModal();
  const name = remembered();
  if (name) {
    try { adminPass = name; unlock(await adminList(name)); return; }
    catch (err) { if (err.message === "unauthorized") remember(null); }
  }
  showLogin();
});
$("admin-cancel").addEventListener("click", () => $("admin").close());
$("admin-lock").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("admin-pass").value.trim().toLowerCase();
  if (!name) return;
  try {
    const list = await adminList(name);
    adminPass = name;
    remember(name);
    unlock(list);
  } catch (err) {
    $("admin-err").textContent = ADMIN_ERRORS[err.message] || ADMIN_ERRORS.server;
    $("admin-err").hidden = false;
    $("admin-lock").classList.remove("shake"); void $("admin-lock").offsetWidth; $("admin-lock").classList.add("shake");
    $("admin-pass").select();
  }
});

async function refreshAdmin(note) {
  try { renderAdmin(await adminList(adminPass), note); }
  catch (err) { renderAdmin([], ADMIN_ERRORS[err.message] || ADMIN_ERRORS.server); }
}

// Table columns: how each one is sorted and drawn. Empty values always sort last.
const COLUMNS = [
  { key: "at", label: "Date", sort: e => e.at, cell: e => esc(new Date(e.at).toLocaleDateString("fr-CA")) },
  { key: "title", label: "Annonce", sort: e => (e.title || "").toLowerCase(),
    cell: e => e.link ? `<a href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.title || "Annonce")}</a>` : esc(e.title || "Annonce") },
  { key: "town", label: "Ville", sort: e => (e.town || "").toLowerCase(), cell: e => esc(e.town || "") },
  { key: "price", label: "Prix", num: true, sort: e => e.price, cell: e => money(e.price) },
  { key: "value", label: "Valeur", num: true, sort: e => e.value, cell: e => money(e.value) },
  { key: "buy", label: "Score", num: true, sort: e => e.buy, cell: e => e.buy ?? "?" },
  { key: "verdict", label: "Verdict", sort: e => e.verdict, cell: e => esc(e.verdict) },
  { key: "target", label: "Offre", num: true, sort: e => e.target, cell: e => (e.target ? money(e.target) : "") },
  { key: "cpu", label: "CPU", sort: e => e.cpu, cell: e => esc(e.cpu || "") },
  { key: "gpu", label: "GPU", sort: e => e.gpu, cell: e => esc(e.gpu || "") },
  { key: "ram", label: "RAM", num: true, sort: e => e.ram, cell: e => (e.ram ? e.ram + " Go" : "") },
  { key: "storage", label: "Stockage", sort: e => e.storage, cell: e => esc(e.storage || "") },
];

// Kept while the page is open, so a refresh after an import or a delete keeps the view.
const view = { sort: "at", dir: -1, q: "", verdict: "", maxPrice: "" };
let adminRows = [];

function renderAdmin(all, note) {
  adminRows = all;
  const verdicts = [...new Set(all.map(e => e.verdict).filter(Boolean))].sort();
  const t = $("admin-table");
  t.hidden = false;
  t.innerHTML = `
    <div class="admin-head"><h2 id="admin-count"></h2>
      <div class="row"><button type="button" class="ghost small" id="admin-export">Exporter JSON</button>
      <label class="ghost small file-btn">Importer JSON<input type="file" id="admin-import" accept="application/json,.json" hidden /></label>
      <button type="button" class="ghost small" id="admin-logout">Sortir</button>
      <button type="button" class="ghost small" id="admin-close">Fermer</button></div></div>
    ${note ? `<p class="err">${esc(note)}</p>` : ""}
    <div class="row filters">
      <div class="field grow"><label for="f-q">Rechercher</label>
        <input id="f-q" type="search" placeholder="titre, ville, CPU, GPU…" value="${esc(view.q)}" /></div>
      <div class="field"><label for="f-verdict">Verdict</label>
        <select id="f-verdict"><option value="">Tous</option>${verdicts.map(v => `<option${v === view.verdict ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></div>
      <div class="field"><label for="f-max">Prix max</label>
        <input id="f-max" type="number" min="0" step="50" placeholder="aucun" value="${esc(view.maxPrice)}" /></div>
    </div>
    <div class="scroll"><table class="admin">
      <thead><tr>${COLUMNS.map(c => `<th class="${c.num ? "num" : ""}"><button type="button" class="sort" data-sort="${c.key}">${c.label}<span class="arrow"></span></button></th>`).join("")}<th></th></tr></thead>
      <tbody id="admin-body"></tbody>
    </table></div>`;

  $("admin-close").addEventListener("click", () => $("admin").close());
  $("admin-logout").addEventListener("click", () => { remember(null); adminPass = null; showLogin(); });
  $("admin-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(adminRows, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "computah-recherches.json" });
    a.click(); URL.revokeObjectURL(a.href);
  });
  $("admin-import").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    let list;
    try { list = JSON.parse(await file.text()); if (!Array.isArray(list)) throw 0; }
    catch { refreshAdmin("Ce fichier n'est pas un export computah valide."); return; }
    try { const r = await adminImport(adminPass, list); refreshAdmin(`${r.imported} annonce(s) importée(s).`); }
    catch (err) { refreshAdmin(ADMIN_ERRORS[err.message] || ADMIN_ERRORS.server); }
  });
  $("f-q").addEventListener("input", e => { view.q = e.target.value; renderAdminRows(); });
  $("f-verdict").addEventListener("change", e => { view.verdict = e.target.value; renderAdminRows(); });
  $("f-max").addEventListener("input", e => { view.maxPrice = e.target.value; renderAdminRows(); });
  t.querySelectorAll("[data-sort]").forEach(b => b.addEventListener("click", () => {
    const key = b.dataset.sort;
    // First click: numbers and dates high-to-low, text A-Z; second click flips.
    view.dir = view.sort === key ? -view.dir : (COLUMNS.find(c => c.key === key).num || key === "at" ? -1 : 1);
    view.sort = key;
    renderAdminRows();
  }));
  renderAdminRows();
}

function renderAdminRows() {
  const q = view.q.trim().toLowerCase();
  const max = view.maxPrice === "" ? null : Number(view.maxPrice);
  const rows = adminRows.filter(e =>
    (!q || [e.title, e.town, e.cpu, e.gpu, e.verdict, e.storage].some(v => String(v || "").toLowerCase().includes(q))) &&
    (!view.verdict || e.verdict === view.verdict) &&
    (max == null || (e.price != null && e.price <= max)));
  const col = COLUMNS.find(c => c.key === view.sort);
  rows.sort((a, b) => {
    const x = col.sort(a), y = col.sort(b);
    const ex = x == null || x === "", ey = y == null || y === "";
    if (ex || ey) return ex === ey ? 0 : ex ? 1 : -1;
    return (x < y ? -1 : x > y ? 1 : 0) * view.dir;
  });

  const n = adminRows.length;
  $("admin-count").textContent = rows.length === n
    ? `Toutes les annonces · ${n}`
    : `Toutes les annonces · ${rows.length} sur ${n}`;
  document.querySelectorAll("#admin-table [data-sort]").forEach(b => {
    const on = b.dataset.sort === view.sort;
    b.querySelector(".arrow").textContent = on ? (view.dir > 0 ? " ↑" : " ↓") : "";
    b.closest("th").setAttribute("aria-sort", on ? (view.dir > 0 ? "ascending" : "descending") : "none");
  });
  $("admin-body").innerHTML = rows.map(e => `<tr>
    ${COLUMNS.map(c => `<td class="${c.num ? "num" : ""}">${c.cell(e)}</td>`).join("")}
    <td><button type="button" class="ghost small" data-del="${esc(e.id)}" aria-label="Supprimer">✕</button></td></tr>`).join("");
  $("admin-body").querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
    await adminDelete(adminPass, b.dataset.del).catch(() => {});
    refreshAdmin();
  }));
}

renderRecent();
