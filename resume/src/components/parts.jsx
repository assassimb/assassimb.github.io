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

/* experience / project entry */
export function EntryCard({ entry, lang, kind, index, onOpen, reveal }) {
  return (
    <button
      className={"entry" + (reveal ? " reveal" : "")}
      style={{ animationDelay: (index * 70) + "ms" }}
      onClick={() => onOpen(entry)}
    >
      <span className="entry-edge" aria-hidden="true"></span>
      <div className="entry-head">
        <div className="entry-headtext">
          <h3 className="entry-role">{tc(entry.role, lang)}</h3>
          <div className="entry-orgline">
            <span className="entry-org">{entry.org}</span>
            <span className="entry-dot">·</span>
            <span className="entry-period">{tc(entry.period, lang)}</span>
          </div>
        </div>
        <span className={"entry-type type-" + (kind === "university" ? "proj" : "work")}>
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
    </button>
  );
}

export function DetailPanel({ entry, lang, kind, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const ref = useRef(null);
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && hasNext) onNext();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev();
    }
    document.addEventListener("keydown", onKey);
    if (ref.current) ref.current.scrollTop = 0;
    return () => document.removeEventListener("keydown", onKey);
  }, [entry, hasPrev, hasNext]);

  const d = RC.ui.detail;
  const file = entry.id + (kind === "university" ? ".proj" : ".log");

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="scrim" onClick={onClose}></div>
      <aside className="panel">
        <div className="panel-bar">
          <span className="panel-file">{file}</span>
          <button className="x-btn" onClick={onClose} aria-label={tc(d.close, lang)}>
            <ConsoleIcon name="close" />
          </button>
        </div>

        <div className="panel-body" ref={ref}>
          <header className="panel-hero">
            <Avatar text={entry.orgInitial} size={58} />
            <div>
              <div className="panel-type">{tc(entry.type, lang)}</div>
              <h2 className="panel-role">{tc(entry.role, lang)}</h2>
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
