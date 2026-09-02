/* =====================================================================
   condense.js: site content graph → concise, flat résumé document.

   ZERO IMPORTS BY DESIGN. This module is pure data-in / data-out so it can
   be unit-tested, or executed in any bare JS engine, without React, without
   a DOM and without a bundler. Everything visual lives in PrintDoc.jsx.

   The site shows information progressively: a card gives you `summary` plus
   four stack chips, and the full overview / responsibilities / impact only
   appear once you open the detail panel. A résumé cannot do that. It is one
   flat surface with a hard page budget. So the job here is not restyling,
   it is re-shaping: ~75 source bullets down to ~17.

   Pipeline: localize → rank → pool → score → dedupe → select → trim → assemble
   ===================================================================== */

/* ---------- 1. localize ---------- */

/* Mirrors lib/i18n.js `t`, re-declared locally to keep this module import-free. */
function pick(v, lang) {
  if (v == null) return "";
  if (typeof v === "object" && !Array.isArray(v) && (("fr" in v) || ("en" in v))) {
    return v[lang] ?? v.fr ?? "";
  }
  return v;
}

function pickList(v, lang) {
  const out = pick(v, lang);
  return Array.isArray(out) ? out : [];
}

/* ---------- 2. presets ---------- */

/* `bullets` and `levels` are indexed by entry position, most recent first, so
   both decay with recency. A level of "line" means the entry still appears,
   employment continuity matters, but argues nothing and costs one line. */
export const PRESETS = {
  onepage: {
    id: "onepage",
    bullets: [4, 3, 3, 2, 1, 0, 0],
    levels: ["full", "full", "full", "full", "brief", "line", "line"],
    stackCap: { full: 6, brief: 4, line: 0 },
    projects: { max: 2, bullets: 1, level: "brief", stackCap: 4 },
    includeInterests: false,
    includeSoftSkills: false,
    includeProjects: true,
    taglineMax: 155,
    bulletMax: 178,
    lineSummaryMax: 96,
    dedupeThreshold: 0.45
  },

  /* Kept as a working alternative: same pipeline, looser budget. Not wired to
     any UI control today; flip DEFAULT_PRESET or pass a preset to build(). */
  standard: {
    id: "standard",
    bullets: [6, 5, 4, 3, 3, 2, 1],
    levels: ["full", "full", "full", "full", "full", "brief", "brief"],
    stackCap: { full: 8, brief: 5, line: 0 },
    projects: { max: 2, bullets: 2, level: "full", stackCap: 5 },
    includeInterests: true,
    includeSoftSkills: true,
    includeProjects: true,
    taglineMax: 240,
    bulletMax: 220,
    lineSummaryMax: 120,
    dedupeThreshold: 0.5
  }
};

export const DEFAULT_PRESET = "onepage";

/* ---------- 3. text utilities ---------- */

const STOPWORDS = new Set([
  // fr
  "le","la","les","de","des","du","un","une","et","au","aux","en","dans","pour","par",
  "sur","avec","sans","que","qui","quoi","ce","cet","cette","ces","son","sa","ses","leur",
  "leurs","est","sont","etre","avoir","plus","afin","lors","tout","tous","toute","toutes",
  "ainsi","tant","chaque","entre","vers","selon","depuis","apres","avant","meme","aussi",
  "notamment","lorsque","dont","nos","mes","ils","elle","elles","nous","vous",
  // en
  "the","and","or","of","to","in","for","on","with","by","from","at","as","is","are","be",
  "was","were","that","this","it","its","their","into","across","while","them","they",
  "our","been","have","has","had","not","but","than","then","also","such","each",
  "both","when","where","which","who","whom","his","her","out","up","over","under"
]);

/** Strip diacritics so "intégrer" and "integrer" collide. */
function deaccent(s) {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Crude 6-character prefix stem. Deliberately dumb, and effective on this
    corpus: paiement/paiements → "paieme", terminal/terminaux → "termin",
    intégrer/intégration → "integr". A real stemmer would be two dependencies
    and would not measurably beat this on 75 bullets. */
function stem(w) {
  return w.length > 6 ? w.slice(0, 6) : w;
}

/** Content-word bag used for similarity. */
function bag(text) {
  const words = deaccent(String(text).toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return new Set(words.map(stem));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

/* Action verbs: French infinitives (how `responsibilities` are written) plus
   English past tense (how the EN translations are written). A bullet that
   opens on one of these reads as evidence rather than as description. */
const ACTION_RE = new RegExp(
  "^(?:" +
    // fr
    "integr|automat|develop|program|concev|conce|conc|mett|met|implement|refactor|" +
    "stabilis|contribu|collabor|cre|realis|resou|assur|ger|utilis|appliqu|segment|" +
    "present|offr|aid|inform|support|ajout|suiv|trait|verifi|modifi|liv|reduit|" +
    "reduir|optimis|travaill|deploy|deplo|" +
    // en
    "integrated|automated|developed|implemented|contributed|worked|stabilized|" +
    "collaborated|designed|programmed|created|built|resolved|ensured|managed|used|" +
    "applied|segmented|presented|provided|helped|informed|supported|added|followed|" +
    "processed|verified|modified|delivered|enabled|reduced|led|wired|linked|guided|" +
    "made|shipped|refactored|migrated|optimized|deployed" +
  ")",
  "i"
);

/* Clause boundaries, most preferred first. Truncation only ever happens at one
   of these, because a résumé bullet cut mid-clause reads as a typo. */
const CLAUSE_MARKS = [" -- ", ", tout en ", ", while ", ", including ",
  ", incluant ", " afin de ", " in order to ", ", et ", ", and ", ", ", " : ", "; "];

/**
 * Truncate at a clause boundary, or not at all.
 * Integrity beats budget: if there is no clean cut inside the acceptable
 * window we return the bullet untouched rather than mangle it.
 */
function trimClause(text, max) {
  const s = String(text).trim();
  if (s.length <= max) return s;

  const floor = Math.floor(max * 0.55); // don't amputate more than ~45%
  let best = -1;
  for (const mark of CLAUSE_MARKS) {
    const at = s.lastIndexOf(mark, max);
    if (at > floor && at > best) best = at;
  }
  if (best < 0) return s;

  let cut = s.slice(0, best).replace(/[\s,;:–-]+$/, "");
  // never end on a dangling conjunction
  cut = cut.replace(/\s+(?:et|and|ou|or|avec|with|pour|for|de|du|des|the|a|an)$/i, "");
  if (!/[.!?]$/.test(cut)) cut += ".";
  return cut;
}

/* ---------- 4. scoring ---------- */

/**
 * Rank a candidate bullet for résumé value.
 * Quantified > names real technology > opens on an action verb > generic.
 */
function score(text, stackBags, origin) {
  const s = String(text);
  let n = 0;

  /* A number is a claim a reader can check, and it is the scarcest thing in
     this corpus. Weighted above a single technology mention on purpose: an
     earlier tuning had them tied at 4, and "delivered in under 4 months" lost
     the tiebreak to "Programmed a web interface with VueJS". */
  if (/\d/.test(s)) n += 4;
  if (ACTION_RE.test(deaccent(s).trim())) n += 2; // evidence framing
  if (origin === "impact") n += 1;                // outcomes read stronger than duties

  const b = bag(s);
  let hits = 0;
  const stackWords = new Set();
  for (const sb of stackBags) {
    let matched = false;
    for (const w of sb) { if (b.has(w)) { stackWords.add(w); matched = true; } }
    if (matched) hits++;
  }
  if (hits > 0) n += 2 + Math.min(hits - 1, 2);   // +2, then +1 each, capped

  /* Penalise bullets that are mostly a technology enumeration. "Programmed in
     PHP, SQL, HTML and JavaScript" collects a large stack bonus while saying
     nothing the stack line above it does not already say. Measured by the
     share of content words that are themselves stack tokens. */
  if (b.size > 0 && stackWords.size / b.size > 0.35) n -= 4;

  if (s.length > 190) n -= 2;                     // too long to survive trimming well
  if (s.length < 45) n -= 1;                      // too thin to earn its line

  return n;
}

/* ---------- 5–7. pool → dedupe → select → trim ---------- */

/**
 * Merge `responsibilities` and `impact` into one de-duplicated, budgeted list.
 *
 * These two arrays are redundant by construction. Omnimed carries both
 * "Integrated PAX payment terminals … to enable wireless, in-app payment
 * creation" and "Enabled wireless in-clinic payments … through PAX terminals".
 * Concatenating them naively produces a résumé that says everything twice, so
 * near-duplicates are collapsed to whichever scored higher.
 */
function buildBullets(entry, lang, n, preset) {
  if (n <= 0) return [];

  const stackBags = (entry.stack || []).map((s) => bag(pick(s, lang)));

  /* Author override. Scoring gets the common case right, but it cannot judge
     that "modified SuiteCRM's native behaviour" says more about the work than
     "used a Docker environment and a GitLab repo": both are action-led and
     name real tooling. Rather than over-fit the heuristic, an entry may list
     `pinned` substrings; any candidate containing one is always selected.
     Substrings, not indices, so reordering data.js cannot silently break it. */
  const pins = entry.pinned || [];
  const pinned = (t) => pins.some((p) => t.includes(p));

  const pool = [
    ...pickList(entry.responsibilities, lang).map((t, i) => ({ t, origin: "resp", i })),
    ...pickList(entry.impact, lang).map((t, i) => ({ t, origin: "impact", i: 1000 + i }))
  ].map((c) => ({
    ...c,
    s: score(c.t, stackBags, c.origin) + (pinned(c.t) ? 100 : 0),
    b: bag(c.t)
  }));

  // dedupe: walk best-first, keep a candidate only if it is novel vs everything kept
  const kept = [];
  for (const c of [...pool].sort((a, z) => z.s - a.s)) {
    const dup = kept.some((k) => jaccard(k.b, c.b) >= preset.dedupeThreshold);
    if (!dup) kept.push(c);
    if (kept.length >= n) break;
  }

  // restore source order so the narrative still reads as authored
  return kept
    .sort((a, z) => a.i - z.i)
    .map((c) => trimClause(c.t, preset.bulletMax));
}

/* ---------- 8. assemble ---------- */

/**
 * Reduce an entry location to the part that is not already stated in the
 * masthead. "Québec, Canada (Hybride)" gives "Hybride"; a bare
 * "Québec, Canada" gives "" (the header says it once, seven repeats are
 * noise); a project's "Équipe de 8 étudiants" is kept, because it is not a
 * location at all. At print scale this is worth ~3.5 mm per entry, which is
 * a whole bullet.
 */
function locationNote(entry, lang, homeLocation) {
  const loc = pick(entry.location, lang).trim();
  if (!loc) return "";

  const paren = loc.match(/\(([^)]+)\)\s*$/);
  if (paren) return paren[1].trim();

  return loc === homeLocation.trim() ? "" : loc;
}

function buildEntry(entry, lang, level, nBullets, stackCap, preset, homeLocation) {
  const note = locationNote(entry, lang, homeLocation);
  const out = {
    id: entry.id,
    level,
    role: pick(entry.role, lang),
    org: entry.org,
    period: pick(entry.period, lang),
    location: note,
    type: pick(entry.type, lang),
    /* One right-aligned run, so each entry costs a single header row instead
       of three. Rendered verbatim by PrintDoc. */
    meta: [pick(entry.type, lang), pick(entry.period, lang), note].filter(Boolean).join(" · "),
    stack: [],
    summary: "",
    bullets: []
  };

  if (level === "line") {
    out.summary = trimClause(pick(entry.summary, lang), preset.lineSummaryMax);
    return out;
  }

  out.stack = (entry.stack || []).slice(0, stackCap).map((s) => pick(s, lang));
  out.bullets = buildBullets(entry, lang, nBullets, preset);
  if (!out.bullets.length) {
    out.summary = trimClause(pick(entry.summary, lang), preset.lineSummaryMax);
  }
  return out;
}

/**
 * Build the flat résumé document rendered by PrintDoc.
 *
 * @param {object} RESUME  the data.js graph
 * @param {object} opts    { lang: "fr"|"en", preset: "onepage"|"standard" }
 * @returns {object} ResumeDoc, shaped { lang, preset, header, sections[] }
 */
export function buildResumeDoc(RESUME, opts = {}) {
  const lang = opts.lang === "en" ? "en" : "fr";
  const preset = PRESETS[opts.preset] || PRESETS[DEFAULT_PRESET];
  const ui = RESUME.ui || {};
  const S = ui.sections || {};

  const p = RESUME.person || {};
  const header = {
    name: p.name || "",
    title: pick(p.title, lang),
    tagline: trimClause(pick(p.tagline, lang), preset.taglineMax),
    email: p.email || "",
    location: pick(p.location, lang)
  };

  const sections = [];

  /* experience: budget decays with position */
  const experience = (RESUME.experience || []).map((e, i) => {
    const level = preset.levels[i] || "line";
    const n = preset.bullets[i] ?? 0;
    return buildEntry(e, lang, level, n, preset.stackCap[level] ?? 0, preset, header.location);
  });
  if (experience.length) {
    sections.push({ id: "experience", title: pick(S.experience, lang), kind: "entries", entries: experience });
  }

  /* university projects: unique embedded / signal-processing range that none
     of the professional roles demonstrate. Compact, one bullet each. */
  if (preset.includeProjects) {
    const cfg = preset.projects;
    const projects = (RESUME.university || [])
      .slice(0, cfg.max)
      .map((e) => buildEntry(e, lang, cfg.level, cfg.bullets, cfg.stackCap, preset, header.location));
    if (projects.length) {
      sections.push({ id: "projects", title: pick(S.university, lang), kind: "entries", entries: projects });
    }
  }

  /* education */
  const education = (RESUME.education || []).map((e) => ({
    period: e.period,
    degree: pick(e.degree, lang),
    school: pick(e.school, lang)
  }));
  if (education.length) {
    sections.push({ id: "education", title: pick(S.education, lang), kind: "education", items: education });
  }

  /* technical knowledge: comma-joined runs, never chips: chip markup parses
     badly in ATS and wastes vertical space at print scale. */
  const k = RESUME.knowledge || {};
  const groups = [];
  if (k.languages?.length) groups.push({ label: pick(ui.languages, lang), items: k.languages });
  if (k.tools?.length) groups.push({ label: pick(ui.tools, lang), items: k.tools });
  if (groups.length) {
    sections.push({ id: "knowledge", title: pick(S.knowledge, lang), kind: "groups", groups });
  }

  /* soft skills and interests: off under the one-page budget */
  if (preset.includeSoftSkills && RESUME.skills?.length) {
    sections.push({
      id: "skills", title: pick(S.skills, lang), kind: "traits",
      items: RESUME.skills.map((s) => ({ title: pick(s.title, lang), body: pick(s.body, lang) }))
    });
  }
  if (preset.includeInterests && RESUME.interests?.length) {
    sections.push({
      id: "interests", title: pick(S.interests, lang), kind: "inline",
      items: RESUME.interests.map((s) => pick(s.title, lang))
    });
  }

  return { lang, preset: preset.id, header, sections };
}

/* Exported for tests / tuning. */
export const __internals = { bag, jaccard, score, trimClause, stem, deaccent };
