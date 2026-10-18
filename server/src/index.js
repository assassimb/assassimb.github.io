// computah API (Cloudflare Worker + D1).
//   POST   /searches             anyone: record one analysed listing
//   GET    /admin/searches       admin: every listing, newest first
//   POST   /admin/import         admin: bulk upsert (array)
//   DELETE /admin/searches/:id   admin: delete one
//   DELETE /admin/searches       admin: delete all
// Admin calls send "Authorization: Bearer <password>", checked against the ADMIN_PASSWORD secret.

const MAX_ENTRY_BYTES = 20_000;
const MAX_IMPORT = 1000;
const FIELDS = ["id", "at", "link", "text", "title", "town", "price", "oldPrice", "ageDays", "km", "cpu", "gpu", "ram",
  "storage", "value", "buy", "verdict", "target", "odds", "overrides", "cpuPick", "gpuPick"];

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      const res = await route(request, env);
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    } catch (err) {
      return json({ error: err.expose ? err.message : "server error" }, err.status || 500, cors);
    }
  },
};

async function route(request, env) {
  const { pathname } = new URL(request.url);
  const m = request.method;

  if (m === "GET" && pathname === "/health") return json({ ok: true });
  if (m === "POST" && pathname === "/searches") {
    await upsert(env, clean(await body(request)));
    return json({ ok: true });
  }

  if (pathname.startsWith("/admin/")) {
    await requireAdmin(request, env);
    if (m === "GET" && pathname === "/admin/searches") {
      const { results } = await env.DB.prepare("SELECT data FROM searches ORDER BY at DESC LIMIT 5000").all();
      return json(results.map(r => JSON.parse(r.data)));
    }
    if (m === "POST" && pathname === "/admin/import") {
      const list = await body(request, MAX_ENTRY_BYTES * MAX_IMPORT);
      if (!Array.isArray(list) || list.length > MAX_IMPORT) throw fail(400, `expected an array of at most ${MAX_IMPORT}`);
      let n = 0;
      for (const e of list) { try { await upsert(env, clean(e)); n++; } catch { /* skip malformed rows */ } }
      return json({ imported: n });
    }
    if (m === "DELETE" && pathname === "/admin/searches") {
      await env.DB.prepare("DELETE FROM searches").run();
      return json({ ok: true });
    }
    const del = pathname.match(/^\/admin\/searches\/([^/]+)$/);
    if (m === "DELETE" && del) {
      await env.DB.prepare("DELETE FROM searches WHERE id = ?").bind(decodeURIComponent(del[1])).run();
      return json({ ok: true });
    }
  }
  throw fail(404, "not found");
}

// Same link analysed again replaces the older row, whatever its id.
async function upsert(env, e) {
  const link = e.link || null;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM searches WHERE link = ? AND id <> ?").bind(link, e.id),
    env.DB.prepare("INSERT OR REPLACE INTO searches (id, at, link, data) VALUES (?, ?, ?, ?)").bind(e.id, e.at, link, JSON.stringify(e)),
  ]);
}

function clean(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw fail(400, "expected an object");
  const e = {};
  for (const k of FIELDS) if (raw[k] !== undefined) e[k] = raw[k];
  if (typeof e.id !== "string" || !/^[\w-]{1,80}$/.test(e.id)) throw fail(400, "bad id");
  e.at = typeof e.at === "string" && !Number.isNaN(Date.parse(e.at)) ? new Date(e.at).toISOString() : new Date().toISOString();
  if (e.link && !/^https:\/\/(www\.|m\.)?facebook\.com\/marketplace\/item\/\d+\/?$/.test(e.link)) e.link = null;
  if (typeof e.text === "string") e.text = e.text.slice(0, 4000);
  if (JSON.stringify(e).length > MAX_ENTRY_BYTES) throw fail(413, "entry too large");
  return e;
}

async function requireAdmin(request, env) {
  const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!env.ADMIN_PASSWORD || !given) throw fail(401, "unauthorized");
  const [a, b] = await Promise.all([sha256(given), sha256(env.ADMIN_PASSWORD)]);
  if (!crypto.subtle.timingSafeEqual(a, b)) throw fail(401, "unauthorized");
}

const sha256 = s => crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));

async function body(request, limit = MAX_ENTRY_BYTES) {
  const text = await request.text();
  if (text.length > limit) throw fail(413, "body too large");
  try { return JSON.parse(text); } catch { throw fail(400, "invalid JSON"); }
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
  if (!allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });
}

function fail(status, message) {
  return Object.assign(new Error(message), { status, expose: true });
}
