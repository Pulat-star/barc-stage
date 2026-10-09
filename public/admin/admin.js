/* BÄRC admin panel — bitta fayl, build yo'q.
   Bo'limlar: Boshqaruv · Buyurtmalar (CRM) · Mahsulotlar · Sayt matnlari · Sozlamalar */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- Ikonkalar ---------------- */
const I = {
  dash: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  orders: '<svg viewBox="0 0 24 24"><path d="M4 7h16l-1.5 11.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5z"/><path d="M8.5 7V6a3.5 3.5 0 0 1 7 0v1"/></svg>',
  products: '<svg viewBox="0 0 24 24"><path d="M6 3h12l1 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7z"/><path d="M5 7h14"/><circle cx="12" cy="13.5" r="3"/></svg>',
  texts: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h13"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  site: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1"/></svg>',
  tg: '<svg viewBox="0 0 24 24"><path d="m21 4-18 7 6 2 2 6 3-4 5 4z"/><path d="m9 13 12-9"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>',
  pipette: '<svg viewBox="0 0 24 24"><path d="m14 7 3 3M5 19l1-4 9-9a2.1 2.1 0 0 1 3 3l-9 9z"/></svg>',
  inbox: '<svg viewBox="0 0 24 24"><path d="M4 13h4l2 3h4l2-3h4"/><path d="M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
};

/* ---------------- Lug'atlar ---------------- */
const ST = { new: "Yangi", called: "Qo‘ng‘iroq qilindi", confirmed: "Tasdiqlandi", delivered: "Yetkazildi", cancelled: "Bekor qilindi" };
const NEXT = { new: ["called", "Qo‘ng‘iroq qildim"], called: ["confirmed", "Buyurtmani tasdiqlash"], confirmed: ["delivered", "Yetkazildi"] };
const LANGS = [["uz", "UZ", "O‘zbekcha"], ["ru", "RU", "Ruscha"], ["en", "EN", "Inglizcha"], ["ar", "AR", "Arabcha"]];
const SRC = { home: "Bosh sahifa", product: "Mahsulot sahifasi", range: "Iforlar qatori", manual: "Qo‘lda qo‘shilgan" };
const ERR = {
  wrong: "Parol noto‘g‘ri", too_many: "Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.",
  slug: "URL nomi faqat kichik lotin harf, raqam va chiziqchadan iborat bo‘lsin", slug_taken: "Bunday URL nomli mahsulot allaqachon bor",
  name: "Mahsulot nomini kiriting", color: "Asosiy rangni tanlang", theme: "Rang palitrasi noto‘g‘ri", pack: "Qadoq rasmini yuklang",
  uz_text: "O‘zbekcha «Ifor nomi» va «Bosh ekrandagi jumla» majburiy", type: "Faqat JPG, PNG yoki WebP", too_large: "Fayl juda katta",
  phone: "Telefon raqami noto‘g‘ri (9 ta raqam)", items: "Kamida bitta mahsulot tanlang",
  tg_missing: "Avval bot tokeni va chat ID ni kiriting va saqlang", short: "Yangi parol kamida 8 belgidan iborat bo‘lsin",
  db_missing: "Ma’lumotlar bazasi ulanmagan", network: "Internet aloqasi yo‘q yoki server javob bermadi",
};
const errText = (e) => ERR[e?.code] || ERR[e?.message] || (e?.code ? `Xatolik: ${e.code}` : "Kutilmagan xatolik");

/* ---------------- Vaqt va telefon (Toshkent) ---------------- */
const TZ = 5 * 3_600_000;
function tdate(ms, withYear) {
  const d = new Date(ms + TZ);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}${withYear ? "." + d.getUTCFullYear() : ""} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
function ago(ms) {
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return "hozirgina";
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  if (s < 172800) return `kecha, ${tdate(ms).slice(6)}`;
  return tdate(ms);
}
const phoneFmt = (p) => { const d = String(p || "").replace(/\D/g, "").slice(-9); return d.length === 9 ? `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : p; };
const dayStart = () => { const t = Date.now(); return Math.floor((t + TZ) / 86_400_000) * 86_400_000 - TZ; };

/* ---------------- API ---------------- */
async function api(path, { method = "GET", body, form } = {}) {
  let res;
  try {
    res = await fetch("/api/admin" + path, {
      method, credentials: "same-origin",
      headers: form ? {} : { "content-type": "application/json" },
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch { const e = new Error("network"); e.code = "network"; throw e; }
  if (res.status === 401 && path !== "/login" && path !== "/password") { renderLogin(); const e = new Error("auth"); e.code = "auth"; throw e; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || res.status); e.code = data.error || String(res.status); throw e; }
  return data;
}

/* ---------------- Toast, modal ---------------- */
function toast(text, type = "", action) {
  const t = document.createElement("div");
  t.className = `toast ${type}`; t.innerHTML = `<span>${esc(text)}</span>${action ? `<a href="${action.href}">${esc(action.label)}</a>` : ""}`;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), action ? 8000 : 3500);
}
function modal(html, onMount) {
  return new Promise((resolve) => {
    const m = document.createElement("div");
    m.className = "modal"; m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(m);
    const close = (v) => { m.remove(); document.removeEventListener("keydown", key); resolve(v); };
    const key = (e) => { if (e.key === "Escape") close(null); };
    document.addEventListener("keydown", key);
    m.addEventListener("click", (e) => { if (e.target === m) close(null); });
    onMount && onMount(m.firstElementChild, close);
    const f = $("input, textarea, button.btn-primary", m); f && f.focus();
  });
}
function confirmBox(title, text, ok = "Ha", danger) {
  return modal(`<h2>${esc(title)}</h2><p class="muted" style="margin:0">${esc(text)}</p>
    <div class="modal-actions"><button class="btn" data-no>Bekor qilish</button><button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-yes>${esc(ok)}</button></div>`,
    (card, close) => { $("[data-no]", card).onclick = () => close(false); $("[data-yes]", card).onclick = () => close(true); });
}

/* ---------------- Holat ---------------- */
const state = { products: [], newCount: 0, dirty: false, lastHash: location.hash, ignoreHash: false };
const setDirty = (v) => { state.dirty = v; };
addEventListener("beforeunload", (e) => { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });

/* ---------------- Kirish ---------------- */
function renderLogin() {
  stopPolling();
  $("#root").innerHTML = `
  <div class="login"><form class="login-card" id="login-form" autocomplete="on">
    <div class="login-logo">BÄRC</div>
    <h1>Admin panelga kirish</h1>
    <p class="muted">Buyurtmalar, mahsulotlar va sayt matnlari</p>
    <div class="field"><label for="pw">Parol</label>
      <div class="row"><input class="input" id="pw" type="password" autocomplete="current-password" required>
      <button type="button" class="btn icon-btn" id="pw-eye" aria-label="Parolni ko‘rsatish">👁</button></div>
      <span class="hint err-msg" id="login-err" style="color:var(--danger)"></span></div>
    <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px">Kirish</button>
  </form></div>`;
  $("#pw").focus();
  $("#pw-eye").onclick = () => { const p = $("#pw"); p.type = p.type === "password" ? "text" : "password"; };
  $("#login-form").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("button.btn-primary", e.target); btn.disabled = true; $("#login-err").textContent = "";
    try { await api("/login", { method: "POST", body: { password: $("#pw").value } }); start(); }
    catch (err) { $("#login-err").textContent = errText(err); $("#pw").classList.add("err"); $("#pw").select(); }
    btn.disabled = false;
  };
}

/* ---------------- Karkas ---------------- */
const NAV = [
  ["#/", "dash", "Boshqaruv", "Bosh"],
  ["#/orders", "orders", "Buyurtmalar", "Buyurtma"],
  ["#/products", "products", "Mahsulotlar", "Mahsulot"],
  ["#/texts", "texts", "Sayt matnlari", "Matnlar"],
  ["#/settings", "settings", "Sozlamalar", "Sozlama"],
];
function renderShell() {
  $("#root").innerHTML = `
  <div class="app">
    <aside class="side">
      <div class="side-brand"><b>BÄRC</b><span>admin</span></div>
      <nav class="nav">${NAV.map(([h, ic, t]) => `<a href="${h}" data-nav="${h}">${I[ic]}<span>${t}</span>${ic === "orders" ? '<span class="badge" data-newbadge hidden></span>' : ""}</a>`).join("")}</nav>
      <div class="side-foot">
        <a href="/" target="_blank" rel="noopener">${I.site}Saytni ochish</a>
        <button type="button" data-logout>${I.logout}Chiqish</button>
      </div>
    </aside>
    <header class="topbar"><b>BÄRC</b><a href="/" target="_blank" rel="noopener">Saytni ochish ↗</a></header>
    <main class="main" id="view"></main>
    <nav class="bottom-nav">${NAV.map(([h, ic, , short]) => `<a href="${h}" data-nav="${h}">${I[ic]}<span>${short}</span>${ic === "orders" ? '<span class="badge" data-newbadge hidden></span>' : ""}</a>`).join("")}</nav>
  </div>`;
  $("[data-logout]").onclick = async () => { await api("/logout", { method: "POST" }).catch(() => {}); renderLogin(); };
}
function markNav(hash) {
  const base = "#/" + (hash.replace(/^#\/?/, "").split(/[/?]/)[0] || "");
  $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === (base === "#/" ? "#/" : base)));
}
function setNewBadge(n) {
  state.newCount = n;
  $$("[data-newbadge]").forEach((b) => { b.hidden = !n; b.textContent = n; });
  document.title = (n ? `(${n}) ` : "") + "BÄRC — Admin panel";
}

/* ---------------- Yangi buyurtmalarni kuzatish ---------------- */
let pollTimer = null, lastNew = null;
function startPolling() {
  stopPolling();
  const tick = async () => {
    try {
      const s = await api("/stats");
      const n = s.counts.new || 0;
      if (lastNew !== null && n > lastNew) {
        toast(`Yangi buyurtma keldi (${n - lastNew})`, "ok", { href: "#/orders?status=new", label: "Ko‘rish" });
        beep();
        if ("Notification" in window && Notification.permission === "granted") new Notification("BÄRC: yangi buyurtma", { body: `Javob kutayotganlar: ${n}` });
        if (location.hash.startsWith("#/orders") || location.hash === "#/" || location.hash === "") route(true);
      }
      lastNew = n; setNewBadge(n);
    } catch {}
  };
  tick(); pollTimer = setInterval(tick, 20_000);
}
function stopPolling() { clearInterval(pollTimer); pollTimer = null; }
function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain();
    o.frequency.value = 880; g.gain.setValueAtTime(.08, c.currentTime); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .4);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + .4);
  } catch {}
}

/* ---------------- Marshrutlash ---------------- */
addEventListener("hashchange", () => {
  if (state.ignoreHash) { state.ignoreHash = false; return; }
  if (state.dirty && !confirm("Saqlanmagan o‘zgarishlar bor. Sahifadan chiqasizmi?")) {
    state.ignoreHash = true; location.hash = state.lastHash; return;
  }
  setDirty(false); route();
});
function parseHash() {
  const [p, qs] = location.hash.replace(/^#/, "").split("?");
  return { parts: (p || "/").split("/").filter(Boolean), q: new URLSearchParams(qs || "") };
}
async function route(soft) {
  state.lastHash = location.hash;
  const { parts, q } = parseHash();
  markNav(location.hash || "#/");
  const view = $("#view"); if (!view) return;
  if (!soft) { view.innerHTML = `<div class="loading"><span class="spinner"></span></div>`; window.scrollTo(0, 0); }
  try {
    if (!parts.length) return await viewDashboard(view);
    if (parts[0] === "orders") return await viewOrders(view, q, parts[1], soft);
    if (parts[0] === "products") return parts[1] ? await viewProductEdit(view, parts[1]) : await viewProducts(view);
    if (parts[0] === "texts") return await viewTexts(view, q.get("s"));
    if (parts[0] === "settings") return await viewSettings(view);
    view.innerHTML = `<div class="empty"><b>Sahifa topilmadi</b><a href="#/">Boshqaruvga qaytish</a></div>`;
  } catch (e) {
    if (e.code === "auth") return;
    view.innerHTML = `<div class="card empty"><b>Yuklab bo‘lmadi</b>${esc(errText(e))}<div style="margin-top:16px"><button class="btn" onclick="location.reload()">Qayta urinish</button></div></div>`;
  }
}

/* =====================================================================
   BOSHQARUV
   ===================================================================== */
async function viewDashboard(view) {
  const s = await api("/stats");
  setNewBadge(s.counts.new || 0); lastNew = s.counts.new || 0;
  const max = Math.max(1, ...s.series.map((x) => x.c));
  const todayKey = dayStart();
  const days = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
  view.innerHTML = `
  <div class="page-head"><div><h1>Boshqaruv</h1><p>${greeting()} Bugun: ${tdate(Date.now(), true).slice(0, 10)}</p></div>
    <div class="actions">
      ${"Notification" in window && Notification.permission === "default" ? `<button class="btn" data-notify>${I.bell}Bildirishnomani yoqish</button>` : ""}
      <a class="btn" href="#/products/new">${I.plus}Mahsulot qo‘shish</a>
      <a class="btn btn-primary" href="#/orders?status=new">${I.orders}Yangi buyurtmalar</a>
    </div></div>
  <div class="grid kpis">
    <a class="card kpi ${s.counts.new ? "hot" : ""}" href="#/orders?status=new"><span class="lbl">Javob kutmoqda</span><span class="val">${s.counts.new}</span><span class="muted small">${s.counts.new ? "Mijozlarga qo‘ng‘iroq qiling" : "Hammasi ko‘rib chiqilgan"}</span></a>
    <div class="card kpi"><span class="lbl">Bugun</span><span class="val">${s.today}</span><span class="muted small">buyurtma</span></div>
    <div class="card kpi"><span class="lbl">So‘nggi 7 kun</span><span class="val">${s.week}</span><span class="muted small">buyurtma</span></div>
    <div class="card kpi"><span class="lbl">Jami</span><span class="val">${s.total}</span><span class="muted small">${s.counts.delivered} tasi yetkazilgan</span></div>
  </div>
  <div class="grid two" style="margin-top:16px">
    <section class="card">
      <div class="card-head"><h2>So‘nggi 14 kun</h2><span class="muted small">kunlik buyurtmalar</span></div>
      <div class="chart">${s.series.map((x) => `<div class="b ${x.day === todayKey ? "today" : ""}" style="height:${(x.c / max) * 100}%" title="${tdate(x.day).slice(0, 5)}: ${x.c}">${x.c ? `<span>${x.c}</span>` : ""}</div>`).join("")}</div>
      <div class="chart-x">${s.series.map((x) => `<span>${x.day === todayKey ? "Bugun" : days[new Date(x.day + TZ).getUTCDay()]}</span>`).join("")}</div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Holatlar bo‘yicha</h2><a href="#/orders" class="small">Hammasi →</a></div>
      <div class="card-pad" style="display:grid;gap:12px">
        ${Object.keys(ST).map((k) => `<a href="#/orders?status=${k}" style="display:grid;grid-template-columns:150px 1fr 32px;gap:12px;align-items:center;text-decoration:none;color:inherit">
          <span class="st st-${k}">${ST[k]}</span>
          <span style="height:8px;border-radius:4px;background:var(--line-2);overflow:hidden"><i style="display:block;height:100%;width:${s.total ? (s.counts[k] / s.total) * 100 : 0}%;background:var(--st-${k})"></i></span>
          <b style="text-align:right">${s.counts[k]}</b></a>`).join("")}
      </div>
    </section>
  </div>
  <section class="card" style="margin-top:16px">
    <div class="card-head"><h2>Oxirgi buyurtmalar</h2><a href="#/orders" class="small">Barcha buyurtmalar →</a></div>
    ${s.recent.length ? `<div>${s.recent.map((o) => `
      <a href="#/orders/${o.id}" style="display:flex;gap:16px;align-items:center;padding:14px 24px;border-bottom:1px solid var(--line-2);text-decoration:none;color:inherit">
        <div style="flex:1;min-width:0"><div class="cell-main">${esc(o.name || phoneFmt(o.phone))}</div><div class="cell-sub">${esc(o.orderNo)} · ${o.items.map((i) => `${esc(i.name)} × ${i.qty}`).join(", ")}</div></div>
        <span class="st st-${o.status}">${ST[o.status]}</span><span class="muted small" style="min-width:110px;text-align:right">${ago(o.created_at)}</span></a>`).join("")}</div>`
      : `<div class="empty">${I.inbox}<b>Hali buyurtma yo‘q</b>Saytdan kelgan buyurtmalar shu yerda paydo bo‘ladi.</div>`}
  </section>
  <p class="muted small" style="margin-top:16px">Mahsulotlar: saytda ${s.products.published} ta, jami ${s.products.total} ta. Yangi buyurtmalar har 20 soniyada tekshiriladi.</p>`;
  const nb = $("[data-notify]", view);
  if (nb) nb.onclick = async () => { const p = await Notification.requestPermission(); toast(p === "granted" ? "Bildirishnomalar yoqildi" : "Brauzer ruxsat bermadi", p === "granted" ? "ok" : "err"); nb.remove(); };
}
function greeting() { const h = new Date(Date.now() + TZ).getUTCHours(); return h < 11 ? "Xayrli tong!" : h < 18 ? "Xayrli kun!" : "Xayrli kech!"; }

/* =====================================================================
   BUYURTMALAR (CRM)
   ===================================================================== */
const PERIODS = [["", "Butun vaqt"], ["today", "Bugun"], ["7", "So‘nggi 7 kun"], ["30", "So‘nggi 30 kun"]];
async function ensureProducts() {
  if (!state.products.length) state.products = (await api("/products")).items;
  return state.products;
}
const prodById = (id) => state.products.find((p) => p.id === id);

async function viewOrders(view, q, openId, soft) {
  await ensureProducts();
  const f = { status: q.get("status") || "", q: q.get("q") || "", period: q.get("period") || "" };
  const params = new URLSearchParams();
  if (f.status) params.set("status", f.status);
  if (f.q) params.set("q", f.q);
  if (f.period) { const from = f.period === "today" ? dayStart() : Date.now() - +f.period * 86_400_000; params.set("from", from); }
  let page = 1;
  const data = await api("/orders?" + params);
  const total = Object.values(data.counts).reduce((a, b) => a + b, 0);
  setNewBadge(data.counts.new || 0);
  const link = (patch) => { const p = new URLSearchParams({ ...f, ...patch }); [...p.keys()].forEach((k) => !p.get(k) && p.delete(k)); return "#/orders" + (p.toString() ? "?" + p : ""); };

  if (!soft || !$("#orders-root", view)) {
    view.innerHTML = `
    <div id="orders-root">
      <div class="page-head"><div><h1>Buyurtmalar</h1><p>Saytdan kelgan so‘rovlar. Mijozga qo‘ng‘iroq qilib, holatini yangilab boring.</p></div>
        <div class="actions"><a class="btn" data-csv>${I.download}Excel (CSV)</a><button class="btn btn-primary" data-add>${I.plus}Qo‘lda qo‘shish</button></div></div>
      <div class="tabs" role="tablist" data-tabs></div>
      <div class="toolbar">
        <label class="search"><span class="sr">Qidirish</span>${I.search}<input class="input" type="search" placeholder="Raqam, ism, telefon yoki izoh bo‘yicha qidirish" data-q value="${esc(f.q)}"></label>
        <select class="input" data-period aria-label="Davr">${PERIODS.map(([v, t]) => `<option value="${v}" ${v === f.period ? "selected" : ""}>${t}</option>`).join("")}</select>
      </div>
      <div data-list></div>
    </div>`;
    let tm;
    $("[data-q]", view).oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { state.ignoreHash = true; location.hash = link({ q: e.target.value.trim() }); state.ignoreHash = false; route(true); }, 350); };
    $("[data-period]", view).onchange = (e) => { location.hash = link({ period: e.target.value }); };
    $("[data-add]", view).onclick = () => manualOrder();
  }
  $("[data-csv]", view).href = "/api/admin/orders.csv?" + params;
  $("[data-tabs]", view).innerHTML = [["", "Hammasi", total], ...Object.keys(ST).map((k) => [k, ST[k], data.counts[k] || 0])]
    .map(([k, t, n]) => `<a class="tab ${f.status === k ? "on" : ""}" href="${link({ status: k })}" role="tab">${t} <span class="n">${n}</span></a>`).join("");

  const listBox = $("[data-list]", view);
  const renderList = (items, append) => {
    if (!items.length && !append) {
      listBox.innerHTML = `<div class="card empty">${I.inbox}<b>${f.q || f.status || f.period ? "Hech narsa topilmadi" : "Hali buyurtma yo‘q"}</b>${f.q || f.status || f.period ? `<a href="#/orders">Filtrlarni tozalash</a>` : "Saytdan kelgan buyurtmalar shu yerda paydo bo‘ladi."}</div>`;
      return;
    }
    const chips = (o) => `<div class="items-chips">${o.items.map((i) => `<span class="chip"><i style="background:${prodById(i.id)?.color || "#999"}"></i>${esc(i.name)} × ${i.qty}</span>`).join("")}</div>`;
    const rows = items.map((o) => `<tr class="row ${o.status === "new" ? "is-new" : ""}" data-id="${o.id}">
        <td><div class="cell-main">${esc(o.orderNo)}</div><div class="cell-sub">${SRC[o.source] || ""}</div></td>
        <td><div class="cell-main">${esc(o.name || "—")}</div><div class="cell-sub">${phoneFmt(o.phone)}</div></td>
        <td>${chips(o)}</td>
        <td><span class="st st-${o.status}">${ST[o.status]}</span></td>
        <td><div>${ago(o.created_at)}</div><div class="cell-sub">${tdate(o.created_at)}</div></td></tr>`).join("");
    const cards = items.map((o) => `<div class="card ocard ${o.status === "new" ? "is-new" : ""}" data-id="${o.id}">
        <div class="ocard-top"><b>${esc(o.name || phoneFmt(o.phone))}</b><span class="st st-${o.status}">${ST[o.status]}</span></div>
        ${o.name ? `<div class="muted">${phoneFmt(o.phone)}</div>` : ""}${chips(o)}
        <div class="muted small">${esc(o.orderNo)} · ${ago(o.created_at)}</div></div>`).join("");
    if (append) { $("tbody", listBox).insertAdjacentHTML("beforeend", rows); $(".list-cards", listBox).insertAdjacentHTML("beforeend", cards); return; }
    listBox.innerHTML = `
      <div class="card table-wrap" style="overflow:hidden"><table class="table"><thead><tr><th>Raqam</th><th>Mijoz</th><th>Mahsulotlar</th><th>Holat</th><th>Vaqt</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="list-cards">${cards}</div><div class="more" data-more></div>`;
    listBox.onclick = (e) => { const r = e.target.closest("[data-id]"); if (r) openOrder(+r.dataset.id); };
  };
  renderList(data.items);
  const more = () => {
    const box = $("[data-more]", listBox); if (!box) return;
    const shown = $$("tbody tr", listBox).length;
    box.innerHTML = shown < data.total ? `<button class="btn">Yana ko‘rsatish (${data.total - shown})</button>` : "";
    const b = $("button", box);
    if (b) b.onclick = async () => { b.disabled = true; page++; const d2 = await api(`/orders?${params}&page=${page}`); renderList(d2.items, true); more(); };
  };
  more();
  if (openId) openOrder(+openId, true);
}

async function openOrder(id, fromRoute) {
  if (!fromRoute) { state.ignoreHash = true; history.replaceState(null, "", `#/orders/${id}${location.hash.includes("?") ? "?" + location.hash.split("?")[1] : ""}`); state.ignoreHash = false; }
  $$(".scrim, .drawer").forEach((x) => x.remove());
  const scrim = document.createElement("div"); scrim.className = "scrim";
  const dr = document.createElement("aside"); dr.className = "drawer"; dr.setAttribute("role", "dialog"); dr.setAttribute("aria-modal", "true");
  dr.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  document.body.append(scrim, dr);
  const close = () => {
    scrim.remove(); dr.remove(); document.removeEventListener("keydown", key);
    state.ignoreHash = true; history.replaceState(null, "", "#/orders" + (location.hash.includes("?") ? "?" + location.hash.split("?")[1] : "")); state.ignoreHash = false;
    state.lastHash = location.hash;
  };
  const key = (e) => { if (e.key === "Escape" && !$(".modal")) close(); };
  document.addEventListener("keydown", key);
  scrim.onclick = close;

  const load = async () => {
    const o = await api(`/orders/${id}`);
    const stepIdx = { new: 0, called: 1, confirmed: 2, delivered: 3, cancelled: -1 }[o.status];
    const nx = NEXT[o.status];
    const digits = o.phone.replace(/\D/g, "");
    dr.innerHTML = `
      <div class="drawer-head"><div><h2>${esc(o.orderNo)}</h2><div class="muted small">${tdate(o.created_at, true)} · ${SRC[o.source] || ""} · ${o.locale?.toUpperCase()}</div></div>
        <button class="btn icon-btn btn-ghost close" aria-label="Yopish">${I.close}</button></div>
      <div class="drawer-body">
        <section>
          <div class="sec-title">Mijoz</div>
          ${o.name ? `<div style="font-weight:600;margin-bottom:2px">${esc(o.name)}</div>` : ""}
          <div class="phone-big">${phoneFmt(o.phone)}</div>
          ${o.otherOrders ? `<div class="muted small" style="margin-top:4px">Bu raqamdan yana ${o.otherOrders} ta buyurtma bor · <a href="#/orders?q=${digits.slice(-9)}">ko‘rish</a></div>` : ""}
          <div class="contact-actions">
            <a class="btn btn-primary" href="tel:+${digits}">${I.phone}Qo‘ng‘iroq</a>
            <a class="btn" href="https://t.me/+${digits}" target="_blank" rel="noopener">${I.tg}Telegram</a>
            <button class="btn icon-btn" data-copy aria-label="Raqamdan nusxa olish" title="Nusxa olish">${I.copy}</button>
          </div>
        </section>
        <section>
          <div class="sec-title">Mahsulotlar · ${o.qty} qadoq</div>
          <div class="order-items">${o.items.map((i) => `<div class="order-item"><img src="${prodById(i.id)?.pack ? "/" + prodById(i.id).pack.replace(/^\//, "") : ""}" alt=""><b>${esc(i.name)}</b><span class="muted">60 ta kapsula</span><span class="q">× ${i.qty}</span></div>`).join("")}</div>
          ${o.comment ? `<div style="margin-top:12px;padding:12px;border-radius:8px;background:var(--line-2)"><div class="sec-title" style="margin:0 0 4px">Mijoz izohi</div>${esc(o.comment)}</div>` : ""}
        </section>
        <section>
          <div class="sec-title">Holat</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span class="st st-${o.status}">${ST[o.status]}</span>
            ${stepIdx >= 0 ? `<div class="steps" style="flex:1">${[0, 1, 2, 3].map((i) => `<i class="step ${i <= stepIdx ? "on" : ""}"></i>`).join("")}</div>` : ""}</div>
          ${nx ? `<button class="btn btn-primary btn-lg btn-block" data-next="${nx[0]}">${nx[1]}</button>` : ""}
          <div class="seg" style="margin-top:12px" aria-label="Holatni tanlash">${Object.keys(ST).map((k) => `<button type="button" class="${k === o.status ? "on" : ""}" data-status="${k}">${ST[k]}</button>`).join("")}</div>
        </section>
        <section class="note-box">
          <div class="sec-title">Menejer izohi</div>
          <textarea class="input" data-note placeholder="Masalan: ertaga 10:00 da qayta qo‘ng‘iroq; manzil — Chilonzor 9">${esc(o.note)}</textarea>
          <div class="note-row"><span class="muted small">Ctrl + Enter — saqlash</span><button class="btn btn-sm" data-save-note disabled>Izohni saqlash</button></div>
        </section>
        <section>
          <div class="sec-title">Tarix</div>
          <div class="timeline">${o.events.map((e) => `<div class="tl ${e.kind}"><i></i><div><p>${esc(e.text)}</p><small>${tdate(e.at, true)}</small></div></div>`).join("")}</div>
        </section>
      </div>
      <div class="drawer-foot"><button class="btn btn-danger btn-sm" data-del>${I.trash}O‘chirish</button><span style="flex:1"></span><button class="btn btn-sm close">Yopish</button></div>`;
    $$(".close", dr).forEach((b) => (b.onclick = close));
    $("[data-copy]", dr).onclick = async () => { await navigator.clipboard.writeText(o.phone).catch(() => {}); toast("Raqam nusxalandi", "ok"); };
    const setStatus = async (st) => {
      try { await api(`/orders/${id}`, { method: "PATCH", body: { status: st } }); toast(`Holat: ${ST[st]}`, "ok"); await load(); refreshList(); }
      catch (e) { toast(errText(e), "err"); }
    };
    const nb = $("[data-next]", dr); if (nb) nb.onclick = () => setStatus(nb.dataset.next);
    $$("[data-status]", dr).forEach((b) => (b.onclick = () => b.dataset.status !== o.status && setStatus(b.dataset.status)));
    const ta = $("[data-note]", dr), sv = $("[data-save-note]", dr);
    ta.oninput = () => { sv.disabled = ta.value === o.note; };
    const saveNote = async () => { sv.disabled = true; try { await api(`/orders/${id}`, { method: "PATCH", body: { note: ta.value } }); toast("Izoh saqlandi", "ok"); await load(); } catch (e) { toast(errText(e), "err"); sv.disabled = false; } };
    sv.onclick = saveNote;
    ta.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !sv.disabled) saveNote(); };
    $("[data-del]", dr).onclick = async () => {
      if (!(await confirmBox("Buyurtmani o‘chirasizmi?", `${o.orderNo} butunlay o‘chiriladi. Bekor qilingan buyurtmalarni o‘chirmasdan «Bekor qilindi» holatida qoldirish tavsiya etiladi.`, "O‘chirish", true))) return;
      await api(`/orders/${id}`, { method: "DELETE" }); toast("Buyurtma o‘chirildi"); close(); refreshList();
    };
  };
  try { await load(); } catch (e) { dr.innerHTML = `<div class="empty"><b>Buyurtma topilmadi</b><button class="btn" onclick="this.closest('.drawer').previousSibling.click()">Yopish</button></div>`; }
}
function refreshList() { if (location.hash.startsWith("#/orders")) route(true); }

async function manualOrder() {
  await ensureProducts();
  const qty = {};
  await modal(`
    <h2>Buyurtmani qo‘lda qo‘shish</h2>
    <p class="muted" style="margin:0">Mijoz telefon orqali yoki do‘konda buyurtma bersa, shu yerga yozing.</p>
    <div class="field"><label>Telefon <span class="req">*</span></label><div class="row"><span class="muted" style="font-weight:600">+998</span><input class="input" data-phone inputmode="tel" placeholder="90 123 45 67"></div></div>
    <div class="field"><label>Ism</label><input class="input" data-name maxlength="60"></div>
    <div class="field"><label>Mahsulotlar <span class="req">*</span></label><div>${state.products.map((p) => `
      <div class="qty-row"><img src="/${p.pack.replace(/^\//, "")}" alt=""><b>${esc(p.name)}</b>
        <span class="stepper"><button type="button" data-m="${p.id}" aria-label="Kamaytirish">−</button><output data-o="${p.id}">0</output><button type="button" data-p="${p.id}" aria-label="Ko‘paytirish">+</button></span></div>`).join("")}</div></div>
    <div class="field"><label>Izoh</label><textarea class="input" data-comment rows="2" maxlength="400"></textarea></div>
    <p class="hint" data-err style="color:var(--danger);margin:0"></p>
    <div class="modal-actions"><button class="btn" data-no>Bekor qilish</button><button class="btn btn-primary" data-yes>Qo‘shish</button></div>`,
  (card, close) => {
    const upd = (id, d) => { qty[id] = Math.max(0, Math.min(99, (qty[id] || 0) + d)); $(`[data-o="${id}"]`, card).textContent = qty[id]; };
    card.onclick = (e) => { const m = e.target.closest("[data-m]"), p = e.target.closest("[data-p]"); if (m) upd(m.dataset.m, -1); if (p) upd(p.dataset.p, 1); };
    $("[data-no]", card).onclick = () => close();
    $("[data-yes]", card).onclick = async () => {
      const items = state.products.filter((p) => qty[p.id]).map((p) => ({ id: p.id, name: p.name, qty: qty[p.id] }));
      try {
        const r = await api("/orders", { method: "POST", body: { phone: $("[data-phone]", card).value, name: $("[data-name]", card).value, comment: $("[data-comment]", card).value, items } });
        close(); toast(`${r.orderNo} qo‘shildi`, "ok"); refreshList();
      } catch (e) { $("[data-err]", card).textContent = errText(e); }
    };
  });
}

/* =====================================================================
   MAHSULOTLAR
   ===================================================================== */
async function viewProducts(view) {
  state.products = (await api("/products")).items;
  const list = state.products;
  view.innerHTML = `
  <div class="page-head"><div><h1>Mahsulotlar</h1><p>Saytdagi iforlar. Tartibi — saytdagi karusel va qatordagi tartib.</p></div>
    <div class="actions"><a class="btn btn-primary" href="#/products/new">${I.plus}Yangi mahsulot</a></div></div>
  <div class="grid prod-grid">
    ${list.map((p, i) => `
      <article class="card pcard">
        <div class="pcard-img" style="--c:linear-gradient(180deg,${p.theme.bg},${p.theme.bg2})"><img src="/${p.pack.replace(/^\//, "")}" alt="">
          <span class="st ${p.status === "published" ? "st-delivered" : "st-cancelled"}">${p.status === "published" ? "Saytda" : "Qoralama"}</span></div>
        <div class="pcard-body"><h3>${esc(p.name)}</h3><span class="muted">${esc(p.i18n?.uz?.scent || "")}</span>
          <span class="muted small">${p.gallery.length} ta rasm · ${LANGS.filter(([l]) => p.i18n?.[l]?.line).length}/4 til</span></div>
        <div class="pcard-foot">
          <a class="btn btn-primary btn-sm" href="#/products/${p.id}">Tahrirlash</a>
          <button class="btn btn-sm icon-btn" data-move="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Oldinga">${I.left}</button>
          <button class="btn btn-sm icon-btn" data-move="${i}" data-d="1" ${i === list.length - 1 ? "disabled" : ""} aria-label="Orqaga">${I.right}</button>
        </div>
      </article>`).join("")}
    <a class="add-card" href="#/products/new">${I.plus}<span>Yangi mahsulot qo‘shish</span><span class="muted small" style="font-weight:400">Qadoq rasmi, rang va matnlar</span></a>
  </div>`;
  $$("[data-move]", view).forEach((b) => (b.onclick = async () => {
    const i = +b.dataset.move, j = i + +b.dataset.d, ids = list.map((p) => p.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api("/products/reorder", { method: "POST", body: { ids } });
    toast("Tartib saqlandi", "ok"); viewProducts(view);
  }));
}

/* ----- Rang: asosiy rangdan palitra ----- */
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return { h, s, l };
}
function hslToHex(h, s, l) {
  s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return "#" + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}
function paletteFrom(hex) {
  const { h, s } = hexToHsl(hex), S = Math.max(s, .45);
  return { bg: hslToHex(h, S * .72, .11), bg2: hslToHex(h, S * .7, .05), surface: hslToHex(h, Math.min(.8, S * 1.05), .39), accent: hslToHex(h, .9, .76), glow: hslToHex(h, .82, .56) };
}
const THEME_KEYS = [["bg", "Fon"], ["bg2", "Fon (pastki)"], ["surface", "Yuza"], ["accent", "Urg‘u"], ["glow", "Nur"]];

/* ----- Rasmni tekshirish va tayyorlash (brauzerda) ----- */
async function loadImage(file) {
  const url = URL.createObjectURL(file); const img = new Image(); img.decoding = "async"; img.src = url;
  await img.decode(); return img;
}
function canvasOf(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
async function toBlob(canvas, type, q) {
  let b = await new Promise((r) => canvas.toBlob(r, type, q));
  if (!b || (type === "image/webp" && b.type !== "image/webp")) b = await new Promise((r) => canvas.toBlob(r, type === "image/webp" && canvas.__alpha ? "image/png" : "image/jpeg", .86));
  return b;
}
function analyzePack(img) {
  const H = 240, W = Math.round(img.naturalWidth * H / img.naturalHeight), c = canvasOf(W, H), x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(img, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data;
  let edge = 0, edgeT = 0;
  const px = (i, j) => d[(j * W + i) * 4 + 3];
  for (let i = 0; i < W; i++) { edge += 2; if (px(i, 0) < 24) edgeT++; if (px(i, H - 1) < 24) edgeT++; }
  for (let j = 0; j < H; j++) { edge += 2; if (px(0, j) < 24) edgeT++; if (px(W - 1, j) < 24) edgeT++; }
  // Asosiy rang: to'yingan piksellarning eng ko'p uchraydigan rang toni
  const buckets = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < d.length; i += 16) {
    if (d[i + 3] < 200) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const { h, s, l } = hexToHsl("#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""));
    if (s < .3 || l < .12 || l > .85) continue;
    const k = Math.floor(h / 15) % 24, w = s; const B = buckets[k];
    B.w += w; B.r += r * w; B.g += g * w; B.b += b * w;
  }
  const top = buckets.reduce((a, b) => (b.w > a.w ? b : a));
  const color = top.w ? "#" + [top.r, top.g, top.b].map((v) => Math.round(v / top.w).toString(16).padStart(2, "0")).join("").toUpperCase() : null;
  return { transparent: edgeT / edge, color };
}
function checkPack(file, img, a) {
  const w = img.naturalWidth, h = img.naturalHeight, ratio = h / w, out = [];
  out.push(file.type === "image/jpeg" ? ["bad", "JPG formatida shaffof fon bo‘lmaydi — PNG yoki WebP yuklang"] : ["ok", `Format: ${file.type.split("/")[1].toUpperCase()}`]);
  out.push(a.transparent >= .6 ? ["ok", "Fon olib tashlangan (shaffof)"] : ["bad", "Fon olib tashlanmagan — qadoq atrofida rang ko‘rinyapti. Fonni olib tashlab qayta yuklang"]);
  out.push(ratio >= 1.05 && ratio <= 1.8 ? ["ok", `Tik holat, nisbat ${w}×${h}`] : ["warn", `Nisbat ${w}×${h} — qadoq tik turgan bo‘lishi kerak (taxminan 3:4)`]);
  out.push(h >= 900 ? ["ok", `Sifat yaxshi (${h} px balandlik)`] : h >= 600 ? ["warn", `Sifat pastroq (${h} px). Kamida 900 px tavsiya etiladi`] : ["bad", `Juda kichik (${h} px). Kamida 900 px kerak`]);
  out.push(file.size <= 15e6 ? ["ok", `Hajmi ${(file.size / 1e6).toFixed(1)} MB — saytga avtomatik siqiladi`] : ["bad", "Fayl 15 MB dan katta"]);
  return out;
}
function checkGallery(file, img) {
  const w = img.naturalWidth, h = img.naturalHeight, r = w / h, out = [];
  out.push(["ok", `Format: ${file.type.split("/")[1].toUpperCase()}`]);
  out.push(Math.abs(r - .8) <= .05 ? ["ok", "Nisbat 4:5 (tik)"] : ["warn", `Nisbat ${w}×${h} — markazidan 4:5 ga avtomatik qirqiladi`]);
  out.push(w >= 1080 && h >= 1350 ? ["ok", `Sifat yaxshi (${w}×${h})`] : w >= 800 ? ["warn", `Sifat pastroq (${w}×${h}). 1080×1350 tavsiya etiladi`] : ["bad", `Juda kichik (${w}×${h}). Kamida 800 px eni kerak`]);
  out.push(file.size <= 15e6 ? ["ok", `Hajmi ${(file.size / 1e6).toFixed(1)} MB — avtomatik siqiladi`] : ["bad", "Fayl 15 MB dan katta"]);
  return out;
}
async function preparePack(img) {
  // Shaffof chetlarni kesish va 1200 px balandlikka keltirish (shaffoflik saqlanadi)
  const W0 = img.naturalWidth, H0 = img.naturalHeight, probe = canvasOf(W0, H0), px = probe.getContext("2d", { willReadFrequently: true });
  px.drawImage(img, 0, 0);
  const d = px.getImageData(0, 0, W0, H0).data; let x0 = W0, y0 = H0, x1 = 0, y1 = 0;
  for (let y = 0; y < H0; y += 2) for (let x = 0; x < W0; x += 2) if (d[(y * W0 + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) { x0 = 0; y0 = 0; x1 = W0 - 1; y1 = H0 - 1; }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  for (const target of [1200, 1000, 850]) {
    const s = Math.min(1, target / ch), c = canvasOf(Math.round(cw * s), Math.round(ch * s)); c.__alpha = true;
    const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(img, x0, y0, cw, ch, 0, 0, c.width, c.height);
    const b = await toBlob(c, "image/webp", .9);
    if (b.size < 1_800_000) return { blob: b, w: c.width, h: c.height };
  }
  throw Object.assign(new Error("too_large"), { code: "too_large" });
}
async function prepareGallery(img) {
  const W0 = img.naturalWidth, H0 = img.naturalHeight, r = .8;
  let sw = W0, sh = H0, sx = 0, sy = 0;
  if (W0 / H0 > r) { sw = H0 * r; sx = (W0 - sw) / 2; } else { sh = W0 / r; sy = (H0 - sh) / 2; }
  for (const [w, q] of [[1200, .84], [1080, .78], [960, .72]]) {
    const c = canvasOf(Math.min(w, Math.round(sw)), Math.round(Math.min(w, sw) / r)), x = c.getContext("2d");
    x.imageSmoothingQuality = "high"; x.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    const b = await toBlob(c, "image/webp", q);
    if (b.size < 1_800_000) return { blob: b, w: c.width, h: c.height };
  }
  throw Object.assign(new Error("too_large"), { code: "too_large" });
}
async function makeAtmo(src) {
  // Fon uchun 96×120 xira rasm: kichraytirib-kattalashtirish (har brauzerda ishlaydi)
  const img = new Image(); img.crossOrigin = "anonymous"; img.src = src; await img.decode();
  const a = canvasOf(24, 30), ax = a.getContext("2d"); ax.drawImage(img, 0, 0, 24, 30);
  const c = canvasOf(96, 120), cx = c.getContext("2d"); cx.imageSmoothingQuality = "high"; cx.drawImage(a, 0, 0, 96, 120);
  return { blob: await toBlob(c, "image/webp", .7), w: 96, h: 120 };
}
async function upload({ blob, w, h }, name) {
  const fd = new FormData();
  const ext = blob.type.split("/")[1].replace("jpeg", "jpg");
  fd.append("file", new File([blob], `${name || "rasm"}.${ext}`, { type: blob.type })); fd.append("w", w); fd.append("h", h); fd.append("name", name || "");
  return api("/media", { method: "POST", form: fd });
}
const srcUrl = (s) => (s ? (s.startsWith("/") ? s : "/" + s) : "");
const checksHtml = (list) => `<div class="checks">${list.map(([t, m]) => `<div class="check ${t}"><i>${t === "ok" ? "✓" : t === "bad" ? "✕" : "!"}</i><span>${esc(m)}</span></div>`).join("")}</div>`;

/* ----- Mahsulot muharriri ----- */
const PFIELDS = [
  ["scent", "Ifor nomi", "Qisqa, 2–3 so‘z. Galereya va buyurtma oynasida ko‘rinadi.", "Masalan: Ametist va lavanda", 30, false],
  ["line", "Bosh ekrandagi jumla", "Karusel ostida, mahsulot nomi tagida chiqadi. Bir qator.", "Masalan: Kiyimingizdan kun bo‘yi ketmaydigan ifor", 60, false],
  ["hook", "Mahsulot sahifasidagi asosiy jumla", "Katta yozuv — mijozga his beradigan bitta gap.", "Masalan: Kechki ko‘ylak ham ertalabgidek xushbo‘y.", 60, false],
  ["desc", "Tavsif", "2–3 gap: ifor qanday, nimaga yaxshi, qanday sharoitda ishlaydi.", "", 400, true],
  ["for", "Kim uchun", "Kimga mos va qaysi kiyimlar uchun.", "", 220, true],
];
async function viewProductEdit(view, id) {
  const isNew = id === "new";
  const p = isNew
    ? { id: "", status: "published", name: "", color: "#6A1FA8", theme: paletteFrom("#6A1FA8"), pack: "", atmo: "", gallery: [], i18n: {} }
    : await api(`/products/${id}`);
  LANGS.forEach(([l]) => (p.i18n[l] = { scent: "", line: "", hook: "", desc: "", for: "", ...(p.i18n[l] || {}) }));
  let lang = "uz", slugTouched = !isNew, atmoStale = false, busy = false;
  const original = JSON.stringify(p);
  const mark = () => setDirty(JSON.stringify(p) !== original);

  view.innerHTML = `
  <div class="page-head"><div><a href="#/products" class="small">← Mahsulotlar</a><h1 style="margin-top:4px">${isNew ? "Yangi mahsulot" : esc(p.name)}</h1></div>
    <div class="actions">${!isNew ? `<a class="btn" href="/#/${p.id}" target="_blank" rel="noopener">${I.site}Saytda ko‘rish</a><button class="btn btn-danger" data-delete>${I.trash}O‘chirish</button>` : ""}</div></div>
  <div class="editor">
    <div class="stack">
      <section class="card card-pad">
        <h2 style="font-size:16px;margin-bottom:16px">1. Asosiy ma’lumot</h2>
        <div class="field"><label for="f-name">Mahsulot nomi <span class="req">*</span></label>
          <input class="input" id="f-name" maxlength="40" value="${esc(p.name)}" placeholder="Masalan: Crystal Bloom">
          <span class="hint">Lotin harflarida. Saytda katta harflar bilan ko‘rinadi — barcha tillarda bir xil.</span></div>
        <div class="field"><label for="f-slug">Sahifa manzili (URL)</label>
          <div class="row"><span class="muted">/#/</span><input class="input" id="f-slug" maxlength="40" value="${esc(p.id)}" ${isNew ? "" : "disabled"} placeholder="crystal-bloom"></div>
          <span class="hint">${isNew ? "Nomdan avtomatik yasaladi. Saqlangandan keyin o‘zgartirib bo‘lmaydi." : "Manzil o‘zgarmaydi — eski havolalar ishlashda davom etadi."}</span></div>
        <div class="field"><label>Holat</label>
          <div class="seg" data-status-seg><button type="button" data-v="published">Saytda ko‘rinadi</button><button type="button" data-v="draft">Qoralama (yashirin)</button></div></div>
      </section>

      <section class="card card-pad">
        <h2 style="font-size:16px;margin-bottom:4px">2. Qadoq rasmi <span class="req">*</span></h2>
        <p class="muted" style="margin:0 0 12px">Saytning asosiy sahnasida aylanadigan rasm.</p>
        <div class="req-box"><b>Rasmga talablar</b><ul>
          <li><b>Fon olib tashlangan</b> (shaffof) — PNG yoki WebP. JPG mos emas.</li>
          <li>Qadoq <b>tik</b> turgan, to‘liq ko‘rinadigan, chetlari kesilmagan (nisbat taxminan 3:4).</li>
          <li>Kamida <b>900 px</b> balandlik, yaxshisi 1500–2000 px.</li>
          <li>Faqat qadoqning o‘zi: qo‘l, stol, soya va yozuvlarsiz.</li>
          <li>Hajmi 15 MB gacha — saytga yuklashdan oldin avtomatik siqiladi.</li></ul>
          <span class="small muted">Fonni olib tashlash uchun: remove.bg yoki Photoshop → «Remove background».</span></div>
        <label class="drop" data-drop="pack" style="margin-top:12px"><input type="file" accept="image/png,image/webp,image/jpeg" data-file="pack"><span data-drop-inner></span></label>
        <div data-checks="pack"></div>
      </section>

      <section class="card card-pad">
        <h2 style="font-size:16px;margin-bottom:4px">3. Rang</h2>
        <p class="muted" style="margin:0 0 12px">Qadoqning asosiy rangi. Sayt foni, tugmalar va pufakchalar shu rangdan avtomatik hisoblanadi.</p>
        <div class="color-main">
          <label class="sw" data-sw-main><input type="color" data-color value="${p.color}" aria-label="Asosiy rang"></label>
          <div><b data-color-hex>${p.color}</b><div class="muted small">Asosiy rang</div></div>
          <button type="button" class="btn btn-sm" data-pick ${p.pack ? "" : "disabled"}>${I.pipette}Rasmdan olish</button>
        </div>
        <details style="margin-top:16px"><summary class="small" style="cursor:pointer;color:var(--brand);font-weight:600">Palitrani qo‘lda sozlash</summary>
          <div class="swatches" style="margin-top:12px">${THEME_KEYS.map(([k, t]) => `<label title="${t}" style="display:grid;gap:4px;justify-items:center;font-size:11px;color:var(--muted)"><span class="sw" data-swk="${k}"><input type="color" data-theme="${k}"></span>${t}</label>`).join("")}
          <button type="button" class="btn btn-sm" data-reset-pal>Avtomatik</button></div></details>
      </section>

      <section class="card card-pad">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
          <div><h2 style="font-size:16px">4. Matnlar</h2><p class="muted" style="margin:2px 0 0">O‘zbekcha majburiy. Bo‘sh qolgan tillarda o‘zbekcha matn ko‘rinadi.</p></div>
          <div class="lang-tabs" data-lang-tabs role="tablist"></div></div>
        <div data-fields></div>
      </section>

      <section class="card card-pad">
        <h2 style="font-size:16px;margin-bottom:4px">5. Galereya (kayfiyat rasmlari)</h2>
        <p class="muted" style="margin:0 0 12px">Mahsulot sahifasidagi rasmlar. Birinchi rasmdan sayt foni ham olinadi.</p>
        <div class="req-box"><b>Rasmlarga talablar</b><ul>
          <li><b>Tik, 4:5</b> nisbat (masalan 1080×1350 yoki 1200×1500). Boshqa nisbat markazdan qirqiladi.</li>
          <li>Yorqin, sifatli, <b>matn va logotipsiz</b> (yozuvni sayt o‘zi qo‘yadi).</li>
          <li>Ifor mavzusiga mos: 1) ifor kayfiyati, 2) natija — toza kir, 3) sovuq suv yoki qadoq hayotda.</li>
          <li>3–5 ta rasm tavsiya etiladi, ko‘pi bilan 8 ta. JPG, PNG yoki WebP.</li></ul></div>
        <div class="gal-list" data-gal style="margin-top:12px"></div>
        <label class="drop" style="margin-top:12px;min-height:120px"><input type="file" accept="image/png,image/webp,image/jpeg" multiple data-file="gallery">
          <span>${I.upload}<div><b>Rasm qo‘shish</b></div><div class="muted small">Bir nechtasini birdan tanlash mumkin</div></span></label>
        <div data-checks="gallery"></div>
      </section>
    </div>

    <aside class="card preview" aria-label="Ko‘rinish">
      <div class="card-head"><h2>Saytda shunday ko‘rinadi</h2></div>
      <div class="pv-stage" data-pv><div class="pv-name" data-pv-name></div><img data-pv-img alt=""><div class="pv-line"><div data-pv-line></div><span class="pv-cta">Buyurtma berish</span></div></div>
      <div class="card-pad small muted" data-pv-note>Ko‘rinish taxminiy. To‘liq natija saytda.</div>
    </aside>
  </div>
  <div class="savebar">
    <span class="grow" data-save-state>O‘zgarish yo‘q</span>
    <a class="btn btn-ghost" href="#/products">Bekor qilish</a>
    <button class="btn btn-primary" data-save>${isNew ? "Mahsulotni qo‘shish" : "Saqlash"}</button>
  </div>`;

  const pv = $("[data-pv]", view);
  const renderPreview = () => {
    const t = p.theme;
    pv.style.cssText = `--pv-bg:${t.bg};--pv-bg2:${t.bg2};--pv-accent:${t.accent};--pv-glow:${t.glow}`;
    const nm = (p.name || "NOM").toUpperCase();
    const pn = $("[data-pv-name]", view); pn.textContent = nm; pn.style.fontSize = Math.min(56, 300 / Math.max(4, nm.length) * 1.6) + "px";
    const im = $("[data-pv-img]", view); im.src = srcUrl(p.pack); im.hidden = !p.pack;
    $("[data-pv-line]", view).textContent = p.i18n[lang].line || p.i18n.uz.line || "Bosh ekrandagi jumla";
  };
  const renderSave = () => {
    const el = $("[data-save-state]", view);
    el.className = "grow" + (state.dirty ? " dirty" : ""); el.textContent = state.dirty ? "Saqlanmagan o‘zgarishlar bor" : "O‘zgarish yo‘q";
  };
  const changed = () => { mark(); renderSave(); renderPreview(); };

  // 1. asosiy
  const nameI = $("#f-name", view), slugI = $("#f-slug", view);
  const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  nameI.oninput = () => { p.name = nameI.value.trim(); if (isNew && !slugTouched) { slugI.value = slugify(p.name); p.id = slugI.value; } changed(); };
  slugI.oninput = () => { slugTouched = true; slugI.value = slugify(slugI.value); p.id = slugI.value; changed(); };
  const seg = $("[data-status-seg]", view);
  const renderSeg = () => $$("button", seg).forEach((b) => b.classList.toggle("on", b.dataset.v === p.status));
  seg.onclick = (e) => { const b = e.target.closest("button"); if (b) { p.status = b.dataset.v; renderSeg(); changed(); } };
  renderSeg();

  // 2. qadoq
  const dropPack = $("[data-drop=pack]", view);
  const renderPack = () => {
    dropPack.classList.toggle("has", !!p.pack);
    dropPack.style.setProperty("--c", `linear-gradient(180deg,${p.theme.bg},${p.theme.bg2})`);
    $("[data-drop-inner]", dropPack).innerHTML = p.pack
      ? `<img src="${srcUrl(p.pack)}" alt="Qadoq"><span class="btn btn-sm replace">${I.upload}Almashtirish</span>`
      : `${I.upload}<div><b>Qadoq rasmini tanlang yoki shu yerga tashlang</b></div><div class="muted small">PNG yoki WebP, fon shaffof</div>`;
    $("[data-pick]", view).disabled = !p.pack;
  };
  const handlePack = async (file) => {
    if (!file || busy) return;
    const box = $("[data-checks=pack]", view);
    if (!/^image\/(png|webp|jpeg)$/.test(file.type)) { box.innerHTML = checksHtml([["bad", "Faqat PNG, WebP yoki JPG rasm"]]); return; }
    busy = true; box.innerHTML = `<div class="checks"><div class="check"><span class="spinner"></span><span>Rasm tekshirilmoqda…</span></div></div>`;
    try {
      const img = await loadImage(file), a = analyzePack(img), res = checkPack(file, img, a);
      box.innerHTML = checksHtml(res);
      if (res.some(([t]) => t === "bad")) { busy = false; return; }
      box.insertAdjacentHTML("beforeend", `<div class="checks"><div class="check"><span class="spinner"></span><span>Siqilmoqda va yuklanmoqda…</span></div></div>`);
      const up = await upload(await preparePack(img), (p.id || "qadoq") + "-pack");
      p.pack = up.url; if (!p.gallery.length) atmoStale = true;
      if (a.color && (isNew || await confirmBox("Rangni yangilaymizmi?", `Rasmdan aniqlangan asosiy rang: ${a.color}. Sayt palitrasi shu rangga moslashtirilsinmi?`, "Ha, yangilash"))) setColor(a.color);
      box.innerHTML = checksHtml([...res, ["ok", `Yuklandi (${Math.round(up.size / 1024)} KB)`]]);
      renderPack(); changed();
    } catch (e) { box.innerHTML = checksHtml([["bad", errText(e)]]); }
    busy = false;
  };
  $("[data-file=pack]", view).onchange = (e) => { handlePack(e.target.files[0]); e.target.value = ""; };
  ["dragenter", "dragover"].forEach((ev) => dropPack.addEventListener(ev, (e) => { e.preventDefault(); dropPack.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => dropPack.addEventListener(ev, () => dropPack.classList.remove("over")));
  dropPack.addEventListener("drop", (e) => { e.preventDefault(); handlePack(e.dataTransfer.files[0]); });
  renderPack();

  // 3. rang
  const colorI = $("[data-color]", view);
  const renderColor = () => {
    $("[data-sw-main]", view).style.background = p.color; $("[data-color-hex]", view).textContent = p.color;
    THEME_KEYS.forEach(([k]) => { const sw = $(`[data-swk=${k}]`, view); sw.style.background = p.theme[k]; $(`[data-theme=${k}]`, view).value = p.theme[k].toLowerCase(); });
    colorI.value = p.color.toLowerCase();
  };
  const setColor = (hex) => { p.color = hex.toUpperCase(); p.theme = paletteFrom(p.color); renderColor(); renderPack(); changed(); };
  colorI.oninput = () => setColor(colorI.value);
  $$("[data-theme]", view).forEach((inp) => (inp.oninput = () => { p.theme[inp.dataset.theme] = inp.value.toUpperCase(); renderColor(); renderPack(); changed(); }));
  $("[data-reset-pal]", view).onclick = () => setColor(p.color);
  $("[data-pick]", view).onclick = async () => {
    try { const img = new Image(); img.src = srcUrl(p.pack); await img.decode(); const a = analyzePack(img); if (a.color) { setColor(a.color); toast(`Rang olindi: ${a.color}`, "ok"); } else toast("Rangni aniqlab bo‘lmadi", "err"); }
    catch { toast("Rasmni o‘qib bo‘lmadi", "err"); }
  };
  renderColor();

  // 4. matnlar
  const tabs = $("[data-lang-tabs]", view), fieldsBox = $("[data-fields]", view);
  const fill = (l) => { const f = p.i18n[l]; const n = PFIELDS.filter(([k]) => f[k].trim()).length; return n === PFIELDS.length ? "full" : n ? "part" : ""; };
  const renderTabs = () => { tabs.innerHTML = LANGS.map(([l, s, t]) => `<button type="button" role="tab" class="${l === lang ? "on" : ""}" data-l="${l}" title="${t}"><span class="dot ${fill(l)}"></span>${s}</button>`).join(""); };
  const renderFields = () => {
    const f = p.i18n[lang], dir = lang === "ar" ? "rtl" : "ltr";
    fieldsBox.innerHTML = PFIELDS.map(([k, label, hint, ph, max, multi]) => `
      <div class="field"><div class="row" style="justify-content:space-between"><label for="pf-${k}">${label}${lang === "uz" && (k === "scent" || k === "line") ? ' <span class="req">*</span>' : ""}</label><span class="counter" data-cnt="${k}"></span></div>
        ${multi ? `<textarea class="input" id="pf-${k}" data-k="${k}" rows="3" dir="${dir}" placeholder="${esc(lang === "uz" ? ph : p.i18n.uz[k] || ph)}">${esc(f[k])}</textarea>`
                : `<input class="input" id="pf-${k}" data-k="${k}" dir="${dir}" value="${esc(f[k])}" placeholder="${esc(lang === "uz" ? ph : p.i18n.uz[k] || ph)}">`}
        <span class="hint">${hint}${lang !== "uz" && p.i18n.uz[k] ? ` <br><span class="orig">O‘zbekchasi: ${esc(p.i18n.uz[k])}</span>` : ""}</span></div>`).join("");
    $$("[data-k]", fieldsBox).forEach((inp) => {
      const k = inp.dataset.k, max = PFIELDS.find((x) => x[0] === k)[4], cnt = $(`[data-cnt=${k}]`, fieldsBox);
      const upd = () => { cnt.textContent = `${inp.value.length} / ${max}`; cnt.classList.toggle("over", inp.value.length > max); };
      upd();
      inp.oninput = () => { p.i18n[lang][k] = inp.value; upd(); renderTabs(); changed(); };
    });
  };
  tabs.onclick = (e) => { const b = e.target.closest("[data-l]"); if (b) { lang = b.dataset.l; renderTabs(); renderFields(); renderGal(); renderPreview(); } };
  renderTabs(); renderFields();

  // 5. galereya
  const galBox = $("[data-gal]", view);
  const renderGal = () => {
    galBox.innerHTML = p.gallery.length ? p.gallery.map((g, i) => `
      <div class="gal-item"><img src="${srcUrl(g.src)}" alt="">
        <div class="field"><label class="small" for="gc-${i}">Izoh (${lang.toUpperCase()})${i === 0 ? ' · <span class="muted">fon shu rasmdan</span>' : ""}</label>
          <input class="input" id="gc-${i}" data-cap="${i}" maxlength="120" dir="${lang === "ar" ? "rtl" : "ltr"}" value="${esc(g.cap?.[lang] || "")}" placeholder="${esc(lang === "uz" ? "Masalan: Sovuq suvda ham to‘liq kuch" : g.cap?.uz || "")}"></div>
        <div class="tools">
          <button type="button" class="btn btn-sm icon-btn btn-ghost" data-gup="${i}" ${i === 0 ? "disabled" : ""} aria-label="Yuqoriga">${I.up}</button>
          <button type="button" class="btn btn-sm icon-btn btn-ghost" data-gdown="${i}" ${i === p.gallery.length - 1 ? "disabled" : ""} aria-label="Pastga">${I.down}</button>
          <button type="button" class="btn btn-sm icon-btn btn-ghost btn-danger" data-gdel="${i}" aria-label="O‘chirish">${I.trash}</button></div></div>`).join("")
      : `<div class="muted small">Hali rasm yo‘q.</div>`;
  };
  galBox.oninput = (e) => { const i = e.target.dataset.cap; if (i !== undefined) { p.gallery[+i].cap = { ...(p.gallery[+i].cap || {}), [lang]: e.target.value }; mark(); renderSave(); } };
  galBox.onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const g = p.gallery;
    if (b.dataset.gup) { const i = +b.dataset.gup; [g[i - 1], g[i]] = [g[i], g[i - 1]]; if (i === 1) atmoStale = true; }
    if (b.dataset.gdown) { const i = +b.dataset.gdown; [g[i + 1], g[i]] = [g[i], g[i + 1]]; if (i === 0) atmoStale = true; }
    if (b.dataset.gdel) { const i = +b.dataset.gdel; g.splice(i, 1); if (i === 0) atmoStale = true; }
    renderGal(); changed();
  };
  $("[data-file=gallery]", view).onchange = async (e) => {
    const files = [...e.target.files].slice(0, 8 - p.gallery.length); e.target.value = "";
    const box = $("[data-checks=gallery]", view); box.innerHTML = "";
    if (!files.length) { toast("Ko‘pi bilan 8 ta rasm", "err"); return; }
    for (const file of files) {
      const row = document.createElement("div"); row.innerHTML = `<div class="small" style="font-weight:600;margin-top:8px">${esc(file.name)}</div><div class="checks"><div class="check"><span class="spinner"></span><span>Tekshirilmoqda…</span></div></div>`;
      box.appendChild(row);
      try {
        if (!/^image\/(png|webp|jpeg)$/.test(file.type)) throw Object.assign(new Error("type"), { code: "type" });
        const img = await loadImage(file), res = checkGallery(file, img);
        if (res.some(([t]) => t === "bad")) { row.lastElementChild.outerHTML = checksHtml(res); continue; }
        const up = await upload(await prepareGallery(img), (p.id || "rasm") + "-gal");
        if (!p.gallery.length) atmoStale = true;
        p.gallery.push({ src: up.url, cap: {} });
        row.lastElementChild.outerHTML = checksHtml([...res, ["ok", "Yuklandi"]]);
        renderGal(); changed();
      } catch (err) { row.lastElementChild.outerHTML = checksHtml([["bad", errText(err)]]); }
    }
  };
  renderGal(); renderPreview(); renderSave();

  // Saqlash / o'chirish
  $("[data-save]", view).onclick = async () => {
    const btn = $("[data-save]", view);
    const miss = !p.name ? "name" : !p.id ? "slug" : !p.pack ? "pack" : !p.i18n.uz.scent || !p.i18n.uz.line ? "uz_text" : null;
    if (miss) { toast(ERR[miss], "err"); if (miss === "uz_text") { lang = "uz"; renderTabs(); renderFields(); } return; }
    btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>Saqlanmoqda…`;
    try {
      if (atmoStale || !p.atmo) {
        const src = p.gallery[0]?.src || p.pack;
        try { p.atmo = (await upload(await makeAtmo(srcUrl(src)), (p.id || "fon") + "-atmo")).url; } catch {}
      }
      if (isNew) await api("/products", { method: "POST", body: p });
      else await api(`/products/${p.id}`, { method: "PUT", body: p });
      setDirty(false); state.products = [];
      toast(isNew ? "Mahsulot qo‘shildi — saytda ~20 soniyada ko‘rinadi" : "Saqlandi — saytda ~20 soniyada yangilanadi", "ok", { href: `/#/${p.id}`, label: "Saytda ochish" });
      location.hash = `#/products/${p.id}`; if (!isNew) route();
    } catch (e) { toast(errText(e), "err"); }
    btn.disabled = false; btn.textContent = isNew ? "Mahsulotni qo‘shish" : "Saqlash";
  };
  const del = $("[data-delete]", view);
  if (del) del.onclick = async () => {
    if (!(await confirmBox(`«${p.name}» o‘chirilsinmi?`, "Mahsulot saytdan butunlay o‘chadi. Vaqtincha yashirish uchun «Qoralama» holatini tanlang.", "O‘chirish", true))) return;
    await api(`/products/${p.id}`, { method: "DELETE" }); setDirty(false); state.products = [];
    toast("Mahsulot o‘chirildi"); location.hash = "#/products";
  };
}

/* =====================================================================
   SAYT MATNLARI
   ===================================================================== */
const SECTIONS = [
  ["hero", "Bosh ekran", [["hero.kicker", "Pastki qatordagi yozuv"], ["hero.prev", "«Oldingi» yozuvi"], ["hero.next", "«Keyingi» yozuvi"], ["hero.swipe", "Surish ishorasi"], ["nav.order", "«Buyurtma berish» tugmasi"]]],
  ["why", "Nega kapsula", [["zoom.k", "Kichik sarlavha"], ["zoom.t", "Sarlavha"], ["zoom.p", "Matn", 1]]],
  ["benefits", "Afzalliklar", [1, 2, 3, 4].flatMap((n) => [[`b${n}.old`, `${n}-afzallik: eski usul (ustidan chizilgan)`], [`b${n}.new`, `${n}-afzallik: sarlavha`], [`b${n}.p`, `${n}-afzallik: matn`, 1]])
    .concat([1, 2, 3, 4].map((n) => [`b.nav${n}`, `O‘ngdagi ${n}-ikonka nomi`]))],
  ["solo", "Men BÄRC", [["solo.k", "Kichik sarlavha"], ["solo.t", "Sarlavha"], ["solo.p", "Matn", 1]]],
  ["usage", "Foydalanish", [["usage.k", "Kichik sarlavha"], ["usage.t", "Sarlavha"], ["usage.s1", "1-qadam"], ["usage.s2", "2-qadam"], ["usage.s3", "3-qadam"], ["marquee", "Katta yuguruvchi yozuv"]]],
  ["range", "Iforlar qatori", [["range.k", "Kichik sarlavha"], ["range.t", "Sarlavha"], ["range.hint", "Ishora (kompyuter)"], ["range.hintTouch", "Ishora (telefon)"], ["range.more", "«Batafsil» yozuvi"]]],
  ["faq", "Savollar", [["faq.k", "Kichik sarlavha"], ["faq.t", "Sarlavha"], ...[1, 2, 3, 4, 5, 6].flatMap((n) => [[`faq.q${n}`, `${n}-savol`], [`faq.a${n}`, `${n}-javob`, 1]])]],
  ["outro", "Yakun va pastki qism", [["outro.t", "Katta sarlavha"], ["outro.p", "Matn"], ["outro.cta", "Tugma"], ["foot.rights", "Huquqlar yozuvi"]]],
  ["product", "Mahsulot sahifasi", [["p.back", "«Bosh sahifa» havolasi"], ["p.cat", "Yorliq"], ["p.meta", "Qisqa ma’lumot qatori"], ["p.desc", "«Ifor haqida» sarlavhasi"], ["p.for", "«Kim uchun» sarlavhasi"], ["p.three", "«Bitta kapsulada uchta» sarlavhasi"],
    ["p.t1", "1-xususiyat"], ["p.t1p", "1-xususiyat izohi"], ["p.t2", "2-xususiyat"], ["p.t2p", "2-xususiyat izohi"], ["p.t3", "3-xususiyat"], ["p.t3p", "3-xususiyat izohi"],
    ["p.use", "«Qanday ishlatiladi» sarlavhasi"], ["p.safety", "«Xavfsizlik» sarlavhasi"], ["p.s1", "Xavfsizlik 1"], ["p.s2", "Xavfsizlik 2"], ["p.s3", "Xavfsizlik 3"], ["p.s4", "Xavfsizlik 4"],
    ["p.pack", "«Qadoq» sarlavhasi"], ["p.packV", "Qadoq hajmi"], ["p.price", "Narx haqida yozuv", 1], ["p.orderThis", "Buyurtma tugmasi"], ["p.gallery", "Galereya sarlavhasi"], ["p.other", "«Boshqa iforlar» sarlavhasi"]]],
  ["order", "Buyurtma oynasi", [["o.title", "Sarlavha"], ["o.s1", "1-qadam nomi"], ["o.s2", "2-qadam nomi"], ["o.phone", "Telefon maydoni"], ["o.name", "Ism maydoni"], ["o.comment", "Izoh maydoni"], ["o.optional", "«ixtiyoriy» so‘zi"],
    ["o.next", "«Davom etish» tugmasi"], ["o.back", "«Orqaga» tugmasi"], ["o.submit", "Yuborish tugmasi"], ["o.total", "«Jami» yozuvi"], ["o.packs", "«qadoq» so‘zi"], ["o.note", "To‘lov haqida izoh", 1],
    ["o.okT", "Muvaffaqiyat sarlavhasi"], ["o.okP", "Muvaffaqiyat matni ({n} — buyurtma raqami)", 1], ["o.errPhone", "Xato: telefon"], ["o.errItems", "Xato: mahsulot tanlanmagan"], ["o.errSend", "Xato: yuborilmadi"], ["o.done", "«Yopish» tugmasi"]]],
  ["menu", "Menyu va tugmalar", [["menu.home", "Menyu: Bosh sahifa"], ["menu.benefits", "Menyu: Afzalliklar"], ["menu.usage", "Menyu: Foydalanish"], ["menu.range", "Menyu: Iforlar"], ["menu.faq", "Menyu: Savollar"], ["menu.order", "Menyu: Buyurtma"],
    ["nav.menu", "«Menyu» tugmasi"], ["nav.close", "«Yopish» tugmasi"], ["loader", "Yuklanish yozuvi"]]],
  ["seo", "Google (SEO)", [["meta.title", "Sahifa nomi — brauzer yorlig‘i va Google natijasi"], ["meta.desc", "Google’dagi tavsif (150 belgigacha)", 1]]],
];
async function viewTexts(view, sec) {
  const server = await api("/texts");
  const DEF = window.I18N || {};
  const work = Object.fromEntries(LANGS.map(([l]) => [l, { ...(server[l]?.data || {}) }]));
  const saved = JSON.stringify(work);
  let lang = "uz", cur = SECTIONS.find((s) => s[0] === sec) ? sec : "hero";
  const effective = (l, k) => work[l][k] ?? DEF[l]?.[k] ?? "";
  const changedIn = (l, keys) => keys.filter(([k]) => work[l][k] !== undefined).length;
  const mark = () => { setDirty(JSON.stringify(work) !== saved); renderBar(); };

  view.innerHTML = `
  <div class="page-head"><div><h1>Sayt matnlari</h1><p>Har bir yozuvni 4 tilda o‘zgartiring. Bo‘sh qoldirilsa — asl matn qaytadi.</p></div>
    <div class="actions"><div class="lang-tabs" data-lang-tabs></div></div></div>
  <div class="texts">
    <nav class="card tnav" data-tnav></nav>
    <section class="card" data-tfields></section>
  </div>
  <div class="savebar"><span class="grow" data-save-state></span><button class="btn btn-ghost" data-revert>Bekor qilish</button><button class="btn btn-primary" data-save>Saqlash</button></div>`;

  const renderTabs = () => { $("[data-lang-tabs]", view).innerHTML = LANGS.map(([l, s, t]) => `<button type="button" class="${l === lang ? "on" : ""}" data-l="${l}" title="${t}">${s}</button>`).join(""); };
  const renderNav = () => {
    $("[data-tnav]", view).innerHTML = SECTIONS.map(([id, t, keys]) => { const n = changedIn(lang, keys); return `<a href="#/texts?s=${id}" data-s="${id}" class="${id === cur ? "on" : ""}">${t}${n ? `<span class="n">${n}</span>` : ""}</a>`; }).join("");
  };
  const renderFields = () => {
    const [, title, keys] = SECTIONS.find((s) => s[0] === cur), dir = lang === "ar" ? "rtl" : "ltr";
    $("[data-tfields]", view).innerHTML = `<div class="card-head"><h2>${title}</h2><a class="small" href="/" target="_blank" rel="noopener">Saytda ko‘rish ↗</a></div>` + keys.map(([k, label, multi]) => {
      const def = DEF[lang]?.[k] ?? "", ch = work[lang][k] !== undefined, v = effective(lang, k);
      const isLines = (DEF.uz?.[k] || "").includes("|");
      return `<div class="tfield"><div class="tfield-head"><label for="t-${k}">${label}</label>${ch ? `<span><span class="tag-changed">O‘zgartirilgan</span> <button class="link-btn" data-reset="${k}">Asl holiga</button></span>` : ""}</div>
        ${multi || v.length > 70 ? `<textarea class="input" id="t-${k}" data-k="${k}" rows="${Math.min(6, Math.ceil(v.length / 70) + 1)}" dir="${dir}">${esc(v)}</textarea>` : `<input class="input" id="t-${k}" data-k="${k}" dir="${dir}" value="${esc(v)}">`}
        ${isLines ? `<span class="hint">« | » belgisi — sarlavhani yangi qatorga o‘tkazadi.</span>` : ""}
        ${ch && def ? `<span class="orig">Asl matn: ${esc(def)}</span>` : ""}</div>`;
    }).join("");
  };
  const renderBar = () => {
    const n = LANGS.reduce((a, [l]) => a + Object.keys(work[l]).filter((k) => JSON.stringify(work[l][k]) !== JSON.stringify(JSON.parse(saved)[l][k])).length, 0);
    const el = $("[data-save-state]", view); el.className = "grow" + (state.dirty ? " dirty" : "");
    el.textContent = state.dirty ? `${n} ta saqlanmagan o‘zgarish` : "Barcha o‘zgarishlar saqlangan";
    $("[data-save]", view).disabled = !state.dirty; $("[data-revert]", view).disabled = !state.dirty;
  };
  const all = () => { renderTabs(); renderNav(); renderFields(); renderBar(); };

  $("[data-lang-tabs]", view).onclick = (e) => { const b = e.target.closest("[data-l]"); if (b) { lang = b.dataset.l; all(); } };
  $("[data-tnav]", view).onclick = (e) => { const a = e.target.closest("[data-s]"); if (!a) return; e.preventDefault(); cur = a.dataset.s; state.ignoreHash = true; history.replaceState(null, "", `#/texts?s=${cur}`); state.ignoreHash = false; state.lastHash = location.hash; renderNav(); renderFields(); };
  const fieldsBox = $("[data-tfields]", view);
  fieldsBox.oninput = (e) => {
    const k = e.target.dataset.k; if (!k) return;
    const v = e.target.value, def = DEF[lang]?.[k] ?? "";
    if (v === def || !v.trim()) delete work[lang][k]; else work[lang][k] = v;
    mark(); renderNav();
    const head = e.target.closest(".tfield").querySelector(".tfield-head");
    const has = work[lang][k] !== undefined, tag = head.querySelector(".tag-changed");
    if (has && !tag) head.insertAdjacentHTML("beforeend", `<span><span class="tag-changed">O‘zgartirilgan</span> <button class="link-btn" data-reset="${k}">Asl holiga</button></span>`);
    if (!has && tag) tag.parentElement.remove();
  };
  fieldsBox.onclick = (e) => { const b = e.target.closest("[data-reset]"); if (!b) return; delete work[lang][b.dataset.reset]; mark(); renderNav(); renderFields(); };
  $("[data-revert]", view).onclick = () => { const s = JSON.parse(saved); LANGS.forEach(([l]) => (work[l] = s[l])); mark(); all(); };
  $("[data-save]", view).onclick = async () => {
    const btn = $("[data-save]", view); btn.disabled = true;
    try {
      const s = JSON.parse(saved);
      for (const [l] of LANGS) if (JSON.stringify(work[l]) !== JSON.stringify(s[l])) await api(`/texts/${l}`, { method: "PUT", body: { data: work[l] } });
      setDirty(false); toast("Matnlar saqlandi — saytda ~20 soniyada yangilanadi", "ok", { href: "/", label: "Saytni ochish" });
      viewTexts(view, cur);
    } catch (e) { toast(errText(e), "err"); btn.disabled = false; }
  };
  all();
}

/* =====================================================================
   SOZLAMALAR
   ===================================================================== */
async function viewSettings(view) {
  const s = await api("/settings");
  view.innerHTML = `
  <div class="page-head"><div><h1>Sozlamalar</h1><p>Telegram xabarnomalari, kontaktlar va parol.</p></div></div>
  <div class="settings">
    <section class="card">
      <div class="card-head"><h2>Telegram: yangi buyurtma xabari</h2>${s.tg_token_set && s.tg_chat ? '<span class="st st-delivered">Ulangan</span>' : '<span class="st st-cancelled">Ulanmagan</span>'}</div>
      <div class="card-pad">
        <ol class="howto">
          <li>Telegram’da <b>@BotFather</b> ga yozing → <code>/newbot</code> → bot nomini bering. U bergan <b>token</b>ni quyiga qo‘ying va saqlang.</li>
          <li>Botni menejerlar guruhiga qo‘shing va guruhga istalgan xabar yozing (yoki botga shaxsan «/start» yuboring).</li>
          <li>«Chatni topish» tugmasini bosing va ro‘yxatdan guruhni tanlang.</li>
          <li>«Sinov xabari» bilan tekshiring.</li>
        </ol>
        <div class="field" style="margin-top:16px"><label for="s-token">Bot tokeni</label><input class="input" id="s-token" value="${esc(s.tg_token || "")}" placeholder="123456789:AA..." autocomplete="off"></div>
        <div class="field"><label for="s-chat">Chat ID</label><div class="row"><input class="input" id="s-chat" value="${esc(s.tg_chat || "")}" placeholder="-1001234567890"><button class="btn" type="button" data-find>Chatni topish</button></div><div class="chat-pick" data-chats></div></div>
        <div class="actions" style="margin-top:16px"><button class="btn btn-primary" data-save-tg>Saqlash</button><button class="btn" data-test>Sinov xabari</button><span data-tg-res style="align-self:center"></span></div>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Kontaktlar (sayt pastida)</h2></div>
      <div class="card-pad">
        <div class="field"><label for="s-phone">Telefon</label><input class="input" id="s-phone" value="${esc(s.contact_phone || "")}" placeholder="+998 90 123 45 67"></div>
        <div class="field"><label for="s-ig">Instagram havolasi</label><input class="input" id="s-ig" value="${esc(s.contact_instagram || "")}" placeholder="https://instagram.com/barc.uz"></div>
        <div class="field"><label for="s-tgl">Telegram havolasi</label><input class="input" id="s-tgl" value="${esc(s.contact_telegram || "")}" placeholder="https://t.me/barc_uz"></div>
        <span class="hint">Bo‘sh qolgan havola saytda ko‘rinmaydi.</span>
        <div class="actions" style="margin-top:16px"><button class="btn btn-primary" data-save-c>Saqlash</button></div>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Parolni o‘zgartirish</h2></div>
      <form class="card-pad" data-pass>
        <div class="field"><label for="s-cur">Joriy parol</label><input class="input" id="s-cur" type="password" autocomplete="current-password" required></div>
        <div class="field"><label for="s-new">Yangi parol</label><input class="input" id="s-new" type="password" autocomplete="new-password" minlength="8" required><span class="hint">Kamida 8 belgi. O‘zgartirgach, boshqa qurilmalardagi sessiyalar yopiladi.</span></div>
        <div class="actions" style="margin-top:16px"><button class="btn btn-primary">Parolni yangilash</button><span data-pass-res style="align-self:center"></span></div>
      </form>
    </section>
  </div>`;
  const res = $("[data-tg-res]", view);
  const saveTg = async () => { await api("/settings", { method: "PUT", body: { tg_token: $("#s-token").value, tg_chat: $("#s-chat").value } }); };
  $("[data-save-tg]", view).onclick = async () => { try { await saveTg(); toast("Telegram sozlamalari saqlandi", "ok"); viewSettings(view); } catch (e) { toast(errText(e), "err"); } };
  $("[data-test]", view).onclick = async () => {
    res.innerHTML = '<span class="spinner"></span>';
    try { await saveTg(); await api("/settings/telegram-test", { method: "POST" }); res.innerHTML = '<span class="inline-ok">✓ Xabar yuborildi</span>'; }
    catch (e) { res.innerHTML = `<span class="inline-err">✕ ${esc(e.code === "tg_missing" ? ERR.tg_missing : "Telegram: " + e.code)}</span>`; }
  };
  $("[data-find]", view).onclick = async () => {
    const box = $("[data-chats]", view); box.innerHTML = '<span class="spinner"></span>';
    try {
      await saveTg();
      const { chats } = await api("/settings/telegram-chats");
      box.innerHTML = chats.length ? chats.map((c) => `<button type="button" data-chat="${c.id}"><span><b>${esc(c.title || "Chat")}</b> <span class="muted small">${c.type === "private" ? "shaxsiy" : "guruh"}</span></span><span class="muted">${c.id}</span></button>`).join("")
        : `<span class="muted small">Chat topilmadi. Botni guruhga qo‘shib, guruhga xabar yozing va qayta bosing.</span>`;
      box.onclick = (e) => { const b = e.target.closest("[data-chat]"); if (b) { $("#s-chat").value = b.dataset.chat; box.innerHTML = ""; toast("Chat tanlandi — «Saqlash» ni bosing", "ok"); } };
    } catch (e) { box.innerHTML = `<span class="inline-err small">${esc(e.code === "tg_missing" ? "Avval tokenni kiriting" : "Telegram: " + e.code)}</span>`; }
  };
  $("[data-save-c]", view).onclick = async () => {
    try { await api("/settings", { method: "PUT", body: { contact_phone: $("#s-phone").value, contact_instagram: $("#s-ig").value, contact_telegram: $("#s-tgl").value } }); toast("Kontaktlar saqlandi", "ok"); }
    catch (e) { toast(errText(e), "err"); }
  };
  $("[data-pass]", view).onsubmit = async (e) => {
    e.preventDefault(); const r = $("[data-pass-res]", view);
    try { await api("/password", { method: "POST", body: { current: $("#s-cur").value, next: $("#s-new").value } }); r.innerHTML = '<span class="inline-ok">✓ Parol yangilandi</span>'; e.target.reset(); }
    catch (err) { r.innerHTML = `<span class="inline-err">✕ ${esc(errText(err))}</span>`; }
  };
}

/* ---------------- Ishga tushirish ---------------- */
async function start() {
  try { await api("/me"); } catch (e) { if (e.code !== "auth") { $("#root").innerHTML = `<div class="login"><div class="login-card"><h1>Server bilan aloqa yo‘q</h1><p class="muted">${esc(errText(e))}</p><button class="btn btn-primary btn-block" onclick="location.reload()">Qayta urinish</button></div></div>`; } return; }
  renderShell(); startPolling(); route();
}
start();
})();
