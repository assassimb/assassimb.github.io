/* Console-themed main composition, ported from console-main.jsx */
import { useState, useEffect, useCallback } from "react";
import { RESUME as RM } from "./data.js";
import { tc, Token, ConsoleIcon, Avatar, EntryCard, DetailPanel } from "./components/parts.jsx";
import PrintDoc from "./components/PrintDoc.jsx";
import { countEvent } from "./lib/analytics.js";
import "./styles/print.css";

/* Appearance settings. In the Claude artifact these were live-editable via the
   in-canvas "Tweaks" panel (host-only chrome). For the standalone site they are
   fixed to the design defaults. Flip these to retheme. */
const TWEAKS = {
  accent: "#5cf2c4",
  density: "regular", // "compact" | "regular" | "comfy"
  grid: true,
  glow: true,
};

/* PDF export.
   window.print() against the print stylesheet, rather than a PDF library:
   the output stays vector text (selectable, ATS-parseable, accents intact),
   it costs zero dependencies, and it cannot rot. The trade is that the
   browser owns the dialog: the user picks "Save as PDF" as the destination.

   Browsers derive the suggested filename from document.title, so we swap it
   for the duration of the print and restore it on afterprint. */
function useExportPdf(lang) {
  return useCallback(() => {
    /* Counted before the dialog opens, because print() blocks synchronously in
       most browsers. This records that an export happened and in which
       language, nothing about who did it. */
    countEvent(`pdf-export-${lang}`, `PDF export (${lang.toUpperCase()})`);

    const original = document.title;
    const slug = RM.person.name.replace(/\W+/g, "_").replace(/^_+|_+$/g, "");
    document.title = `${slug}_CV_${lang.toUpperCase()}`;
    const restore = () => {
      document.title = original;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    // Safari resolves print() asynchronously and may never fire afterprint.
    setTimeout(restore, 1500);
  }, [lang]);
}

function NavBar({ lang, setLang, onJump, onExport }) {
  const s = RM.ui.sections;
  const links = [
    ["experience", s.experience],
    ["university", s.university],
    ["education", s.education],
    ["knowledge", s.knowledge]
  ];
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); onJump("top"); }}>
          <span className="dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span className="brand-path">assim_b<span className="brand-ext">.cv</span></span>
        </a>
        <nav className="nav">
          {links.map(([id, label]) => (
            <a key={id} href={"#" + id} onClick={(e) => { e.preventDefault(); onJump(id); }}>
              {tc(label, lang)}
            </a>
          ))}
        </nav>
        <div className="lang-toggle" role="group" aria-label="Language">
          <button className={lang === "fr" ? "on" : ""} onClick={() => setLang("fr")}>fr</button>
          <span className="lang-sep">/</span>
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>en</button>
        </div>
        <button className="pdf-export" onClick={onExport} title={tc(RM.ui.exportHint, lang)}>
          <ConsoleIcon name="download" />
          <span>{tc(RM.ui.exportLabel, lang)}</span>
        </button>
      </div>
    </header>
  );
}

function Hero({ lang }) {
  const p = RM.person;
  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="prompt">$</span> {tc(p.title, lang)}<span className="cursor" aria-hidden="true"></span>
          </div>
          <h1 className="hero-name">{p.name}</h1>
          <p className="hero-tagline">{tc(p.tagline, lang)}</p>
          <div className="hero-contact">
            <a className="cline" href={"mailto:" + p.email}>
              <span className="ckey">email</span><span className="cval">{p.email}</span>
            </a>
            <span className="cline">
              <span className="ckey">location</span><span className="cval">{tc(p.location, lang)}</span>
            </span>
          </div>
        </div>
        <div className="hero-right">
          <Avatar text={p.initials} size={132} src="/me.png" alt={p.name} />
        </div>
      </div>
    </section>
  );
}

function SectionHead({ index, title }) {
  return (
    <div className="sec-head">
      <span className="sec-index">{index}</span>
      <h2>{title}</h2>
      <span className="sec-rule" aria-hidden="true"></span>
    </div>
  );
}

function SideCard({ index, title, children }) {
  return (
    <div className="side-card">
      <div className="side-head"><span className="side-index">{index}</span>{title}</div>
      {children}
    </div>
  );
}

export default function App() {
  const tw = TWEAKS;
  const [lang, setLang] = useState(() => localStorage.getItem("resume-lang") || "fr");
  const [openId, setOpenId] = useState(null);

  useEffect(() => { localStorage.setItem("resume-lang", lang); }, [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
    const b = document.body;
    b.style.setProperty("--accent", tw.accent);
    b.setAttribute("data-density", tw.density);
    b.setAttribute("data-grid", tw.grid ? "on" : "off");
    b.setAttribute("data-glow", tw.glow ? "on" : "off");
  }, [lang, tw.accent, tw.density, tw.grid, tw.glow]);

  const all = [...RM.experience.map(e => ({ e, kind: "experience" })),
               ...RM.university.map(e => ({ e, kind: "university" }))];
  const idx = all.findIndex(x => x.e.id === openId);
  const current = idx >= 0 ? all[idx] : null;

  const jump = useCallback((id) => {
    if (id === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 76, behavior: "smooth" });
  }, []);

  const s = RM.ui.sections;
  const exportPdf = useExportPdf(lang);

  return (
    <>
    <div className="page">
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="bg-glow" aria-hidden="true"></div>

      <NavBar lang={lang} setLang={setLang} onJump={jump} onExport={exportPdf} />
      <Hero lang={lang} />

      <main className="layout">
        <div className="main-col">
          <section id="experience" className="block">
            <SectionHead index="01" title={tc(s.experience, lang)} />
            <div className="entries">
              {RM.experience.map((e, i) => (
                <EntryCard key={e.id} entry={e} lang={lang} kind="experience" index={i}
                  reveal onOpen={() => setOpenId(e.id)} />
              ))}
            </div>
          </section>

          <section id="university" className="block">
            <SectionHead index="02" title={tc(s.university, lang)} />
            <div className="entries">
              {RM.university.map((e, i) => (
                <EntryCard key={e.id} entry={e} lang={lang} kind="university" index={i}
                  reveal onOpen={() => setOpenId(e.id)} />
              ))}
            </div>
          </section>
        </div>

        <aside className="aside">
          <div id="education">
            <SideCard index="03" title={tc(s.education, lang)}>
              <ul className="edu-list">
                {RM.education.map((e, i) => (
                  <li key={i}>
                    <div className="edu-period">{e.period}</div>
                    <div className="edu-degree">{tc(e.degree, lang)}</div>
                    <div className="edu-school">{tc(e.school, lang)}</div>
                  </li>
                ))}
              </ul>
            </SideCard>
          </div>

          <SideCard index="04" title={tc(s.skills, lang)}>
            <ul className="skill-list">
              {RM.skills.map((sk, i) => (
                <li key={i}>
                  <span className="skill-ic"><ConsoleIcon name={sk.icon} /></span>
                  <div>
                    <div className="skill-title">{tc(sk.title, lang)}</div>
                    <p className="skill-body">{tc(sk.body, lang)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SideCard>

          <div id="knowledge">
            <SideCard index="05" title={tc(s.knowledge, lang)}>
              <div className="know-label">{tc(RM.ui.languages, lang)}</div>
              <div className="tokens-wrap">
                {RM.knowledge.languages.map((c, i) => <Token key={i}>{c}</Token>)}
              </div>
              <div className="know-label" style={{ marginTop: 16 }}>{tc(RM.ui.tools, lang)}</div>
              <div className="tokens-wrap">
                {RM.knowledge.tools.map((c, i) => <Token key={i}>{c}</Token>)}
              </div>
            </SideCard>
          </div>

          <SideCard index="06" title={tc(s.interests, lang)}>
            <ul className="skill-list">
              {RM.interests.map((it, i) => (
                <li key={i}>
                  <span className="skill-ic"><ConsoleIcon name={it.icon} /></span>
                  <div>
                    <div className="skill-title">{tc(it.title, lang)}</div>
                    <p className="skill-body">{tc(it.body, lang)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SideCard>
        </aside>
      </main>

      <footer className="site-foot">
        <span className="foot-path">assim_b.cv</span>
        <span className="foot-end">{lang === "fr" ? "fin du dossier" : "end of file"}</span>
      </footer>

      {current && (
        <DetailPanel
          entry={current.e} kind={current.kind} lang={lang}
          onClose={() => setOpenId(null)}
          onPrev={() => setOpenId(all[idx - 1].e.id)}
          onNext={() => setOpenId(all[idx + 1].e.id)}
          hasPrev={idx > 0} hasNext={idx < all.length - 1}
        />
      )}
    </div>

    {/* Always mounted, hidden on screen. Kept a sibling of .page because
        .page is display:none in print. Mounting unconditionally means the
        browser's own Ctrl+P also produces the résumé, not just the button. */}
    <PrintDoc lang={lang} resume={RM} />
    </>
  );
}
