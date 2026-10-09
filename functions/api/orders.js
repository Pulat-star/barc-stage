// Ommaviy: yangi buyurtma (to'lovsiz). Narx yo'q — operator qo'ng'iroq qiladi.
import { json, bad, readJSON, clientIp, hit, normalizePhone, now, LANGS, getSettings, telegram, escHtml } from "../../lib/server.js";

export async function onRequestPost({ request, env, waitUntil }) {
  let body;
  try { body = await readJSON(request, 20_000); } catch { return bad("bad_json"); }
  const ip = clientIp(request);
  if (!(await hit(env.DB, `order:${ip}`, 60_000, 3))) return bad("too_many", 429);

  const phone = normalizePhone(body.phone);
  if (!phone) return bad("phone");
  if (!(await hit(env.DB, `order-phone:${phone}`, 3_600_000, 5))) return bad("too_many", 429);

  const wanted = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  const { results: prods } = await env.DB.prepare("SELECT id, name FROM products WHERE status = 'published'").all();
  const byId = Object.fromEntries(prods.map((p) => [p.id, p]));
  const items = wanted
    .map((x) => ({ id: String(x.productSlug || x.id || ""), qty: Math.floor(+x.quantity || +x.qty || 0) }))
    .filter((x) => byId[x.id] && x.qty >= 1 && x.qty <= 99)
    .map((x) => ({ id: x.id, name: byId[x.id].name, qty: x.qty }));
  if (!items.length) return bad("items");

  const name = String(body.name || "").trim().slice(0, 60);
  const comment = String(body.comment || "").trim().slice(0, 400);
  const locale = LANGS.includes(body.locale) ? body.locale : "uz";
  const source = ["home", "product", "range"].includes(body.sourcePage) ? body.sourcePage : "home";
  const itemsJson = JSON.stringify(items);
  const t = now();

  // Bir xil raqam + bir xil tarkib 10 daqiqa ichida — eski buyurtma qaytadi
  const dup = await env.DB.prepare("SELECT order_no FROM orders WHERE phone = ? AND items = ? AND created_at > ?")
    .bind(phone, itemsJson, t - 600_000).first();
  if (dup) return json({ orderNo: dup.order_no, duplicate: true });

  const qty = items.reduce((a, b) => a + b.qty, 0);
  const res = await env.DB.prepare(
    "INSERT INTO orders (items, qty_total, phone, name, comment, locale, source, status, ip, created_at, updated_at) VALUES (?,?,?,?,?,?,?,'new',?,?,?)"
  ).bind(itemsJson, qty, phone, name, comment, locale, source, ip, t, t).run();
  const id = res.meta.last_row_id;
  const orderNo = "BARC-" + String(id).padStart(6, "0");
  await env.DB.batch([
    env.DB.prepare("UPDATE orders SET order_no = ? WHERE id = ?").bind(orderNo, id),
    env.DB.prepare("INSERT INTO order_events (order_id, at, kind, text) VALUES (?, ?, 'created', ?)").bind(id, t, "Saytdan keldi"),
  ]);

  waitUntil((async () => {
    const s = await getSettings(env.DB);
    const lines = [
      `🆕 <b>Yangi buyurtma ${orderNo}</b>`,
      ...items.map((i) => `📦 ${escHtml(i.name)} × ${i.qty}`),
      `📞 ${phone}`,
      name && `👤 ${escHtml(name)}`,
      comment && `💬 ${escHtml(comment)}`,
      `🌐 ${locale.toUpperCase()} · ${source}`,
    ].filter(Boolean);
    await telegram(s.tg_token, s.tg_chat, lines.join("\n"));
  })().catch(() => {}));

  return json({ orderNo });
}
