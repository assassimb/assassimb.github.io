/* =====================================================================
   tally.js: aggregate visit counting via GoatCounter.
   (Named "tally", not "analytics": ad blockers block any module URL matching
   *analytics*, which in dev kills the whole import graph and blanks the page.)

   WHAT THIS DOES NOT DO, deliberately: it does not store IP addresses, set
   cookies, fingerprint devices, or let you identify an individual visitor.
   GoatCounter derives a daily salted hash purely to separate a returning
   visitor from a new one and discards it; there is no per-person record to
   query, by design. That is why no consent banner is required for it under
   PIPEDA or Quebec's Law 25, and it is also why it answers the question
   worth asking: is anyone actually reading this, and did they take the CV.

   SETUP, one step, required before anything is sent:
     1. Register a site at https://www.goatcounter.com (free for personal use).
     2. Put the subdomain you chose in SITE_CODE below.
   Until SITE_CODE is set, every function here is a no-op and no request is
   made. Failing closed is intentional: an unconfigured build must stay silent
   rather than pointing at someone else's dashboard.
   ===================================================================== */

/* Dashboard and counting endpoint: https://assim.goatcounter.com */
const SITE_CODE = "assim";

/* The counter script is served from GoatCounter's CDN, NOT from your own
   subdomain. https://assim.goatcounter.com/count.js is a 404; only the
   data-goatcounter attribute below carries the per-site subdomain. */
const SCRIPT_SRC = "https://gc.zgo.at/count.js";

const endpoint = () => `https://${SITE_CODE}.goatcounter.com/count`;

/** Honour the browser-level opt-outs before loading anything at all. */
function optedOut() {
  return (
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1" ||
    navigator.globalPrivacyControl === true
  );
}

/**
 * Inject the counter. Safe to call more than once.
 * Skipped entirely in dev, so local work never pollutes real numbers.
 */
export function initAnalytics() {
  if (!SITE_CODE) return;
  if (!import.meta.env.PROD) return;
  if (optedOut()) return;
  if (document.querySelector("script[data-goatcounter]")) return;

  const s = document.createElement("script");
  s.async = true;
  s.src = SCRIPT_SRC;
  s.setAttribute("data-goatcounter", endpoint());
  document.head.appendChild(s);
}

/**
 * Record a named event, not a person.
 *
 * `count.js` loads async, so this is a no-op until it has arrived; an early
 * click is simply not counted rather than queued. Losing the occasional
 * event is the right trade against holding state to replay it later.
 *
 * @param {string} name  short slug, e.g. "pdf-export-fr"
 * @param {string} [title] human label shown in the dashboard
 */
export function countEvent(name, title) {
  if (!SITE_CODE) return;
  const gc = typeof window !== "undefined" && window.goatcounter;
  if (!gc || typeof gc.count !== "function") return;
  gc.count({ path: name, title: title || name, event: true });
}
