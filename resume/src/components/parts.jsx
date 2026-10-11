/* Console-themed resume components, ported from console-components.jsx */
import { useEffect, useRef } from "react";
import { RESUME as RC } from "../data.js";
import { t as tc } from "../lib/i18n.js";

export { tc };

export function Token({ children }) {
  return <span className="tok">{children}</span>;
}

export function ConsoleIcon({ name, className = "" }) {
  return <span className={"material-symbols-outlined " + className} aria-hidden="true">{name}</span>;
}

export function Avatar({ text, size = 56, src, alt }) {
  return (
    <div className={"avatar" + (src ? " avatar-photo" : "")}
      style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {src ? <img src={src} alt={alt || text} /> : text}
    </div>
  );
}

/* "01/2024 – Présent" → { start, end, months }. months is null when either
   side is a bare year ("2017 – 2018"), since a duration would be a guess. */
export function parsePeriod(period) {
  const [start, end = ""] = period.split(/\s*[–-]\s*/);
  const mmyyyy = (s) => {
    const m = s.match(/^(\d{2})\/(\d{4})$/);
    return m ? { m: +m[1], y: +m[2] } : null;
  };
  const a = mmyyyy(start);
  const now = new Date();
  const b = /^\d/.test(end) ? mmyyyy(end) : { m: now.getMonth() + 1, y: now.getFullYear() };
  const months = a && b ? (b.y - a.y) * 12 + (b.m - a.m) + 1 : null;
  return { start, end: /^\d/.test(end) ? end : null, months };
}

function formatDuration(months, lang) {
  const c = RC.ui.counts;
  const y = Math.floor(months / 12), m = months % 12;
  const part = (n, unit) => `${n} ${tc(unit, lang)[n > 1 ? 1 : 0]}`;
  if (y === 0) return part(m, c.month);
  return m === 0 ? part(y, c.year) : `${part(y, c.year)} ${part(m, c.month)}`;
}

/* Type chip color carries meaning: employment, internship, project. */
function typeKey(entry, kind) {
  if (kind === "university") return "proj";
  return entry.type.fr === "Stage" ? "intern" : "work";
}

/* experience / project entry */
export function EntryCard({ entry, lang, kind, index, onOpen, reveal }) {
  const p = parsePeriod(tc(entry.period, lang));
  return (
    <button
      className={"entry" + (reveal ? " reveal" : "")}
      style={{ animationDelay: (index * 70) + "ms" }}
      onClick={() => onOpen(entry)}
    >
      <span className="entry-edge" aria-hidden="true"></span>
      <div className="entry-when">
        <span>{p.start}</span>
        <span>→ {p.end || tc(RC.ui.counts.present, lang)}</span>
        {p.months && <small>{formatDuration(p.months, lang)}</small>}
      </div>
      <div className="entry-main">
      <div className="entry-head">
        <span className="entry-tile" aria-hidden="true">{entry.orgInitial}</span>
        <div className="entry-headtext">
          <h3 className="entry-role">{tc(entry.role, lang)}</h3>
          <div className="entry-org">{entry.org}</div>
        </div>
        <span className={"entry-type type-" + typeKey(entry, kind)}>
          {tc(entry.type, lang)}
        </span>
      </div>
      <p className="entry-summary">{tc(entry.summary, lang)}</p>
      <div className="entry-foot">
        <div className="entry-stack">
          {entry.stack.slice(0, 4).map((s, i) => <Token key={i}>{tc(s, lang)}</Token>)}
          {entry.stack.length > 4 && <span className="entry-more">+{entry.stack.length - 4}</span>}
        </div>
        <span className="entry-cta">
          {tc(RC.ui.detail.open, lang)} <ConsoleIcon name="arrow_forward" />
        </span>
      </div>
      </div>
    </button>
  );
}

export function DetailPanel({ entry, lang, kind, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const ref = useRef(null);
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  /* Once per open: lock the page behind the modal, move focus into it, and
     hand focus back to the card that opened it on close. */
  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && hasNext) onNext();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev();
      else if (e.key === "Tab") {
        // Keep Tab cycling inside the panel (aria-modal).
        const f = [...panelRef.current.querySelectorAll("button:not(:disabled), a[href]")];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    if (ref.current) ref.current.scrollTop = 0;
    return () => document.removeEventListener("keydown", onKey);
  }, [entry, hasPrev, hasNext]);

  const d = RC.ui.detail;
  const file = entry.id + (kind === "university" ? ".proj" : ".log");

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="detail-role">
      <div className="scrim" onClick={onClose}></div>
      <aside className="panel" ref={panelRef}>
        <div className="panel-bar">
          <span className="panel-file">{file}</span>
          <button className="x-btn" ref={closeRef} onClick={onClose} aria-label={tc(d.close, lang)}>
            <ConsoleIcon name="close" />
          </button>
        </div>

        <div className="panel-body" ref={ref}>
          <header className="panel-hero">
            <Avatar text={entry.orgInitial} size={58} />
            <div>
              <div className="panel-type">{tc(entry.type, lang)}</div>
              <h2 className="panel-role" id="detail-role">{tc(entry.role, lang)}</h2>
              <div className="panel-meta">
                <span><ConsoleIcon name="business" />{entry.org}</span>
                <span><ConsoleIcon name="calendar_month" />{tc(entry.period, lang)}</span>
                <span><ConsoleIcon name="location_on" />{tc(entry.location, lang)}</span>
              </div>
            </div>
          </header>

          <section className="dblock">
            <h4 className="dlabel"># {tc(d.overview, lang)}</h4>
            <p className="doverview">{tc(entry.overview, lang)}</p>
          </section>

          <section className="dblock">
            <h4 className="dlabel"># {tc(d.responsibilities, lang)}</h4>
            <ul className="dlist">
              {tc(entry.responsibilities, lang).map((it, i) => (
                <li key={i}><span className="mk">›</span>{it}</li>
              ))}
            </ul>
          </section>

          <section className="dblock">
            <h4 className="dlabel"># {tc(d.stack, lang)}</h4>
            <div className="dtokens">
              {entry.stack.map((s, i) => <Token key={i}>{tc(s, lang)}</Token>)}
            </div>
          </section>

          <section className="dblock">
            <h4 className="dlabel"># {tc(d.impact, lang)}</h4>
            <ul className="dlist impact">
              {tc(entry.impact, lang).map((it, i) => (
                <li key={i}><span className="mk">+</span>{it}</li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="panel-foot">
          <button className="nav-btn" onClick={onPrev} disabled={!hasPrev}>
            <ConsoleIcon name="arrow_back" />{tc(d.prev, lang)}
          </button>
          <button className="nav-btn" onClick={onNext} disabled={!hasNext}>
            {tc(d.next, lang)}<ConsoleIcon name="arrow_forward" />
          </button>
        </footer>
      </aside>
    </div>
  );
}
