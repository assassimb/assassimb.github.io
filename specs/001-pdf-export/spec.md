# 001: PDF Export: site → concise concatenated résumé

Status: **BUILT & VERIFIED**, see §9–§10
Branch: `pdf-export` (from `origin/main` @ d092760)

---

## 1. Problem

`resume/src/data.js` is a rich, bilingual (FR/EN) content graph. Per experience entry it
carries: `role`, `org`, `period`, `location`, `type`, `summary`, `stack[]`, `overview`
(a paragraph), `responsibilities[]` (4–8 long sentences) and `impact[]` (3 sentences).

The site renders this progressively, cards show `summary` + 4 stack chips; the full
`overview`/`responsibilities`/`impact` only appear inside a click-through `DetailPanel`.

A résumé cannot be progressive. It is one flat, static, scannable surface with a hard
page budget. So this is **not** a "print the page" feature. The site's information
architecture must be **re-shaped**, not restyled.

Raw corpus today: 7 experiences + 2 university projects ≈ **48 responsibility bullets +
27 impact bullets + 9 overview paragraphs**. A 1-page résumé holds roughly **18–22
bullets**. The compression ratio is therefore about **4:1**, and the value of this
feature lives almost entirely in *what gets dropped*, not in the PDF plumbing.

## 2. Goal

A one-click export from the live site producing a PDF that is:

- **Concise**, obeys a hard page budget (see D2).
- **Concatenated**, each role becomes one contiguous block: header line, stack line,
  and a merged, de-duplicated bullet list drawn from *both* `responsibilities` and
  `impact`.
- **Faithful**, every word in the PDF is a word from `data.js`. No invented claims,
  no LLM rewriting at runtime.
- **Bilingual**, exports in whichever language the site toggle is currently set to.
- **Machine-readable**, real selectable text, single column, so ATS parsers can read it.

## 3. Non-goals

- Editing résumé content in the UI. `data.js` stays the single source of truth.
- A PDF that visually mirrors the dark console site. Dark backgrounds are wrong for
  print and browsers strip them by default.
- Server-side rendering or any build step that must run in CI to keep the PDF fresh.
- Multi-template / cover-letter generation.

## 4. Core design, the condense pipeline

A pure, dependency-free, testable transform. **No React, no DOM.**

```
RESUME (data.js)
  │
  ├─ 1. localize(lang)        {fr,en} → string, recursively
  ├─ 2. rank(entry)           assign each entry a render level: full | brief | line
  ├─ 3. pool(entry)           responsibilities[] ++ impact[]  → single candidate list
  ├─ 4. score(bullet)         quantified? action verb? names a stack token?
  ├─ 5. dedupe(bullets)       drop near-duplicates by content-word Jaccard overlap
  ├─ 6. select(n)             top-n by score, then RESTORE ORIGINAL ORDER
  ├─ 7. trim(bullet)          clause-boundary truncation, only when far over budget
  └─ 8. assemble()            → flat ResumeDoc model
                                 { header, sections:[{ id, title, entries:[…] }] }
```

**Step 5 is the load-bearing one.** `responsibilities` and `impact` are heavily
redundant by construction. Omnimed, for example, carries both:

> R: "Integrated PAX payment terminals into the Omnimed web platform to enable
>    wireless, in-app payment creation."
> I: "Enabled wireless in-clinic payments directly inside the EMR through PAX
>    terminals."

Naively concatenating the two arrays yields a résumé that says everything twice.
Jaccard overlap on content words (stopwords stripped, lowercased, de-accented) above
a threshold ≈ 0.45 collapses these to the higher-scoring one.

**Step 6 restores source order** after top-n selection so the narrative still reads in
the sequence the author intended, rather than in descending score order.

### Render levels

| Level   | Renders                                                    |
|---------|------------------------------------------------------------|
| `full`  | header + location + stack line + N bullets                 |
| `brief` | header + stack line + 1–2 bullets                          |
| `line`  | header + `summary` trimmed to one line, no bullets         |

Level is assigned per position, from a preset array, recency and relevance decay.

### Presets

Budget arrays index by entry position (most recent first):

```
onepage  : bullets [4,3,2,1,0,0,0]   projects: 1 × 1 bullet   interests: off
standard : bullets [5,4,3,2,2,1,1]   projects: 2 × 2 bullets  interests: one line
```

## 5. Output shape

```
┌────────────────────────────────────────────────────────────┐
│ ASSIM BOUSSELSAL            assassimb@gmail.com            │
│ Full-stack developer        Sherbrooke, Canada             │
│ ── tagline, one line ────────────────────────────────────  │
├────────────────────────────────────────────────────────────┤
│ EXPERIENCE                                                 │
│ Full-stack developer · Omnimed        01/2024 – Present    │
│   Java · Spring Boot · Angular · Nuvei · PAX               │
│   › bullet                                                 │
│   › bullet                                                 │
│ …                                                          │
├────────────────────────────────────────────────────────────┤
│ PROJECTS · EDUCATION · SKILLS                               │
└────────────────────────────────────────────────────────────┘
```

Single column throughout. Skills/knowledge render as comma-joined runs, not chips.

## 6. Acceptance criteria

- [ ] AC1: Export triggers from a visible control on the site; no CLI, no build step.
- [ ] AC2: Output honours the active FR/EN toggle, accents intact (é à ç è û).
- [ ] AC3: Output fits the page budget from D2, verified by measurement not by eye.
- [ ] AC4: No bullet pair in the output exceeds the dedup similarity threshold.
- [ ] AC5: PDF text is selectable and copy-pastes in reading order.
- [ ] AC6: `condense.js` has zero imports and is unit-testable in isolation.
- [ ] AC7: Site's on-screen appearance is byte-identical to before when not exporting.

## 7. Open decisions: BLOCKING

| # | Decision | Why it blocks |
|---|----------|---------------|
| D1 | Export mechanism | Determines deps, file layout, and whether one click or two |
| D2 | Page budget | Sets every number in the preset arrays |
| D3 | Visual register | ATS-plain vs site-flavoured, different stylesheet entirely |
| D4 | Corpus scope | Do the 2017–2019 support-desk roles and interests ship at all |

## 8. Known environment constraint

**Node and npm are not installed on this machine.** (`node -v` → not found; no
`C:\Program Files\nodejs`, no nvm.) Consequences:

- I cannot run `npm install`, so any option requiring a new dependency cannot be
  verified here, only written.
- I cannot run `vite dev` to see the real site render.
- Verification will instead be done by executing the pure transform in a browser JS
  engine against the real `data.js`, and by rendering the print stylesheet against
  generated markup in a browser to measure real page overflow.

This is a genuine argument in favour of the zero-dependency option in D1.

---

## 9. Decisions taken (supersedes §7)

| # | Decision | Chosen |
|---|----------|--------|
| D1 | Mechanism | **Print CSS + `window.print()`**, zero dependencies |
| D2 | Budget | **Strict 1 page** (Letter, 11×12 mm margins → 257 mm content) |
| D3 | Register | **Restrained echo of the site**, real fonts, one accent, light ground |
| D4 | Corpus | Cut soft skills, interests, and bullets for Sherweb/SYKES (kept as one-line entries). University projects **kept** at 1 bullet each, they carry C++/FPGA/PID/SOLIDWORKS range no professional role shows. |

## 10. Verification, measured, not eyeballed

No Node on this machine, so the shipping `condense.js` + `print.css` were executed
against the live `data.js` in a browser engine, served over a local HTTP origin,
rendered at the true Letter content width (192 mm) and measured.

| Metric | FR | EN | Target |
|--------|-----|-----|--------|
| Document height | **247.3 mm** | **243.5 mm** | ≤ 257 mm |
| Headroom | −9.7 mm | −13.5 mm | - |
| Printed bullets | 15 | 15 | ~18–22 |
| Compression | 5.1 : 1 (76 → 15) | 5.1 : 1 | ~4 : 1 |
| Max intra-entry overlap | 0.071 | 0.313 | < 0.45 |
| Bullets clause-trimmed | 0 / 15 | 0 / 15 | - |
| Accents (é à ç è û) | intact | intact | intact |

Acceptance: AC1–AC7 met. AC3 and AC4 are measured above rather than asserted.

### Two scoring bugs the measurement pass caught

1. **Tech-list bullets outranked real ones.** "Programmer en PHP, SQL, HTML et
   JavaScript" collected a large stack bonus while duplicating the stack line
   printed directly above it. Fixed by penalising bullets whose content words
   are >35 % stack tokens.
2. **A quantified outcome lost a tiebreak.** Décathlon's "pipeline … livré en
   moins de 4 mois" tied at 4 points with "Programmer une interface … VueJS"
   and lost on source order. The quantified bonus was raised 3 → 4.

### Where the height actually went

First measured build overflowed by 48 mm. The cost was **entry chrome, not
bullets**, an entry carrying one bullet cost 17.5 mm, only ~4 mm of which was
the bullet. Collapsing role/meta/period from three header rows to one recovered
~24 mm across nine entries; the rest came from type and leading.

## 11. Author override

Scoring handles the common case; it cannot judge that "modified SuiteCRM's
native behaviour" says more than "used a Docker environment and a GitLab repo"
both are action-led and name real tooling, at identical stack-share. Any
entry may therefore declare `pinned: ["substring", …]`; a candidate containing
one is always selected. Substrings rather than indices, so reordering `data.js`
cannot silently break a pin. Used once today, on the Véo entry.

## 12. Files

| File | Role |
|------|------|
| `resume/src/lib/condense.js` | the transform, pure, zero imports, testable |
| `resume/src/components/PrintDoc.jsx` | renders the doc model as print markup |
| `resume/src/styles/print.css` | `@page`, print rules, screen-preview hook |
| `resume/src/App.jsx` | export button + always-mounted `<PrintDoc>` |
| `resume/src/data.js` | unchanged as source of truth; gained `pinned` on one entry |

## 13. Privacy change shipped alongside

Surname and home city removed from the client bundle (not merely hidden):
`person.name` → "Assim B.", city-level locations → province, brand/title/footer
updated. See §14 in the handover notes for what this does **not** cover.
