// Server yordamchilari (Cloudflare Pages Functions)

export const LANGS = ["uz", "ru", "en", "ar"];
export const STATUSES = ["new", "called", "confirmed", "delivered", "cancelled"];
export const now = () => Date.now();

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
export const bad = (msg, status = 400) => json({ error: msg }, status);

export async function readJSON(request, limit = 200_000) {
  const len = +request.headers.get("content-length") || 0;
  if (len > limit) throw new Error("too_large");
  const text = await request.text();
  if (text.length > limit) throw new Error("too_large");
  return text ? JSON.parse(text) : {};
}

export const clientIp = (request) => request.headers.get("cf-connecting-ip") || "0.0.0.0";

export function uid(len = 12) {
  const b = crypto.getRandomValues(new Uint8Array(len));
  return [...b].map((x) => "abcdefghijkmnpqrstuvwxyz23456789"[x % 32]).join("");
}

export function parseJSON(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

/* ---------- Tezlik cheklovi (D1 jadvalida) ---------- */
export async function hit(db, key, windowMs, max) {
  const t = now();
  const { c } = await db.prepare("SELECT COUNT(*) AS c FROM hits WHERE key = ? AND at > ?").bind(key, t - windowMs).first();
  if (c >= max) return false;
  await db.prepare("INSERT INTO hits (key, at) VALUES (?, ?)").bind(key, t).run();
  if (Math.random() < .05) await db.prepare("DELETE FROM hits WHERE at < ?").bind(t - 86_400_000).run();
  return true;
}

/* ---------- Telefon: faqat O'zbekiston, E.164 ---------- */
export function normalizePhone(input) {
  let d = String(input || "").replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  else if (d.length === 10 && d.startsWith("8")) d = d.slice(1);
  if (d.length !== 9) return null;
  return "+998" + d;
}

/* ---------- Parol va sessiya ---------- */
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export async function hashPassword(password, salt = uid(16)) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100_000, hash: "SHA-256" }, key, 256);
  return `${salt}$${b64u(bits)}`;
}
export async function checkPassword(env, password) {
  if (!password) return false;
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'admin_pass'").first();
  if (row) {
    const [salt] = row.value.split("$");
    return safeEqual(await hashPassword(password, salt), row.value);
  }
  return !!env.ADMIN_PASSWORD && safeEqual(password, env.ADMIN_PASSWORD);
}

const COOKIE = "barc_admin";
const SESSION_MS = 7 * 86_400_000;
export async function makeSession(env) {
  const exp = now() + SESSION_MS;
  const ver = await sessionVersion(env);
  const sig = await hmac(env.SESSION_SECRET, `${exp}.${ver}`);
  return `${COOKIE}=${exp}.${ver}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MS / 1000}`;
}
export const clearSession = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
async function sessionVersion(env) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'session_ver'").first();
  return row ? row.value : "1";
}
export async function isAuthed(request, env) {
  if (!env.SESSION_SECRET) return false;
  const m = (request.headers.get("cookie") || "").match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, ver, sig] = m[1].split(".");
  if (!exp || !sig || +exp < now()) return false;
  if (ver !== await sessionVersion(env)) return false;
  return safeEqual(sig, await hmac(env.SESSION_SECRET, `${exp}.${ver}`));
}

/* ---------- Mahsulot qatori → JSON ---------- */
export function productOut(r) {
  return {
    id: r.id, sort: r.sort, status: r.status, name: r.name, color: r.color,
    theme: parseJSON(r.theme, {}), pack: r.pack, atmo: r.atmo,
    gallery: parseJSON(r.gallery, []), i18n: parseJSON(r.i18n, {}),
    updated_at: r.updated_at,
  };
}

/* ---------- Telegram ---------- */
export async function getSettings(db) {
  const { results } = await db.prepare("SELECT key, value FROM settings WHERE key NOT IN ('admin_pass','session_ver')").all();
  return Object.fromEntries(results.map((r) => [r.key, r.value]));
}
export async function telegram(token, chatId, text) {
  if (!token || !chatId) return { ok: false, skipped: true };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  return res.json().catch(() => ({ ok: false }));
}
export const escHtml = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
