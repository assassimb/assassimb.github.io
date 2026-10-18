// Two stores: this browser keeps the visitor's own recent searches (localStorage),
// and the computah API keeps every analysed listing for the admin view.
const KEY = "computah-searches-v1";
const MAX = 50;
export const API = location.hostname === "localhost" ? "http://localhost:8799" : "https://computah-api.assassimb.workers.dev";

export function loadRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

// Same listing analysed again (same link, or same title and price) replaces the old entry.
export function record(entry) {
  const list = loadRecent().filter(e => e.id !== entry.id &&
    !(entry.link && e.link === entry.link) && !(e.title === entry.title && e.price === entry.price));
  list.unshift(entry);
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* private mode: recents just won't stick */ }
  send(entry);
  return list;
}

// Fire and forget: a down server must not break the analysis.
function send(entry) {
  fetch(`${API}/searches`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry), keepalive: true })
    .catch(() => {});
}

// Admin calls throw "unauthorized" on a wrong password and "offline" when the server can't be reached.
async function admin(password, path, init = {}) {
  let res;
  try {
    res = await fetch(`${API}/admin${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${password}` } });
  } catch { throw new Error("offline"); }
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error("server");
  return res.json();
}

export async function listingCount() {
  try { const r = await fetch(`${API}/stats`); return r.ok ? (await r.json()).count : null; } catch { return null; }
}

export const adminList = pw => admin(pw, "/searches");
export const adminDelete = (pw, id) => admin(pw, `/searches/${encodeURIComponent(id)}`, { method: "DELETE" });
export const adminImport = (pw, list) => admin(pw, "/import", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(list),
});
