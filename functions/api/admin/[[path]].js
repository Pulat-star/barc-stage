// Admin API: /api/admin/*
import {
  json, bad, readJSON, clientIp, hit, now, uid, parseJSON, LANGS, STATUSES,
  checkPassword, hashPassword, makeSession, clearSession, isAuthed, productOut,
  getSettings, telegram, normalizePhone,
} from "../../../lib/server.js";

const MAX_MEDIA = 1_900_000;                       // D1 qator chegarasi ~2 MB
const MIMES = ["image/webp", "image/png", "image/jpeg"];
const STATUS_UZ = { new: "Yangi", called: "Qo‘ng‘iroq qilindi", confirmed: "Tasdiqlandi", delivered: "Yetkazildi", cancelled: "Bekor qilindi" };

export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  const path = "/" + (params.path || []).join("/");
  const method = request.method;
  try {
    if (!env.DB) return bad("db_missing", 500);
    if (path === "/login" && method === "POST") return login(request, env);
    if (path === "/logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": clearSession() });
    if (!(await isAuthed(request, env))) return bad("auth", 401);
    // CSRF: faqat o'z saytimizdan
    if (method !== "GET") {
      const origin = request.headers.get("origin");
      if (origin && new URL(origin).host !== new URL(request.url).host) return bad("origin", 403);
    }
    return await route(path, method, request, env);
  } catch (e) {
    if (e.message === "too_large") return bad("too_large", 413);
    return bad("server: " + e.message, 500);
  }
}

async function login(request, env) {
  const ip = clientIp(request);
  if (!(await hit(env.DB, `login:${ip}`, 15 * 60_000, 10))) return bad("too_many", 429);
  const { password } = await readJSON(request, 2000).catch(() => ({}));
  if (!(await checkPassword(env, password))) {
    await new Promise((r) => setTimeout(r, 700));
    return bad("wrong", 401);
  }
  return json({ ok: true }, 200, { "set-cookie": await makeSession(env) });
}

async function route(path, method, request, env) {
  const db = env.DB;
  const url = new URL(request.url);
  let m;

  if (path === "/me") return json({ ok: true });

  /* ---------------- Boshqaruv paneli ---------------- */
  if (path === "/stats" && method === "GET") {
    const dayStart = startOfDayTashkent(now());
    const [byStatus, today, week, series, recent, prodCount] = await db.batch([
      db.prepare("SELECT status, COUNT(*) c FROM orders GROUP BY status"),
      db.prepare("SELECT COUNT(*) c FROM orders WHERE created_at >= ?").bind(dayStart),
      db.prepare("SELECT COUNT(*) c FROM orders WHERE created_at >= ?").bind(dayStart - 6 * 86_400_000),
      db.prepare("SELECT ((created_at + 18000000) / 86400000) d, COUNT(*) c FROM orders WHERE created_at >= ? GROUP BY d").bind(dayStart - 13 * 86_400_000),
      db.prepare("SELECT id, order_no, phone, name, items, status, created_at FROM orders ORDER BY created_at DESC LIMIT 6"),
      db.prepare("SELECT COUNT(*) c, SUM(status='published') p FROM products"),
    ]);
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    byStatus.results.forEach((r) => (counts[r.status] = r.c));
    const firstDay = Math.floor((dayStart + 18_000_000) / 86_400_000) - 13;
    const map = Object.fromEntries(series.results.map((r) => [r.d, r.c]));
    return json({
      counts, total: Object.values(counts).reduce((a, b) => a + b, 0),
      today: today.results[0].c, week: week.results[0].c,
      series: Array.from({ length: 14 }, (_, i) => ({ day: (firstDay + i) * 86_400_000 - 18_000_000, c: map[firstDay + i] || 0 })),
      recent: recent.results.map(orderOut),
      products: { total: prodCount.results[0].c, published: prodCount.results[0].p || 0 },
    });
  }

  /* ---------------- Buyurtmalar (CRM) ---------------- */
  if (path === "/orders" && method === "GET") {
    const { where, args } = orderFilter(url);
    const page = Math.max(1, +url.searchParams.get("page") || 1), per = 30;
    const [rows, total, counts] = await db.batch([
      db.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...args, per, (page - 1) * per),
      db.prepare(`SELECT COUNT(*) c FROM orders ${where}`).bind(...args),
      db.prepare("SELECT status, COUNT(*) c FROM orders GROUP BY status"),
    ]);
    return json({
      items: rows.results.map(orderOut), total: total.results[0].c, page, per,
      counts: Object.fromEntries(counts.results.map((r) => [r.status, r.c])),
    });
  }
  if (path === "/orders.csv" && method === "GET") {
    const { where, args } = orderFilter(url);
    const { results } = await db.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT 5000`).bind(...args).all();
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Raqam", "Sana", "Holat", "Telefon", "Ism", "Mahsulotlar", "Jami qadoq", "Izoh (mijoz)", "Menejer izohi", "Til", "Manba"];
    const lines = results.map((r) => [
      r.order_no, new Date(r.created_at + 18_000_000).toISOString().slice(0, 16).replace("T", " "), STATUS_UZ[r.status] || r.status,
      r.phone, r.name, parseJSON(r.items, []).map((i) => `${i.name} × ${i.qty}`).join("; "), r.qty_total, r.comment, r.note, r.locale, r.source,
    ].map(esc).join(","));
    return new Response("﻿" + [head.map(esc).join(","), ...lines].join("\n"), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="barc-buyurtmalar.csv"` },
    });
  }
  if ((m = path.match(/^\/orders\/(\d+)$/))) {
    const id = +m[1];
    if (method === "GET") {
      const [o, ev, same] = await db.batch([
        db.prepare("SELECT * FROM orders WHERE id = ?").bind(id),
        db.prepare("SELECT * FROM order_events WHERE order_id = ? ORDER BY at DESC").bind(id),
        db.prepare("SELECT COUNT(*) c FROM orders WHERE phone = (SELECT phone FROM orders WHERE id = ?) AND id != ?").bind(id, id),
      ]);
      if (!o.results[0]) return bad("not_found", 404);
      return json({ ...orderOut(o.results[0]), events: ev.results, otherOrders: same.results[0].c });
    }
    if (method === "PATCH") {
      const body = await readJSON(request);
      const o = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
      if (!o) return bad("not_found", 404);
      const t = now(), stmts = [];
      if (body.status && body.status !== o.status) {
        if (!STATUSES.includes(body.status)) return bad("status");
        stmts.push(db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").bind(body.status, t, id));
        stmts.push(db.prepare("INSERT INTO order_events (order_id, at, kind, text) VALUES (?, ?, 'status', ?)").bind(id, t, `${STATUS_UZ[o.status]} → ${STATUS_UZ[body.status]}`));
      }
      if (typeof body.note === "string" && body.note !== o.note) {
        stmts.push(db.prepare("UPDATE orders SET note = ?, updated_at = ? WHERE id = ?").bind(body.note.slice(0, 2000), t, id));
        stmts.push(db.prepare("INSERT INTO order_events (order_id, at, kind, text) VALUES (?, ?, 'note', ?)").bind(id, t, body.note.slice(0, 200) || "Izoh o‘chirildi"));
      }
      if (stmts.length) await db.batch(stmts);
      return json({ ok: true });
    }
    if (method === "DELETE") {
      await db.batch([
        db.prepare("DELETE FROM order_events WHERE order_id = ?").bind(id),
        db.prepare("DELETE FROM orders WHERE id = ?").bind(id),
      ]);
      return json({ ok: true });
    }
  }
  if (path === "/orders" && method === "POST") {           // menejer qo'lda qo'shadi (telefon orqali kelgan)
    const body = await readJSON(request);
    const phone = normalizePhone(body.phone);
    if (!phone) return bad("phone");
    const items = (body.items || []).filter((i) => i.qty > 0).map((i) => ({ id: String(i.id), name: String(i.name).slice(0, 60), qty: Math.min(99, Math.floor(i.qty)) }));
    if (!items.length) return bad("items");
    const t = now();
    const r = await db.prepare("INSERT INTO orders (items, qty_total, phone, name, comment, locale, source, status, created_at, updated_at) VALUES (?,?,?,?,?,'uz','manual','new',?,?)")
      .bind(JSON.stringify(items), items.reduce((a, b) => a + b.qty, 0), phone, String(body.name || "").slice(0, 60), String(body.comment || "").slice(0, 400), t, t).run();
    const id = r.meta.last_row_id, orderNo = "BARC-" + String(id).padStart(6, "0");
    await db.batch([
      db.prepare("UPDATE orders SET order_no = ? WHERE id = ?").bind(orderNo, id),
      db.prepare("INSERT INTO order_events (order_id, at, kind, text) VALUES (?, ?, 'created', 'Admin paneldan qo‘shildi')").bind(id, t),
    ]);
    return json({ id, orderNo });
  }

  /* ---------------- Mahsulotlar ---------------- */
  if (path === "/products" && method === "GET") {
    const { results } = await db.prepare("SELECT * FROM products ORDER BY sort, created_at").all();
    return json({ items: results.map(productOut) });
  }
  if (path === "/products" && method === "POST") {
    const p = cleanProduct(await readJSON(request));
    if (p.error) return bad(p.error);
    if (await db.prepare("SELECT 1 FROM products WHERE id = ?").bind(p.id).first()) return bad("slug_taken");
    const { s } = await db.prepare("SELECT COALESCE(MAX(sort), 0) + 1 s FROM products").first();
    const t = now();
    await db.prepare("INSERT INTO products (id, sort, status, name, color, theme, pack, atmo, gallery, i18n, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(p.id, s, p.status, p.name, p.color, p.theme, p.pack, p.atmo, p.gallery, p.i18n, t, t).run();
    return json({ ok: true, id: p.id });
  }
  if (path === "/products/reorder" && method === "POST") {
    const { ids } = await readJSON(request);
    if (!Array.isArray(ids)) return bad("ids");
    await db.batch(ids.map((id, i) => db.prepare("UPDATE products SET sort = ? WHERE id = ?").bind(i + 1, String(id))));
    return json({ ok: true });
  }
  if ((m = path.match(/^\/products\/([a-z0-9-]+)$/))) {
    const id = m[1];
    if (method === "GET") {
      const r = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
      return r ? json(productOut(r)) : bad("not_found", 404);
    }
    if (method === "PUT") {
      const p = cleanProduct({ ...(await readJSON(request)), id });
      if (p.error) return bad(p.error);
      const r = await db.prepare("UPDATE products SET status=?, name=?, color=?, theme=?, pack=?, atmo=?, gallery=?, i18n=?, updated_at=? WHERE id = ?")
        .bind(p.status, p.name, p.color, p.theme, p.pack, p.atmo, p.gallery, p.i18n, now(), id).run();
      return r.meta.changes ? json({ ok: true }) : bad("not_found", 404);
    }
    if (method === "DELETE") {
      await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }
  }

  /* ---------------- Rasmlar ---------------- */
  if (path === "/media" && method === "POST") {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return bad("file");
    if (!MIMES.includes(file.type)) return bad("type");
    if (file.size > MAX_MEDIA) return bad("too_large", 413);
    const buf = await file.arrayBuffer();
    const id = uid(14);
    await db.prepare("INSERT INTO media (id, mime, data, size, w, h, name, created_at) VALUES (?,?,?,?,?,?,?,?)")
      .bind(id, file.type, buf, buf.byteLength, +form.get("w") || null, +form.get("h") || null, String(form.get("name") || "").slice(0, 120), now()).run();
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    return json({ id, url: `/media/${id}.${ext}`, size: buf.byteLength });
  }

  /* ---------------- Matnlar ---------------- */
  if (path === "/texts" && method === "GET") {
    const { results } = await db.prepare("SELECT lang, data, updated_at FROM texts").all();
    return json(Object.fromEntries(results.map((r) => [r.lang, { data: parseJSON(r.data, {}), updated_at: r.updated_at }])));
  }
  if ((m = path.match(/^\/texts\/(uz|ru|en|ar)$/)) && method === "PUT") {
    const { data } = await readJSON(request, 400_000);
    if (!data || typeof data !== "object") return bad("data");
    const clean = {};
    for (const [k, v] of Object.entries(data)) if (/^[a-z0-9.]+$/i.test(k) && typeof v === "string" && v.trim()) clean[k] = v.slice(0, 2000);
    await db.prepare("INSERT INTO texts (lang, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(lang) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
      .bind(m[1], JSON.stringify(clean), now()).run();
    return json({ ok: true, count: Object.keys(clean).length });
  }

  /* ---------------- Sozlamalar ---------------- */
  if (path === "/settings" && method === "GET") {
    const s = await getSettings(db);
    return json({ ...s, tg_token: s.tg_token ? "•••••" + s.tg_token.slice(-4) : "", tg_token_set: !!s.tg_token });
  }
  if (path === "/settings" && method === "PUT") {
    const body = await readJSON(request);
    const allowed = ["tg_token", "tg_chat", "contact_phone", "contact_instagram", "contact_telegram"];
    const stmts = [];
    for (const k of allowed) {
      if (!(k in body)) continue;
      const v = String(body[k] ?? "").trim().slice(0, 300);
      if (k === "tg_token" && v.startsWith("•")) continue;     // yashirilgan qiymat — o'zgarmagan
      stmts.push(v ? db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(k, v)
                   : db.prepare("DELETE FROM settings WHERE key = ?").bind(k));
    }
    if (stmts.length) await db.batch(stmts);
    return json({ ok: true });
  }
  if (path === "/settings/telegram-test" && method === "POST") {
    const s = await getSettings(db);
    if (!s.tg_token || !s.tg_chat) return bad("tg_missing");
    const r = await telegram(s.tg_token, s.tg_chat, "✅ BÄRC admin panel: Telegram ulandi. Yangi buyurtmalar shu yerga keladi.");
    return r.ok ? json({ ok: true }) : bad(r.description || "tg_error");
  }
  if (path === "/settings/telegram-chats" && method === "GET") {   // bot qo'shilgan chatlarni topish
    const s = await getSettings(db);
    if (!s.tg_token) return bad("tg_missing");
    const r = await fetch(`https://api.telegram.org/bot${s.tg_token}/getUpdates?limit=100`).then((x) => x.json()).catch(() => null);
    if (!r || !r.ok) return bad((r && r.description) || "tg_error");
    const chats = {};
    for (const u of r.result) {
      const c = (u.message || u.my_chat_member || u.channel_post || {}).chat;
      if (c) chats[c.id] = { id: c.id, title: c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username, type: c.type };
    }
    return json({ chats: Object.values(chats) });
  }
  if (path === "/password" && method === "POST") {
    const { current, next } = await readJSON(request, 2000);
    if (!(await checkPassword(env, current))) return bad("wrong", 401);
    if (!next || String(next).length < 8) return bad("short");
    const ver = String(Date.now());
    await db.batch([
      db.prepare("INSERT INTO settings (key, value) VALUES ('admin_pass', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(await hashPassword(String(next))),
      db.prepare("INSERT INTO settings (key, value) VALUES ('session_ver', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(ver),
    ]);
    return json({ ok: true }, 200, { "set-cookie": await makeSession(env) });
  }

  return bad("not_found", 404);
}

/* ---------------- yordamchilar ---------------- */
function startOfDayTashkent(t) {               // Toshkent UTC+5
  const off = 5 * 3_600_000;
  return Math.floor((t + off) / 86_400_000) * 86_400_000 - off;
}
function orderOut(r) {
  return { id: r.id, orderNo: r.order_no, items: parseJSON(r.items, []), qty: r.qty_total, phone: r.phone, name: r.name || "",
    comment: r.comment || "", locale: r.locale, source: r.source, status: r.status, note: r.note || "", created_at: r.created_at, updated_at: r.updated_at };
}
function orderFilter(url) {
  const w = [], args = [];
  const st = url.searchParams.get("status");
  if (st && STATUSES.includes(st)) { w.push("status = ?"); args.push(st); }
  const q = (url.searchParams.get("q") || "").trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    w.push("(order_no LIKE ? OR name LIKE ? OR phone LIKE ? OR comment LIKE ? OR note LIKE ?)");
    args.push(`%${q}%`, `%${q}%`, `%${digits || q}%`, `%${q}%`, `%${q}%`);
  }
  const from = +url.searchParams.get("from"), to = +url.searchParams.get("to");
  if (from) { w.push("created_at >= ?"); args.push(from); }
  if (to) { w.push("created_at < ?"); args.push(to); }
  return { where: w.length ? "WHERE " + w.join(" AND ") : "", args };
}
const HEX = /^#[0-9a-f]{6}$/i;
const URLISH = /^(\/media\/[a-z0-9]+\.\w+|assets\/img\/[\w.-]+)$/;
function cleanProduct(b) {
  const id = String(b.id || "").toLowerCase().trim();
  if (!/^[a-z0-9-]{2,40}$/.test(id)) return { error: "slug" };
  const name = String(b.name || "").trim().slice(0, 40);
  if (!name) return { error: "name" };
  if (!HEX.test(b.color || "")) return { error: "color" };
  const th = b.theme || {};
  for (const k of ["bg", "bg2", "surface", "accent", "glow"]) if (!HEX.test(th[k] || "")) return { error: "theme" };
  if (!URLISH.test(b.pack || "")) return { error: "pack" };
  const gallery = (Array.isArray(b.gallery) ? b.gallery : []).slice(0, 8)
    .filter((g) => g && URLISH.test(g.src || ""))
    .map((g) => ({ src: g.src, cap: Object.fromEntries(LANGS.map((l) => [l, String((g.cap || {})[l] || "").slice(0, 120)])) }));
  const fields = ["scent", "line", "hook", "desc", "for"];
  const i18n = Object.fromEntries(LANGS.map((l) => [l, Object.fromEntries(fields.map((f) => [f, String(((b.i18n || {})[l] || {})[f] || "").slice(0, 800)]))]));
  if (!i18n.uz.scent || !i18n.uz.line) return { error: "uz_text" };
  return {
    id, name, status: b.status === "draft" ? "draft" : "published", color: b.color,
    theme: JSON.stringify(th), pack: b.pack, atmo: URLISH.test(b.atmo || "") ? b.atmo : "",
    gallery: JSON.stringify(gallery), i18n: JSON.stringify(i18n),
  };
}
