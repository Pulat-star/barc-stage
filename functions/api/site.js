// Ommaviy: sayt uchun mahsulotlar, matnlar va kontaktlar
import { json, productOut, parseJSON } from "../../lib/server.js";

export async function onRequestGet({ env }) {
  const [p, t, s] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM products WHERE status = 'published' ORDER BY sort, created_at"),
    env.DB.prepare("SELECT lang, data FROM texts"),
    env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('contact_phone','contact_instagram','contact_telegram')"),
  ]);
  return json({
    products: p.results.map(productOut).map(({ status, sort, updated_at, ...x }) => x),
    texts: Object.fromEntries(t.results.map((r) => [r.lang, parseJSON(r.data, {})])),
    contacts: Object.fromEntries(s.results.map((r) => [r.key.replace("contact_", ""), r.value])),
  }, 200, { "cache-control": "public, max-age=0, s-maxage=20" });
}
