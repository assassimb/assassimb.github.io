// Turns pasted listing text (a Facebook Marketplace page copy, or just its title) into
// structured specs. Everything here is pure: text in, plain object out.
import { CPUS, GPUS } from "./benchmarks.js";

const CPU_SCORES = new Map(CPUS);
const GPU_SCORES = new Map(GPUS);

// A full-page copy carries other people's listings and the seller's profile after these.
const CUT_MARKERS = [
  "Renseignements sur le vendeur", "Seller information", "Seller details",
  "Recherches associées", "Related searches", "Sélection du jour", "Today's picks",
];

export function normalize(text) {
  let t = String(text || "").replace(/[\u00a0\u202f\u2009]/g, " ").replace(/[\u200b\u2122\u00ae]/g, "").replace(/(ryzen)tm\b/gi, "$1");
  for (const m of CUT_MARKERS) {
    const i = t.indexOf(m);
    if (i > 0) t = t.slice(0, i);
  }
  return t;
}

const PRICE_RE = /(?:(?:CA|C)?\$\s?(\d{1,3}(?:[ ,]\d{3})+|\d+))|(?:(\d{1,3}(?:[ ,]\d{3})+|\d+)\s?(?:C\$|\$|CAD))/g;
const toNum = s => Number(String(s).replace(/[ ,]/g, ""));

// First line that holds a price is the listing's own price line ("450 C$700 C$" when it was dropped).
export function parsePrice(text) {
  const lines = text.split(/\n|\s\|\s/);
  const prices = line => [...line.matchAll(PRICE_RE)].map(m => toNum(m[1] || m[2])).filter(n => n > 0 && n < 20000);
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(gratuit|free)\s*$/i.test(lines[i])) return { price: 0, oldPrice: null };
    const found = prices(lines[i]);
    if (found.length) {
      // On a search card the struck-through old price is its own " | " segment.
      if (found.length === 1 && lines[i + 1] && /^\s*[\d ,]+\s?(C\$|\$)\s*$/.test(lines[i + 1])) found.push(...prices(lines[i + 1]));
      const [price, old] = found;
      return { price, oldPrice: old && old > price ? old : null };
    }
  }
  return { price: null, oldPrice: null };
}

const hasPrice = l => /^\s*(gratuit|free)\s*$/i.test(l) || [...l.matchAll(PRICE_RE)].length > 0;

// The title is the line right above the price line; a one-line search card is "price | title | town".
export function parseTitle(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 1 && lines[0].includes(" | ")) {
    return lines[0].split(" | ").find(p => !hasPrice(p) && !/, (QC|ON)$/.test(p)) || "";
  }
  const i = lines.findIndex(hasPrice);
  return (i > 0 ? lines[i - 1] : lines[0] || "").slice(0, 140);
}

export function parseTown(text) {
  const m = text.match(/(?:sur|in|à)\s+([A-ZÀ-Ý][\w'’.\- ]{1,40}?),\s?(QC|ON)\b/) ||
            text.match(/(?:^|\|\s)([A-ZÀ-Ý][\w'’.\- ]{1,40}?),\s?(QC|ON)\b/m);
  return m ? m[1].trim() : null;
}

const UNIT_DAYS = { minute: 0, heure: 0, hour: 0, jour: 1, day: 1, semaine: 7, week: 7, mois: 30, month: 30, an: 365, year: 365 };
export function parseAgeDays(text) {
  const m = text.match(/il y a (\d+|un|une)\s+(minute|heure|jour|semaine|mois|an)/i) ||
            text.match(/listed (\d+|a|an)\s+(minute|hour|day|week|month|year)s? ago/i);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : 1;
  return n * UNIT_DAYS[m[2].toLowerCase()];
}

// ---- parts ------------------------------------------------------------------

function lookup(map, candidates) {
  for (const c of candidates) if (map.has(c)) return { name: c, score: map.get(c) };
  for (const c of candidates) {
    for (const [name, score] of map) if (name.startsWith(c + " ")) return { name, score };
  }
  return null;
}

export function findCpu(s) {
  let m = s.match(/\bi([3579])[\s-]*(\d{4,5})([a-z]{0,2})\b/);
  if (m) {
    const base = `Intel Core i${m[1]}-${m[2]}`;
    const hit = lookup(CPU_SCORES, [base + m[3].toUpperCase(), base]);
    if (hit) return hit;
  }
  m = s.match(/\b(?:core\s*)?ultra\s*([579])\s*(\d{3})([a-z]{0,2})\b/) || s.match(/\bcore\s*([579])\s*(2\d{2})([a-z]{0,2})\b/);
  if (m) {
    const base = `Intel Core Ultra ${m[1]} ${m[2]}`;
    const hit = lookup(CPU_SCORES, [base + m[3].toUpperCase(), base]);
    if (hit) return hit;
  }
  m = s.match(/\b(?:ryzen|r)\s*([3579])\s*(\d{4})\s*(x3d|xt|x|ge|g|f)?\b/);
  if (m) {
    const base = `AMD Ryzen ${m[1]} ${m[2]}`;
    const hit = lookup(CPU_SCORES, [base + (m[3] || "").toUpperCase(), base]);
    if (hit) return hit;
  }
  m = s.match(/\bxeon\s*(e[35])[\s-]*(\d{4})\s*(v\d)?/);
  if (m) {
    const base = `Intel Xeon ${m[1].toUpperCase()}-${m[2]}`;
    const hit = lookup(CPU_SCORES, [m[3] ? `${base} ${m[3]}` : base, base]);
    if (hit) return hit;
  }
  m = s.match(/\bfx[\s-]?(\d{4})\b/);
  if (m) {
    const hit = lookup(CPU_SCORES, [`AMD FX-${m[1]}`]);
    if (hit) return hit;
  }
  m = s.match(/\b(i[3579]|ryzen(?:\s*[3579])?)\b/);
  if (m) return { unknown: m[1].startsWith("i") ? `Intel Core ${m[1]}` : `AMD ${m[1].replace(/\s+/, " ").replace("ryzen", "Ryzen")}` };
  m = s.match(/\b(\d{1,2})\s?(?:e|th|ème|eme)\s?g[ée]n/);
  return m ? { unknown: `Intel ${m[1]}e gén.` } : null;
}

const NV_MODELS = new Set(["650", "660", "670", "680", "750", "760", "770", "780", "950", "960", "970", "980", "1030", "1050", "1060", "1070", "1080", "1630", "1650", "1660",
  "2060", "2070", "2080", "3050", "3060", "3070", "3080", "3090", "4060", "4070", "4080", "4090",
  "5050", "5060", "5070", "5080", "5090"]);

export function findGpu(s) {
  // NVIDIA: the number decides the family, so "GTX 2070" (a common typo) still lands on the RTX 2070.
  const nv = /\b(?:(rtx|gtx|gt)[ \t]*)?(\d{3,4})(?:[ \t]*(ti[ \t]*super|ti|super)|(s))?\b(?:[ \t]*(\d{1,2})[ \t]?(?:gb|go|g)\b)?/g;
  for (const m of s.matchAll(nv)) {
    if (!NV_MODELS.has(m[2])) continue;
    if (!m[1] && /^\s*(\$|c\$|w\b|mhz|\d)/.test(s.slice(m.index + m[0].length))) continue;
    if (!m[1] && !m[3] && !m[4] && !m[5]) continue; // a bare number alone is too risky (prices, years)
    const n = Number(m[2]);
    const fam = n >= 2000 ? "RTX" : "GTX";
    const tier = m[4] ? "super" : m[3]; // "1660S" is the SUPER
    const suf = tier ? " " + tier.replace(/\s+/, " ").replace("ti", "Ti").replace("super", "SUPER") : "";
    const base = `GeForce ${fam} ${m[2]}${suf}`;
    const hit = lookup(GPU_SCORES, [m[5] ? `${base} ${m[5]}GB` : base, base]);
    if (hit) return hit;
  }
  // "3080zotac": model glued to the board maker.
  const glued = s.match(/\b([2-5]0[5-9]0)(?=zotac|evga|msi|asus|gigabyte|pny|palit|gainward)/);
  if (glued) { const hit = lookup(GPU_SCORES, [`GeForce RTX ${glued[1]}`]); if (hit) return hit; }
  let m = s.match(/\brx\s*(\d{3,4})\s*(xtx|xt|gre)?\b/);
  if (m) {
    const base = `Radeon RX ${m[1]}`;
    const hit = lookup(GPU_SCORES, [m[2] ? `${base} ${m[2].toUpperCase()}` : base, base]);
    if (hit) return hit;
  }
  m = s.match(/\barc\s*([ab]\d{3})\b/);
  if (m) {
    const hit = lookup(GPU_SCORES, [`Intel Arc ${m[1].toUpperCase()}`]);
    if (hit) return hit;
  }
  m = s.match(/\b(rtx|gtx|radeon|rx)\b/);
  return m ? { unknown: m[1].toUpperCase() } : null;
}

const RAM_SIZES = new Set([2, 4, 6, 8, 12, 16, 20, 24, 32, 48, 64, 96, 128]);
export function findRam(s) {
  const pats = [
    /(\d{1,3})[ \t]?(?:gb|go|g)\b[ \t]*(?:de[ \t]+)?(?:ram|mémoire|memoire|memory|ddr[ \t]?[345])/,
    /(?:ram|mémoire|memoire|memory)[ \t]*[:\-]?[ \t]*(\d{1,3})[ \t]?(?:gb|go|g)\b/,
  ];
  for (const p of pats) {
    const m = s.match(p);
    if (m && RAM_SIZES.has(Number(m[1]))) {
      const ddr = s.match(/ddr\s?([345])/);
      return { gb: Number(m[1]), ddr: ddr ? Number(ddr[1]) : null };
    }
  }
  return null;
}

export function findStorage(s) {
  const out = [];
  const type = t => (/hdd|dd\b|disque|hard/.test(t) ? "hdd" : "ssd");
  const size = (n, u) => Number(n.replace(",", ".")) * (/^t/.test(u) ? 1000 : 1);
  for (const m of s.matchAll(/(\d+(?:[.,]\d+)?)[ \t]?(tb|to|gb|go|g)\b[ \t]*(?:de[ \t]+)?(nvme|ssd|m\.?2|hdd|dd\b|disque dur|hard drive)/g))
    out.push({ gb: size(m[1], m[2]), type: type(m[3]) });
  for (const m of s.matchAll(/\b(nvme|ssd|m\.?2|hdd)[ \t]*[:\-][ \t]*(\d+(?:[.,]\d+)?)[ \t]?(tb|to|gb|go|g)\b/g))
    out.push({ gb: size(m[2], m[3]), type: type(m[1]) });
  return out.filter(d => d.gb >= 60 && d.gb <= 20000);
}

export function findPsu(s) {
  const w = s.match(/\b(\d{3,4})\s?w(?:att)?s?\b/);
  const r = s.match(/\b(bronze|gold|platinum|platine|titanium)\b/) || s.match(/80\s?\+?\s*(or)\b/);
  const watts = w ? Number(w[1]) : null;
  if (!watts || watts < 250 || watts > 2000) return r ? { watts: null, rating: r[1] } : null;
  return { watts, rating: r ? r[1].replace("platine", "platinum").replace(/^or$/, "gold") : null };
}

// Words that make a listing something other than a whole desktop PC, judged on the title.
const NOT_PC = /\b(moniteur|monitor|carte vid[ée]o|boitier|boîtier|carte m[èe]re|compte|j'ach[èe]te|probl[èe]me avec votre|\d{3}\s?hz)\b/;
const PC_WORD = /\b(pc|ordi|ordinateur|odinateur|computer|tour|tower|setup|set up|desktop)\b/;
const LAPTOP_MODEL = /\b(zephyrus|tuf gaming [af]\d\d|nitro v?\s?\d+|legion \d|omen \d\d|predator helios|katana|stealth \d\d|blade \d\d)\b/;

export function findFlags(s, title = "") {
  const t = title.toLowerCase();
  return {
    oem: /\b(alienware|dell|optiplex|hp|lenovo|acer|cyberpower|ibuypower)\b/.test(s),
    // Desktop listings often list "laptop" among accepted trades, so only the title and model names count.
    laptop: /\b(laptop|portable|notebook)\b/.test(t) || LAPTOP_MODEL.test(s),
    notPc: NOT_PC.test(t) || (!PC_WORD.test(t) && /\b(rtx|gtx|rx)\s*\d{3,4}/.test(t) && !/\b(i[3579]|ryzen|core|xeon)\b/.test(t)),
    parts: /pour pi[èe]ces?|for parts|ne fonctionne pas|ne marche pas|ne d[ée]marre pas|ne s'allume pas|d[ée]fectueu|bris[ée]e?\b|qui fait (ç|s)a\b/.test(s),
    trade: /^\s*(échange|echange|trade)\b/.test(t) || /\b(échange|echange) (seulement|only)\b/.test(s),
    custom: /fait sur demande|sur mesure|custom build|on demand/.test(s),
    store: /expédié par|shipped by|\binc\b/.test(s),
    firm: /prix ferme|\bferme\b|\bfirm\b|no lowball|pas de lowball|non n[ée]gociable/.test(s),
    open: /n[ée]gociable|\bn[ée]go\b|\bobo\b|ouvert aux offres|best offer/.test(s) && !/non n[ée]gociable/.test(s),
    windows: /\bwin(?:dows)?\s?1[01]\b/.test(s),
  };
}

export function parseListing(raw) {
  const text = normalize(raw);
  const s = text.toLowerCase();
  const { price, oldPrice } = parsePrice(text);
  return {
    title: parseTitle(text),
    price, oldPrice,
    town: parseTown(text),
    ageDays: parseAgeDays(text),
    cpu: findCpu(s),
    gpu: findGpu(s),
    ram: findRam(s),
    storage: findStorage(s),
    psu: findPsu(s),
    flags: findFlags(s, parseTitle(text)),
  };
}
