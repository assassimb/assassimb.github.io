/* =====================================================================
   PrintDoc.jsx: renders the condensed ResumeDoc as print markup.

   Always mounted, hidden on screen, revealed only inside @media print (see
   styles/print.css). Mounting it unconditionally means the browser's own
   Ctrl+P produces the résumé too, not just the export button.

   Markup rules, all driven by ATS parseability:
     · single column, no CSS grid/float side-by-side text
     · real <h1>/<h2>/<h3>/<ul>, in reading order
     · skills as comma-joined runs, never chips
     · nothing conveyed by colour alone
   ===================================================================== */

import { buildResumeDoc, DEFAULT_PRESET } from "../lib/condense.js";

const DOT = " · ";

function Entry({ e }) {
  return (
    <div className={"pentry pentry-" + e.level}>
      <div className="pentry-head">
        <h3 className="pentry-role">
          {e.role}
          <span className="pentry-sep">{DOT}</span>
          <span className="pentry-org">{e.org}</span>
        </h3>
        <span className="pentry-period">{e.meta}</span>
      </div>

      {e.stack.length > 0 && (
        <div className="pentry-stack">{e.stack.join(DOT)}</div>
      )}

      {e.bullets.length > 0 && (
        <ul className="pentry-bullets">
          {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}

      {e.summary && <p className="pentry-summary">{e.summary}</p>}
    </div>
  );
}

function Section({ s }) {
  return (
    <section className={"psec psec-" + s.id}>
      <h2 className="psec-title">{s.title}</h2>

      {s.kind === "entries" && s.entries.map((e) => <Entry key={e.id} e={e} />)}

      {s.kind === "education" && (
        <ul className="pedu">
          {s.items.map((it, i) => (
            <li key={i}>
              <span className="pedu-degree">{it.degree}</span>
              <span className="pedu-sep">{DOT}</span>
              <span className="pedu-school">{it.school}</span>
              <span className="pedu-period">{it.period}</span>
            </li>
          ))}
        </ul>
      )}

      {s.kind === "groups" && s.groups.map((g, i) => (
        <p key={i} className="pgroup">
          <span className="pgroup-label">{g.label}</span>
          <span className="pgroup-items">{g.items.join(", ")}</span>
        </p>
      ))}

      {s.kind === "traits" && (
        <ul className="ptraits">
          {s.items.map((it, i) => (
            <li key={i}><strong>{it.title}</strong>{DOT}{it.body}</li>
          ))}
        </ul>
      )}

      {s.kind === "inline" && <p className="pinline">{s.items.join(", ")}</p>}
    </section>
  );
}

export default function PrintDoc({ lang, preset = DEFAULT_PRESET, resume }) {
  const doc = buildResumeDoc(resume, { lang, preset });
  const h = doc.header;

  return (
    <article className="pdoc" lang={doc.lang} data-preset={doc.preset}>
      <header className="pdoc-head">
        <div className="pdoc-id">
          <h1 className="pdoc-name">{h.name}</h1>
          <div className="pdoc-title">{h.title}</div>
        </div>
        <div className="pdoc-contact">
          <a href={"mailto:" + h.email}>{h.email}</a>
          <span>{h.location}</span>
        </div>
      </header>

      {h.tagline && <p className="pdoc-tagline">{h.tagline}</p>}

      {doc.sections.map((s) => <Section key={s.id} s={s} />)}
    </article>
  );
}
