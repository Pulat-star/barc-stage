/* =============================================================
   BÄRC — bog'langan harakat tizimi
   1 sahna (#stage) · 1 master timeline (scroll scrub) · 1 store
   Mahsulot almashsa: CSS ranglar, fon, pufakchalar — bir vaqtda 0.8s.
   ============================================================= */
(async () => {
gsap.registerPlugin(ScrollTrigger);

/* ---------------- Ma'lumot: admin paneldan (D1), bo'lmasa — zaxira ----------------
   Sayt API ishlamasa ham ochilaveradi: quyidagi zaxira ro'yxat va i18n.js matnlari ishlaydi. */
const CAP = (k) => Object.fromEntries(["uz", "ru", "en", "ar"].map((l) => [l, (I18N[l] || {})[k] || ""]));
const FALLBACK = [
  { id: "amethyst", name: "Amethyst", theme: { bg: "#1E0A2E", bg2: "#0B0414", surface: "#6A1FA8", accent: "#C58BFF", glow: "#9B3DEB" } },
  { id: "crystal", name: "Crystal Bloom", theme: { bg: "#071A45", bg2: "#030A1E", surface: "#1C55D6", accent: "#7DC2FF", glow: "#2F7BFF" } },
  { id: "original", name: "Original", theme: { bg: "#062A1A", bg2: "#02130B", surface: "#1E8A3E", accent: "#8EE58A", glow: "#2FBF55" } },
].map((p) => ({ ...p, img: `assets/img/${p.id}.webp`, atmo: `assets/img/${p.id}-atmo.webp`,
  gallery: [["studio", null], ["real-front", null], ["real-34", null], ["scent", `prod.${p.id}.g1`], ["real-pod", null], ["room", null], ["real-back", null], ["real-lock", null]]
    .map(([f, k]) => ({ src: `assets/img/${p.id}-${f}.webp`, cap: k ? CAP(k) : { uz: p.name } })) }));

async function loadSite() {
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 3500);
    const res = await fetch("/api/site", { signal: ctl.signal }); clearTimeout(tm);
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    if (!d.products || !d.products.length) throw new Error("empty");
    for (const [l, map] of Object.entries(d.texts || {})) Object.assign(I18N[l] || (I18N[l] = {}), map);
    const list = d.products.map((p) => {
      for (const [l, f] of Object.entries(p.i18n || {}))
        for (const [k, v] of Object.entries(f)) if (v) (I18N[l] || (I18N[l] = {}))[`prod.${p.id}.${k}`] = v;
      return { id: p.id, name: p.name, img: p.pack, atmo: p.atmo, theme: p.theme, gallery: p.gallery || [] };
    });
    return { list, contacts: d.contacts || {} };
  } catch (e) {
    return { list: FALLBACK, contacts: {} };
  }
}
const SITE = await loadSite();
const PRODUCTS = SITE.list;
const N = PRODUCTS.length;
const LANGS = ["uz", "ru", "en", "ar"];
const EASE_IN = "power3.out", EASE_IO = "power2.inOut", THEME_DUR = 0.8;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mq = matchMedia("(max-width: 860px)");
let isMobile = mq.matches;

/* ---------------- Store ---------------- */
const store = { active: 0, theme: 0, section: "hero", lang: "uz", soundOn: false, view: "home", hover: -1, loaded: false };
const dirSign = () => (document.documentElement.dir === "rtl" ? -1 : 1);

/* ---------------- Sahna holati ----------------
   S — timeline/tweenlar yozadigan maqsad; R — ekranda chizilgan, S ga silliq yaqinlashadi. */
const BASE = { x: 0, y: 0, scale: 1, rz: 0, ry: 0, nb: 0, row: 0, op: 1, bob: .5, ped: 0, dark: 0, bub: .4, fl: 0 };
const KF = {
  hero:  { y: 8, scale: .82, nb: 1, ped: 1, bob: 1, bub: .5, fl: 1 },
  zoom:  { x: 20, y: 4, scale: 1.3, rz: -9, ry: -14, bob: .3, dark: .1, bub: .3 },
  b1:    { x: 22, scale: 1.06, rz: 6, ry: -18, bob: .4 },
  b2:    { x: -22, scale: 1.06, rz: -6, ry: 18, bob: .4 },
  b3:    { x: 22, y: -2, scale: 1.1, rz: -4, ry: -8, bob: .4 },
  b4:    { x: -22, y: -2, scale: 1.1, rz: 4, ry: 8, bob: .4 },
  solo:  { y: 14, scale: .6, bob: 1, dark: .75, bub: 1, fl: .7 },
  usage: { x: 34, y: -26, scale: .4, rz: -12, dark: .25, bub: .3 },
  range: { y: 2, scale: .62, nb: 1, row: 1, bob: .4, fl: 1 },
  faq:   { scale: .55, nb: 0, row: 1, op: 0, bub: .2 },
  outro: { y: 6, scale: .5, dark: .5, bub: .8, bob: 1, fl: .8 },
  end:   { y: -30, scale: .6, op: 0, bub: .2 },
  phero: { x: 24, y: 4, scale: 1.05, ry: -10, bob: .6, dark: .15, bub: .3, fl: .7 },
  pdock: { x: 40, y: -31, scale: .26, rz: -8, bob: .2, dark: .15, bub: .2 },
  pgone: { x: 40, y: -31, scale: .26, rz: -8, op: 0, bub: .2 },
};
const KF_M = {
  hero:  { y: 4, scale: .9 },
  zoom:  { x: 0, y: -14, scale: .72 },
  b1:    { x: 6, y: -17, scale: .6 }, b2: { x: -6, y: -17, scale: .6 },
  b3:    { x: 6, y: -17, scale: .6 }, b4: { x: -6, y: -17, scale: .6 },
  solo:  { y: 3, scale: .48 },
  usage: { x: 30, y: -36, scale: .22, op: 0 },
  range: { y: 0, scale: .32 }, faq: { scale: .32 },
  outro: { y: 12, scale: .42 },
  phero: { x: 0, y: 26, scale: .6 },
  pdock: { x: 34, y: -36, scale: .2, op: 0 }, pgone: { x: 34, y: -36, scale: .2, op: 0 }, // telefonda matnni yopmasin
};
const kf = (n) => ({ ...BASE, ...KF[n], ...(isMobile ? KF_M[n] : null) });

const S = kf("hero");
const R = { ...S, scale: .6, y: 20, op: 0 };
const slots = PRODUCTS.map((_, i) => rel(i, 0));
const hoverAmt = PRODUCTS.map(() => 0);
function rel(j, a) { let d = (j - a + N) % N; if (d > N / 2) d -= N; return d; }
// Qatorda (range) mahsulotlar ko'p bo'lsa — oraliq va o'lcham moslashadi
const rowGap = () => isMobile ? Math.min(31, 76 / Math.max(1, N - 1)) : Math.min(28, 72 / Math.max(1, N - 1));
const rowK = N <= 3 ? 1 : 3 / N;

/* ---------------- Render (har kadr) ---------------- */
(() => {
  const stage = $("#stage"), dots = $(".hero-dots");
  $$(".prod, .floor-shadow", stage).forEach((el) => el.remove());
  PRODUCTS.forEach((p, i) => {
    stage.insertAdjacentHTML("beforeend", `<i class="floor-shadow"></i>`);
    stage.insertAdjacentHTML("beforeend", `<div class="prod" data-i="${i}"><img src="${p.img}" alt="" draggable="false"></div>`);
  });
  dots.innerHTML = PRODUCTS.map((p, i) => `<button type="button" role="tab" data-go="${i}" aria-label="${p.name.replace(/"/g, "")}" data-cursor></button>`).join("");
  // Kontaktlar (admin → Sozlamalar)
  const c = SITE.contacts, links = [];
  if (c.instagram) links.push(`<a href="${c.instagram}" target="_blank" rel="noopener" data-cursor>Instagram</a>`);
  if (c.telegram) links.push(`<a href="${c.telegram}" target="_blank" rel="noopener" data-cursor>Telegram</a>`);
  if (c.phone) links.push(`<a href="tel:${c.phone.replace(/[^+\d]/g, "")}" data-cursor>${c.phone}</a>`);
  const box = $("#foot-links"); if (box) box.innerHTML = links.join(" · ");
})();
const prodEls = $$("#stage .prod");
const imgEls = prodEls.map((el) => $("img", el));
const shadowEls = $$("#stage .floor-shadow");
let prodH = prodEls[0].offsetHeight;
const pedestal = $(".pedestal");
const stageEl = $("#stage");
const atmoDark = $(".atmo-dark");
let lastT = performance.now();

const filterCache = new WeakMap();
function setFilter(el, v) { if (filterCache.get(el) !== v) { filterCache.set(el, v); el.style.filter = v; } }
function render() {
  const now = performance.now();
  const dt = Math.min(64, now - lastT) / 16.67; lastT = now;
  const k = reduced ? 1 : 1 - Math.pow(1 - .1, dt);
  for (const key in S) R[key] = lerp(R[key], S[key], k);

  const vw = innerWidth / 100, vh = innerHeight / 100, d = dirSign(), t = now / 1000;
  const gap = lerp(isMobile ? 47 : 40, rowGap(), R.row);
  const sideS = lerp(.5, R.scale, R.row);
  const sideOp = lerp(.6, 1, R.row) * R.nb;
  const sideBlur = lerp(1.5, 0, R.row);

  prodEls.forEach((el, i) => {
    // Karuselda — faol mahsulotga nisbatan; qatorda — o'z tartibi bo'yicha, markazdan teng
    const o = lerp(slots[i], i - (N - 1) / 2, R.row), ao = Math.abs(o), c = clamp(1 - ao, 0, 1);
    hoverAmt[i] = lerp(hoverAmt[i], store.hover === i ? 1 : 0, k);
    const bob = reduced ? 0 : Math.sin(t * 1.1 + i * 1.7) * 10 * R.bob;
    const X = d * (R.x * c + o * gap) * vw;
    const yBase = R.y * lerp(1, c, R.row) + o * R.row * -4; // karuselda yon qadoqlar ham markaz bilan bir chiziqda
    const Y = yBase * vh + bob;
    const sc = lerp(sideS, R.scale, c) * (1 + hoverAmt[i] * .07) * lerp(1, rowK, R.row);
    const op = lerp(sideOp, 1, c) * R.op * lerp(clamp(2 - ao, 0, 1), clamp(N / 2 + .6 - ao, 0, 1), R.row);
    const blur = lerp(sideBlur, 0, c);
    const rz = d * (R.rz * c + o * R.row * 3), ry = d * R.ry * c;
    el.style.transform = `translate(-50%,-50%) translate3d(${X.toFixed(1)}px,${Y.toFixed(1)}px,0) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
    el.style.opacity = op.toFixed(3);
    el.style.visibility = op < .005 ? "hidden" : "visible";
    setFilter(el, blur > .4 ? `blur(${Math.round(blur)}px)` : "none");
    el.style.zIndex = String(10 - Math.round(ao * 3));

    // Soya: yorug'lik yuqori-chapdan. Qadoq ko'tarilsa soya kichrayadi, xiralashadi va ochadi;
    // qiyshaysa — soya ham suriladi. Pol — mahsulotning tinch holatdagi pastki cheti.
    const half = prodH * sc * .5;
    const floorY = yBase * vh + half;
    const lift = Math.max(0, floorY - (Y + half)) + Math.abs(rz) * 1.2 + Math.abs(ry) * .4;
    const sx = (prodH * .74 * sc * .92) / 240 * clamp(1 - lift * .004, .55, 1);
    const sOp = R.fl * op * clamp(1 - lift / 90, .3, 1) * (1 - ao * .35);
    const sh = shadowEls[i];
    sh.style.transform = `translate3d(${(X + d * rz * 2.2 + 10 * sc).toFixed(1)}px,${(floorY + 4 * sc).toFixed(1)}px,0) scale(${sx.toFixed(3)},${(sx * clamp(1 - lift * .003, .6, 1)).toFixed(3)})`;
    sh.style.opacity = sOp.toFixed(3);
    // Qadoqning o'z soyasi CSS'da qat'iy (GPU bir marta chizadi); harakatni pol soyasi beradi.
  });
  pedestal.style.transform = `translate3d(${(d * R.x * vw).toFixed(1)}px,${(R.y * vh + prodH * R.scale * .5).toFixed(1)}px,0) scale(${R.scale.toFixed(3)})`;
  pedestal.style.opacity = (R.ped * R.op).toFixed(3);
  atmoDark.style.opacity = R.dark.toFixed(3);
  drawBubbles(dt);
  marqueeTick(dt);
}

/* ---------------- Pufakchalar ---------------- */
const cvs = $("#bubbles"), ctx = cvs.getContext("2d");
const bubCol = { r: 197, g: 139, b: 255 };
const bubbles = [];
const BUB_MAX = reduced ? 0 : (matchMedia("(max-width: 860px)").matches ? 40 : 110);
function sizeCanvas() {
  prodH = prodEls[0].offsetHeight;
  const dpr = isMobile ? 1 : Math.min(devicePixelRatio || 1, 1.5);
  cvs.width = innerWidth * dpr; cvs.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
for (let i = 0; i < BUB_MAX; i++) bubbles.push(newBubble(true));
function newBubble(anywhere) {
  return { x: Math.random() * innerWidth, y: anywhere ? Math.random() * innerHeight : innerHeight + 20,
           r: 2 + Math.random() * 7, v: .3 + Math.random() * .9, w: Math.random() * 6.28 };
}
function drawBubbles(dt) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const n = Math.floor(BUB_MAX * R.bub * (document.hidden ? 0 : 1));
  const col = `${bubCol.r | 0},${bubCol.g | 0},${bubCol.b | 0}`;
  for (let i = 0; i < n; i++) {
    const b = bubbles[i];
    b.y -= b.v * dt * (1 + b.r / 8); b.w += .02 * dt;
    if (b.y < -20) Object.assign(b, newBubble(false));
    const x = b.x + Math.sin(b.w) * 8;
    ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.283);
    ctx.strokeStyle = `rgba(${col},.45)`; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - b.r * .35, b.y - b.r * .35, b.r * .25, 0, 6.283);
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fill();
  }
}

/* ---------------- Marquee (scroll tezligiga bog'liq) ---------------- */
const mqTrack = $(".mq-track");
let mqX = 0, mqVel = 0;
function marqueeTick(dt) {
  if (!mqTrack || store.view !== "home") return;
  const unit = mqTrack.firstElementChild.offsetWidth || 1;
  const v = (1.2 + Math.min(Math.abs(mqVel) / 60, 14)) * (mqVel < 0 ? -1 : 1) * dt;
  mqX -= reduced ? 0 : v * dirSign();
  if (mqX <= -unit) mqX += unit; if (mqX > 0) mqX -= unit;
  mqTrack.style.transform = `translate3d(${dirSign() === 1 ? mqX : -mqX}px,0,0)`;
}

/* ---------------- Smooth scroll ---------------- */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", (e) => { mqVel = e.velocity * 10; ScrollTrigger.update(); });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
} else {
  addEventListener("scroll", () => { mqVel = 8; }, { passive: true });
}
const scrollTo = (y, immediate) => lenis ? lenis.scrollTo(y, { immediate, duration: 1.4, force: true }) : scrollTo_(y);
function scrollTo_(y) { window.scrollTo({ top: typeof y === "number" ? y : y.getBoundingClientRect().top + scrollY }); }
gsap.ticker.add(render);
addEventListener("scroll", () => document.body.classList.toggle("is-scrolled", scrollY > 40), { passive: true });

/* ---------------- I18N ---------------- */
const t = (key) => (I18N[store.lang] && I18N[store.lang][key]) ?? I18N.uz[key] ?? "";
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function splitWords(el, text) {
  el.innerHTML = text.trim().split("|").map((line) =>
    line.trim().split(/\s+/).map((w) => `<span class="w"><span>${esc(w)}</span></span>`).join(" ")).join("<br>");
}
function applyLang(lang) {
  store.lang = LANGS.includes(lang) ? lang : "uz";
  const html = document.documentElement;
  html.lang = store.lang; html.dir = store.lang === "ar" ? "rtl" : "ltr";
  const touch = matchMedia("(hover: none)").matches;
  $$("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n === "range.hint" && touch ? "range.hintTouch" : el.dataset.i18n;
    const v = t(key);
    if (el.hasAttribute("data-split")) splitWords(el, v); else el.textContent = v.replace(/\|/g, " ");
  });
  $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  document.title = t("meta.title");
  $('meta[name="description"]').content = t("meta.desc");
  $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === store.lang)));
  updateProductText();
  renderRange(); renderOthers(); renderOrderItems();
  try { localStorage.setItem("barc-lang", store.lang); } catch (e) {}
}

/* ---------------- Mavzu o'tishi ---------------- */
const atmoLayers = $$(".atmo-layer");
let atmoFront = 0;
function themeTransition(i, instant) {
  if (store.theme === i && !instant) return;
  store.theme = i;
  if (typeof audioScene === "function") audioScene(i);
  const th = PRODUCTS[i].theme, d = instant ? 0 : THEME_DUR;
  gsap.to(document.documentElement, { "--bg": th.bg, "--bg2": th.bg2, "--surface": th.surface, "--accent": th.accent, "--glow": th.glow, duration: d, ease: EASE_IO, overwrite: "auto" });
  const c = hexRgb(th.accent);
  gsap.to(bubCol, { r: c.r, g: c.g, b: c.b, duration: d, ease: EASE_IO, overwrite: "auto" });
  const next = atmoLayers[1 - atmoFront], prev = atmoLayers[atmoFront];
  next.style.backgroundImage = PRODUCTS[i].atmo ? `url(${PRODUCTS[i].atmo})` : "none";
  gsap.to(next, { opacity: PRODUCTS[i].atmo ? .24 : 0, duration: d, ease: EASE_IO, overwrite: "auto" });
  gsap.to(prev, { opacity: 0, duration: d, ease: EASE_IO, overwrite: "auto" });
  atmoFront = 1 - atmoFront;
  $('meta[name="theme-color"]').content = th.bg;
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; }

/* ---------------- Faol mahsulot ---------------- */
const heroName = $("#hero-name");
function setActive(i, opts = {}) {
  i = (i + N) % N;
  const prev = store.active;
  if (i === prev && !opts.force) return;
  store.active = i;
  PRODUCTS.forEach((_, j) => {
    const from = slots[j], to = rel(j, i);
    gsap.killTweensOf(slots, String(j));
    if (opts.instant) { slots[j] = to; return; }
    if (Math.abs(to - from) > 1.5) { // aylanib o'tish: chetdan chiqib, qarama-qarshi tomondan kiradi
      const exit = from + Math.sign(from), enter = to + Math.sign(to);
      gsap.timeline()
        .to(slots, { [j]: exit, duration: .4, ease: "power2.in" })
        .set(slots, { [j]: enter })
        .to(slots, { [j]: to, duration: .5, ease: EASE_IN });
    } else {
      gsap.to(slots, { [j]: to, duration: THEME_DUR, ease: EASE_IO });
    }
  });
  themeTransition(i, opts.instant);
  updateProductText(!opts.instant);
  renderRange();
  tick();
}
function updateProductText(animate) {
  const p = PRODUCTS[store.active];
  const swap = () => {
    heroName.textContent = p.name.toUpperCase();
    heroName.parentElement.style.fontSize = `${Math.min(21, 90 / (p.name.length * .56)).toFixed(2)}vw`;
  };
  if (animate && !reduced) {
    gsap.timeline()
      .to(heroName, { yPercent: -40, opacity: 0, duration: .3, ease: "power2.in" })
      .add(swap)
      .fromTo(heroName, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .55, ease: EASE_IN });
  } else swap();
  $("#hero-line").textContent = t(`prod.${p.id}.line`);
  $("#peek-prev").textContent = PRODUCTS[(store.active - 1 + N) % N].name;
  $("#peek-next").textContent = PRODUCTS[(store.active + 1) % N].name;
  $("#hero-idx").textContent = `0${store.active + 1} / 0${N}`;
  $$(".hero-dots [data-go]").forEach((b) => b.setAttribute("aria-selected", String(+b.dataset.go === store.active)));
  $("#p-name").textContent = p.name.toUpperCase();
  $("#p-scent").textContent = t(`prod.${p.id}.scent`);
  $("#p-desc").textContent = t(`prod.${p.id}.desc`);
  $("#p-hook").textContent = t(`prod.${p.id}.hook`);
  $("#p-for").textContent = t(`prod.${p.id}.for`);
  if (typeof renderGallery === "function" && galTrack) renderGallery();
}

/* ---------------- Iforlar qatori (range) ---------------- */
const rangeHits = $("#range-hits");
function renderRange() {
  if (!rangeHits) return;
  if (!rangeHits.children.length) {
    rangeHits.innerHTML = PRODUCTS.map((p, j) =>
      `<a class="rhit" href="#/${p.id}" data-j="${j}" data-cursor><span class="rhit-label"><span class="rhit-name">${p.name}</span><span class="rhit-more mono"></span></span></a>`).join("");
    $$(".rhit", rangeHits).forEach((a) => {
      const j = +a.dataset.j;
      const on = () => { store.hover = j; themeTransition(j); };
      a.addEventListener("pointerenter", on); a.addEventListener("focus", on);
      a.addEventListener("pointerleave", () => { store.hover = -1; });
      a.addEventListener("blur", () => { store.hover = -1; });
    });
    rangeHits.addEventListener("pointerleave", () => themeTransition(store.active));
  }
  const gap = rowGap();
  $$(".rhit", rangeHits).forEach((a) => {
    const o = +a.dataset.j - (N - 1) / 2;
    a.style.left = `calc(50% + ${dirSign() * o * gap}vw)`;
    a.style.top = `calc(50% + ${o * -4}vh)`;
    $(".rhit-more", a).textContent = t("range.more") + " →";
  });
}

/* ---------------- Master timeline ---------------- */
let master = null, masterST = null, sectionSTs = [];
const homeEl = $("#home");
const LABELS = ["hero", "zoom", "b1", "b2", "b3", "b4", "solo", "usage", "range", "faq", "outro", "end"];
const secOf = { hero: "#s-hero", zoom: "#s-zoom", b1: "#s-b1", b2: "#s-b2", b3: "#s-b3", b4: "#s-b4", solo: "#s-solo", usage: "#s-usage", range: "#s-range", faq: "#s-faq", outro: "#s-outro", end: "#foot" };
const topOf = (el) => el.getBoundingClientRect().top + scrollY;

function buildMaster() {
  if (master) { masterST.kill(); master.kill(); sectionSTs.forEach((s) => s.kill()); sectionSTs = []; }
  if (store.view !== "home") return;
  const vh = innerHeight;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  master = gsap.timeline({ paused: true });
  // Barcha o'lchovlar oldindan bir marta: tween yaratish stil yozadi, keyingi o'qish esa
  // brauzerni sahifani qayta hisoblashga majburlaydi (telefonda qaytishdagi qotish shundan edi).
  const TOP = new Map($$("#home .sec, #home .range, #foot").map((el) => [el, topOf(el)]));
  const top = (el) => (TOP.has(el) ? TOP.get(el) : topOf(el));

  // 1) Sahna kalit kadrlari — har bo'lim label
  const pts = LABELS.map((l) => {
    let pos = top($(secOf[l]));
    if (l === "hero") pos = 0;
    if (l === "faq") pos -= vh * .2;
    if (l === "end") pos = Math.min(maxScroll, pos - vh * .4);
    return { l, pos: Math.min(pos, maxScroll) };
  });
  pts.forEach((p) => master.addLabel(p.l, p.pos));
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1], b = pts[k];
    const start = Math.max(a.pos, b.pos - vh * .85), dur = Math.max(1, b.pos - start);
    master.fromTo(S, kf(a.l), { ...kf(b.l), duration: dur, ease: EASE_IO, immediateRender: false }, start);
  }

  // 2) DOM — o'sha timeline'ning o'sha label'larida
  master.fromTo(".hero-meta, .hero-bar, .peek", { opacity: 1, y: 0 },
    { opacity: 0, y: -40, duration: vh * .4, ease: "power1.in", immediateRender: false }, 0);
  master.fromTo(".hero-name", { opacity: 1, scale: 1 },
    { opacity: 0, scale: 1.15, duration: vh * .7, ease: "power1.in", immediateRender: false }, 0);

  $$("#home .sec, #home .range").forEach((sec) => {
    if (sec.id === "s-hero") return;
    const at = top(sec) - vh * .55;
    const words = $$("[data-split] .w > span", sec);
    if (words.length) master.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: vh * .3, ease: EASE_IN, stagger: { amount: vh * .12 } }, at);
    const copy = $$(".copy, .solo-top, .solo-p", sec);
    if (copy.length) master.fromTo(copy, { opacity: 1 }, { opacity: 0, duration: vh * .3, ease: "none", immediateRender: false }, top(sec) + vh * .2);
    const old = $(".old s", sec);
    if (old) master.fromTo(old, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: vh * .25, ease: EASE_IN }, at);
  });
  const steps = $$(".step");
  master.fromTo(steps, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: vh * .3, ease: EASE_IN, stagger: vh * .08 }, top($("#s-usage")) - vh * .3);
  const path = $("#draw-path"), len = path.getTotalLength();
  path.style.strokeDasharray = len;
  master.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: vh * 1.2, ease: "none" }, top($("#s-usage")) - vh * .5);
  master.fromTo(".range-head, .range-hint", { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: vh * .3, ease: EASE_IN }, top($("#s-range")) - vh * .3);
  master.fromTo(".rhit-label", { opacity: 0 }, { opacity: 1, duration: vh * .2, stagger: vh * .05 }, top($("#s-range")) - vh * .1);
  master.fromTo(".faq-list details", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: vh * .25, stagger: vh * .04, ease: EASE_IN }, top($("#s-faq")) - vh * .5);
  master.set({}, {}, maxScroll);

  masterST = ScrollTrigger.create({
    start: 0, end: maxScroll, scrub: reduced ? true : 1, animation: master,
    onUpdate: (self) => gsap.set("#progress i", { scaleX: self.progress }),
  });
  snap(master, masterST);

  // 3) Faol bo'lim → store
  $$("#home [data-label]").forEach((sec) => {
    sectionSTs.push(ScrollTrigger.create({ trigger: sec, start: "top 55%", end: "bottom 55%",
      onToggle: (s) => s.isActive && setSection(sec.dataset.label) }));
  });
}
const bnav = $("#bnav");
function setSection(label) {
  store.section = label;
  const bi = /^b(\d)$/.test(label) ? +label[1] - 1 : -1;
  bnav.classList.toggle("is-on", bi >= 0 && store.view === "home");
  $$("button", bnav).forEach((b, i) => b.classList.toggle("is-active", i === bi));
}
$$("button", bnav).forEach((b, i) => b.addEventListener("click", () => scrollTo(topOf($(`#s-b${i + 1}`)))));

/* ---------------- Hero karuseli: tugma, drag, klaviatura ---------------- */
$("[data-prev]").addEventListener("click", () => setActive(store.active - 1));
// Strelkaga kelinganda o'sha qo'shni mahsulot ozgina oldinga chiqadi
$("[data-prev]").addEventListener("pointerenter", () => { store.hover = (store.active - 1 + N) % N; });
$("[data-next]").addEventListener("pointerenter", () => { store.hover = (store.active + 1) % N; });
$$(".peek").forEach((b) => b.addEventListener("pointerleave", () => { store.hover = -1; }));
$("[data-next]").addEventListener("click", () => setActive(store.active + 1));
$$(".hero-dots [data-go]").forEach((b) => b.addEventListener("click", () => setActive(+b.dataset.go)));
(() => {
  const hero = $("#s-hero"); let x0 = null;
  hero.addEventListener("pointerdown", (e) => { if (!e.target.closest("button")) x0 = e.clientX; });
  addEventListener("pointerup", (e) => {
    if (x0 === null) return; const dx = (e.clientX - x0) * dirSign(); x0 = null;
    if (Math.abs(dx) > 50) setActive(store.active + (dx < 0 ? 1 : -1));
  });
})();
addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  if (e.key === "Escape") { if (!$("#order").hidden) closeOrder(); else if (menuOpen) toggleMenu(false); return; }
  if (store.view !== "home" || store.section !== "hero" || menuOpen || !$("#order").hidden) return;
  const d = dirSign();
  if (e.key === "ArrowRight") setActive(store.active + d);
  if (e.key === "ArrowLeft") setActive(store.active - d);
});

/* ---------------- Mahsulot sahifasi ---------------- */
const productEl = $("#product"), curtain = $("#curtain"), backLink = $("#back-link"), soundBtn = $("#sound");
let productST = null, productTL = null, transitioning = false;

// Qayta qurilganda scrub butun yo'lni qayta yugurib chiqmasin — joriy nuqtaga sakraydi.
// Sahna baribir R orqali silliq yetib boradi.
function snap(tl, st) {
  st.refresh(); tl.progress(st.progress);
  const tw = st.getTween && st.getTween(); if (tw) tw.progress(1);
}
function killProductST() { if (productST) { productST.kill(); productTL.kill(); productST = productTL = null; } }
function buildProductST() {
  killProductST();
  if (store.view !== "product") return;
  const vh = innerHeight, maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  const gal = topOf($(".gallery"));
  productTL = gsap.timeline({ paused: true });
  productTL.fromTo(S, kf("phero"), { ...kf("pdock"), duration: vh * .8, ease: EASE_IO, immediateRender: false }, 0);
  productTL.fromTo(S, kf("pdock"), { ...kf("pgone"), duration: vh * .3, ease: "none", immediateRender: false }, Math.max(vh * .8, gal - vh * .6));
  $$(".p-row", productEl).forEach((row) => {
    productTL.fromTo(row, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: vh * .3, ease: EASE_IN }, Math.max(0, topOf(row) - vh * .9));
  });
  productTL.set({}, {}, maxScroll);
  productST = ScrollTrigger.create({ start: 0, end: maxScroll, scrub: reduced ? true : 1, animation: productTL,
    onUpdate: (self) => gsap.set("#progress i", { scaleX: self.progress }) });
  snap(productTL, productST);
}

function renderOthers() {
  const box = $("#others"); if (!box) return;
  box.innerHTML = PRODUCTS.filter((_, j) => j !== store.active).map((p) =>
    `<a class="ocard" href="#/${p.id}" style="--c:${p.theme.surface}" data-j="${PRODUCTS.indexOf(p)}" data-cursor>
       <span class="mono">${esc(t(`prod.${p.id}.scent`))}</span><img src="${p.img}" alt="" loading="lazy"><b>${p.name}</b></a>`).join("");
  $$(".ocard", box).forEach((a) => {
    a.addEventListener("pointerenter", () => themeTransition(+a.dataset.j));
    a.addEventListener("pointerleave", () => themeTransition(store.active));
  });
}

function curtainSwap(midway) {
  return new Promise((resolve) => {
    if (reduced) { gsap.timeline({ onComplete: resolve }).to("main, #foot", { opacity: 0, duration: .2 }).add(midway).to("main, #foot", { opacity: 1, duration: .3 }); return; }
    gsap.timeline({ onComplete: resolve })
      .set(curtain, { transformOrigin: "50% 100%" })
      .to(curtain, { scaleY: 1, duration: .55, ease: "power3.inOut" })
      .add(midway)
      .set(curtain, { transformOrigin: "50% 0%" })
      .to(curtain, { scaleY: 0, duration: .6, ease: "power3.inOut" }, "+=.05");
  });
}

async function openProduct(i) {
  if (transitioning) return;
  const same = store.view === "product";
  if (same && i === store.active) return;
  transitioning = true;
  closeOrder(true); if (menuOpen) toggleMenu(false);
  if (same) {
    // Boshqa iforga: joriy chiqadi, yangisi kiradi, mavzu bir vaqtda
    scrollTo(0);
    killProductST();
    setActive(i);
    gsap.to(S, { ...kf("phero"), duration: .9, ease: "power3.inOut", overwrite: "auto" });
    titleIn();
    renderOthers();
    setTimeout(() => { buildProductST(); transitioning = false; }, 950);
    return;
  }
  store.view = "product";
  if (masterST) masterST.disable(false);
  sectionSTs.forEach((s) => s.disable(false));
  bnav.classList.remove("is-on");
  setActive(i);
  // 3D uchish: qatordagi joyidan hero joyiga — parda ostida emas, ustida
  gsap.to(S, { ...kf("phero"), duration: .9, ease: "power3.inOut", overwrite: "auto" });
  await curtainSwap(() => {
    homeEl.hidden = true; productEl.hidden = false;
    lenis && lenis.resize();
    backLink.hidden = false; soundBtn.hidden = true;
    renderOthers();
    scrollTo(0, true); window.scrollTo(0, 0);
    ScrollTrigger.refresh();
    titleIn();
  });
  buildProductST();
  transitioning = false;
}
function titleIn() {
  gsap.fromTo(".pt-line > span", { yPercent: 105 }, { yPercent: 0, duration: .9, ease: EASE_IN, stagger: .08 });
  gsap.fromTo(".p-chips, .p-scent", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .6, ease: EASE_IN, delay: .3 });
}

async function goHome(target) {
  if (transitioning) return;
  if (store.view === "home") { if (target) scrollTo(target); return; }
  transitioning = true;
  killProductST();
  await curtainSwap(() => {
    store.view = "home";
    productEl.hidden = true; homeEl.hidden = false;
    lenis && lenis.resize();
    backLink.hidden = true; soundBtn.hidden = false;
    buildMaster();
    ScrollTrigger.refresh();
    const y = target ? topOf(typeof target === "string" ? $(target) : target) : topOf($("#s-range")) + innerHeight * .4;
    scrollTo(y, true); window.scrollTo(0, y);
    ScrollTrigger.update(); snap(master, masterST);
  });
  transitioning = false;
}

function route() {
  const m = location.hash.match(/^#\/([a-z]+)/);
  const i = m ? PRODUCTS.findIndex((p) => p.id === m[1]) : -1;
  if (i >= 0) openProduct(i); else if (store.view === "product") goHome();
}
addEventListener("hashchange", route);

/* ---------------- Menyu ---------------- */
const menu = $("#menu"), menuBtn = $("#menu-btn");
let menuOpen = false;
(() => { // telefonda tillar menyu ichida
  const box = document.createElement("div"); box.className = "m-langs langs";
  box.innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}">${l.toUpperCase()}</button>`).join("");
  menu.appendChild(box);
})();
function toggleMenu(open = !menuOpen) {
  menuOpen = open;
  document.body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  $(".mono", menuBtn).textContent = open ? t("nav.close") : t("nav.menu");
  if (open) {
    menu.hidden = false; lenis && lenis.stop();
    gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: .7, ease: "power3.inOut" });
    gsap.fromTo("#menu a span", { yPercent: 110 }, { yPercent: 0, duration: .7, ease: EASE_IN, stagger: .06, delay: .25 });
  } else {
    lenis && lenis.start();
    gsap.to(menu, { clipPath: "inset(0 0 100% 0)", duration: .6, ease: "power3.inOut", onComplete: () => { if (!menuOpen) menu.hidden = true; } });
  }
  tick();
}
menuBtn.addEventListener("click", () => toggleMenu());
$$("#menu a").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  if (a.hasAttribute("data-order")) return;
  const target = a.getAttribute("href");
  toggleMenu(false);
  if (store.view === "product") { history.pushState(null, "", "#/"); goHome(target); }
  else scrollTo(topOf($(target)));
}));
$(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  if (store.view === "product") { history.pushState(null, "", "#/"); goHome("#s-hero"); } else scrollTo(0);
});
backLink.addEventListener("click", (e) => { e.preventDefault(); history.pushState(null, "", "#/"); goHome(); });

/* ---------------- Til tugmalari ---------------- */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-lang]"); if (!b) return;
  applyLang(b.dataset.lang);
  rebuild();
  tick();
});

/* ---------------- Buyurtma ---------------- */
const orderEl = $("#order"), scrim = $("#order-scrim"), form = $("#order-form");
const qty = PRODUCTS.map(() => 0);
let orderSource = "home", lastFocus = null;

function renderOrderItems() {
  const box = $("#o-items"); if (!box) return;
  box.innerHTML = PRODUCTS.map((p, j) => `
    <div class="o-item ${qty[j] ? "is-on" : ""}" style="--c:${p.theme.accent}" data-j="${j}">
      <img src="${p.img}" alt="">
      <div><b>${p.name}</b><small><span class="sw"></span>${esc(t(`prod.${p.id}.scent`))} · ${esc(t("p.packV"))}</small></div>
      <div class="qty">
        <button type="button" data-q="-1" aria-label="−">−</button>
        <output aria-live="polite">${qty[j]}</output>
        <button type="button" data-q="1" aria-label="+">+</button>
      </div>
    </div>`).join("");
  const total = qty.reduce((a, b) => a + b, 0);
  $("#o-total").textContent = `${total} ${t("o.packs")}`;
}
$("#o-items").addEventListener("click", (e) => {
  const item = e.target.closest(".o-item"); if (!item) return;
  const j = +item.dataset.j, q = e.target.closest("[data-q]");
  qty[j] = clamp(q ? qty[j] + +q.dataset.q : (qty[j] ? 0 : 1), 0, 99);
  $("#err-items").textContent = "";
  renderOrderItems(); tick();
});
function showStep(n) {
  $$(".o-step", orderEl).forEach((s) => (s.hidden = +s.dataset.step !== n));
  $$("[data-step-dot]", orderEl).forEach((s) => s.classList.toggle("is-on", +s.dataset.stepDot === n));
  if (n === 2) setTimeout(() => $("#o-phone").focus(), 50);
}
$("#o-next").addEventListener("click", () => {
  if (!qty.some(Boolean)) { $("#err-items").textContent = t("o.errItems"); return; }
  showStep(2);
});
$("#o-back").addEventListener("click", () => showStep(1));

function openOrder(source) {
  orderSource = source || (store.view === "product" ? "product" : store.section === "range" ? "range" : "home");
  if (!qty.some(Boolean)) qty[store.active] = 1;
  renderOrderItems(); showStep(1);
  form.hidden = false; $(".o-steps").hidden = false; $(".o-ok").hidden = true;
  lastFocus = document.activeElement;
  orderEl.hidden = false; scrim.hidden = false;
  if (menuOpen) toggleMenu(false);
  lenis && lenis.stop();
  const fromX = isMobile ? 0 : (dirSign() === 1 ? 110 : -110);
  gsap.fromTo(orderEl, { xPercent: fromX, yPercent: isMobile ? 100 : 0 }, { xPercent: 0, yPercent: 0, duration: .6, ease: EASE_IN });
  gsap.to(scrim, { opacity: 1, duration: .4 });
  gsap.to(stageEl, { opacity: .4, duration: THEME_DUR, ease: EASE_IO });
  setTimeout(() => $("#order-close").focus(), 60);
  tick();
}
function closeOrder(instant) {
  if (orderEl.hidden) return;
  const toX = isMobile ? 0 : (dirSign() === 1 ? 110 : -110);
  const done = () => { orderEl.hidden = true; scrim.hidden = true; };
  gsap.to(stageEl, { opacity: 1, duration: instant ? 0 : THEME_DUR, ease: EASE_IO });
  lenis && !menuOpen && lenis.start();
  if (instant) return done();
  gsap.to(orderEl, { xPercent: toX, yPercent: isMobile ? 100 : 0, duration: .45, ease: "power2.in", onComplete: done });
  gsap.to(scrim, { opacity: 0, duration: .4 });
  lastFocus && lastFocus.focus && lastFocus.focus();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-order]"); if (!b) return;
  e.preventDefault(); openOrder(b.dataset.order || null);
});
$("#order-close").addEventListener("click", () => closeOrder());
scrim.addEventListener("click", () => closeOrder());
$("#o-done").addEventListener("click", () => closeOrder());
orderEl.addEventListener("keydown", (e) => { // fokus oyna ichida qoladi
  if (e.key !== "Tab") return;
  const f = $$("button, input, textarea, a[href]", orderEl).filter((x) => !x.closest("[hidden]") && x.offsetParent !== null);
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
});

// Telefon: +998 qat'iy, maska "90 123 45 67"
const phone = $("#o-phone");
const digitsOf = (v) => {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("998") && d.length > 9) d = d.slice(3);
  if (d.startsWith("8") && d.length === 10) d = d.slice(1);
  return d.slice(0, 9);
};
const fmtPhone = (d) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
phone.addEventListener("input", () => {
  phone.value = fmtPhone(digitsOf(phone.value));
  phone.closest(".field").classList.remove("has-err"); $("#err-phone").textContent = "";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = digitsOf(phone.value);
  if (d.length !== 9) {
    phone.closest(".field").classList.add("has-err"); $("#err-phone").textContent = t("o.errPhone"); phone.focus(); return;
  }
  const fd = new FormData(form);
  const payload = {
    items: PRODUCTS.map((p, j) => ({ productSlug: p.id, variant: "60", quantity: qty[j] })).filter((x) => x.quantity > 0),
    phone: "+998" + d, name: (fd.get("name") || "").trim() || undefined, comment: (fd.get("comment") || "").trim() || undefined,
    locale: store.lang, sourcePage: orderSource,
  };
  const btn = $('button[type="submit"]', form); btn.disabled = true; $("#err-send").textContent = "";
  let orderNo = null, demo = false;
  try {
    const url = (window.BARC_CONFIG || {}).orderEndpoint || (location.hostname.endsWith("github.io") ? "" : "/api/orders");
    if (url) {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(String(res.status));
      orderNo = (await res.json()).orderNo;
    } else {
      demo = true;
      orderNo = "BARC-" + String(Math.floor(Math.random() * 1e6)).padStart(6, "0");
      console.info("[BÄRC] demo buyurtma (yuborilmadi):", payload);
    }
  } catch (err) {
    $("#err-send").textContent = t("o.errSend"); btn.disabled = false; return;
  }
  btn.disabled = false;
  form.hidden = true; $(".o-steps").hidden = true; $(".o-ok").hidden = false;
  $("#o-ok-p").textContent = t("o.okP").replace("{n}", orderNo);
  $("#o-demo").hidden = !demo;
  qty.fill(0); form.reset();
  // Muvaffaqiyat: mahsulot bir marta aylanadi
  gsap.to(S, { ry: S.ry + 360 * dirSign(), duration: 1.4, ease: "power3.inOut", onComplete: () => { S.ry -= 360 * dirSign(); R.ry -= 360 * dirSign(); } });
  tick();
});

/* ---------------- Galereya (har iforning o'z kayfiyat rasmlari) ---------------- */
const gal = { i: 0 };
const galTrack = $("#gal-track");
function galFigs() { return $$("figure", galTrack); }
function galGo(n, instant) {
  const figs = galFigs(); if (!figs.length) return;
  gal.i = clamp(n, 0, figs.length - 1);
  const f = figs[gal.i], d = dirSign();
  const x = d === 1 ? -f.offsetLeft : (galTrack.clientWidth - f.offsetLeft - f.offsetWidth);
  gsap.to(figs, { x, duration: instant ? 0 : .8, ease: EASE_IN, overwrite: true });
  $("#gal-count").textContent = `0${gal.i + 1} / 0${figs.length}`;
}
function renderGallery() {
  if (!galTrack) return;
  const p = PRODUCTS[store.active];
  const shots = (p.gallery || []).map((g) => ({ src: g.src, cap: (g.cap || {})[store.lang] || (g.cap || {}).uz || "" }));
  galTrack.innerHTML = shots.map((s, k) =>
    `<figure class="${s.wide ? "wide" : ""}"><img src="${s.src}" alt="${esc(s.cap)}" loading="lazy" draggable="false">
       <figcaption><span class="mono">0${k + 1} · ${esc(p.name)}</span>${esc(s.cap)}</figcaption></figure>`).join("");
  galGo(0, true);
}
(() => {
  let drag = null;
  $$("[data-gal]").forEach((b) => b.addEventListener("click", () => { galGo(gal.i + +b.dataset.gal); tick(); }));
  galTrack.addEventListener("keydown", (e) => {
    const d = dirSign();
    if (e.key === "ArrowRight") { e.preventDefault(); galGo(gal.i + d); }
    if (e.key === "ArrowLeft") { e.preventDefault(); galGo(gal.i - d); }
  });
  galTrack.addEventListener("pointerdown", (e) => { drag = e.clientX; galTrack.setPointerCapture(e.pointerId); });
  galTrack.addEventListener("pointerup", (e) => {
    if (drag === null) return; const dx = (e.clientX - drag) * dirSign(); drag = null;
    if (Math.abs(dx) > 40) galGo(gal.i + (dx < 0 ? 1 : -1));
  });
  addEventListener("resize", () => galGo(gal.i, true));
})();

/* ---------------- Ovoz: har iforning o'z sokin manzarasi (Web Audio, standart o'chiq) ----------------
   Fayl yo'q — hammasi brauzerda sintez qilinadi. Har ifor = akkordlar + arpedjio + tabiat ovozi:
   Amethyst — kechki lavanda dalasi (shamol, chigirtkalar), Crystal Bloom — tonggi gulzor (jilg'a, qushlar),
   Original — yomg'irdan keyingi bog' (mayin yomg'ir, tomchilar, uzoqdagi qush). Ifor almashsa — 2.5s crossfade. */
const SCENES = [
  { chords: [[146.83, 220, 277.18, 329.63], [123.47, 185, 220, 293.66]], scale: [293.66, 329.63, 369.99, 440, 493.88, 587.33], nature: "dusk" },
  { chords: [[220, 277.18, 329.63, 415.3], [185, 220, 277.18, 415.3]],   scale: [440, 493.88, 554.37, 659.25, 739.99, 880],   nature: "brook" },
  { chords: [[196, 246.94, 293.66, 440], [164.81, 246.94, 293.66, 392]], scale: [392, 440, 493.88, 587.33, 659.25, 783.99], nature: "rain" },
];
let A = null;
function initAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  // Reverb: generatsiya qilingan 3.5s impuls
  const verb = ctx.createConvolver(), irLen = ctx.sampleRate * 3.5, ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3); }
  verb.buffer = ir; const verbOut = ctx.createGain(); verbOut.gain.value = .55; verb.connect(verbOut).connect(master);
  const mk = (len, brown) => {
    const b = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  };
  const white = mk(4, false), brown = mk(6, true);
  const loop = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * buf.duration); return s; };
  const filt = (type, f, q = .7) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const gainN = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const lfo = (rate, depth, param) => { const o = ctx.createOscillator(), g = gainN(depth); o.frequency.value = rate; o.connect(g).connect(param); o.start(); return o; };

  const scenes = SCENES.map((sc, si) => {
    const out = gainN(0); out.connect(master);
    const send = gainN(.5); out.connect(send).connect(verb);
    // Pad: har nota ikki biroz farq qiluvchi osilator, yumshoq lowpass, sekin "nafas"
    const padF = filt("lowpass", 900), padG = gainN(.032); padF.connect(padG).connect(out);
    lfo(.05 + si * .01, .012, padG.gain);
    const oscs = sc.chords[0].map((f) => [-4, 4].map((det) => {
      const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f; o.detune.value = det; o.connect(padF); o.start(); return o;
    }));
    // Tabiat qatlami
    if (sc.nature === "dusk") {           // kechki shamol
      const n = loop(brown), lp = filt("lowpass", 420), g = gainN(.16); n.connect(lp).connect(g).connect(out); lfo(.07, 260, lp.frequency); lfo(.11, .07, g.gain);
    } else if (sc.nature === "brook") {   // jilg'a
      const n = loop(white), bp = filt("bandpass", 1100, .9), g = gainN(.05); n.connect(bp).connect(g).connect(out);
      const n2 = loop(brown), bp2 = filt("bandpass", 450, 1.2), g2 = gainN(.18); n2.connect(bp2).connect(g2).connect(out);
      scenes_brook.push(bp);
    } else {                              // mayin yomg'ir
      const n = loop(white), hp = filt("highpass", 1800), lp = filt("lowpass", 6500), g = gainN(.035); n.connect(hp).connect(lp).connect(g).connect(out);
      const n2 = loop(brown), lp2 = filt("lowpass", 300), g2 = gainN(.08); n2.connect(lp2).connect(g2).connect(out);
    }
    return { out, oscs, chord: 0, sc };
  });
  A = { ctx, master, verb, scenes, active: -1, white };
}
const scenes_brook = [];
const rnd = (a, b) => a + Math.random() * (b - a);
function pan(node) { if (!A.ctx.createStereoPanner) return node; const p = A.ctx.createStereoPanner(); p.pan.value = rnd(-.8, .8); node.connect(p); return p; }
function pluck(freq, dest, vol = .05, dur = 2.8) {
  const { ctx } = A, t = ctx.currentTime;
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.value = freq; o2.type = "triangle"; o2.frequency.value = freq * 2;
  const g2 = ctx.createGain(); g2.gain.value = .25; o2.connect(g2).connect(g); o.connect(g);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  pan(g).connect(dest); o.start(t); o2.start(t); o.stop(t + dur + .1); o2.stop(t + dur + .1);
}
function bird(dest, base) {               // 2–5 qisqa sirpanuvchi "chiv"
  const { ctx } = A; let t = ctx.currentTime + .05; const n = 2 + (Math.random() * 4 | 0), f0 = base * rnd(.9, 1.15);
  const g = ctx.createGain(); g.gain.value = 0; pan(g).connect(dest);
  const o = ctx.createOscillator(); o.type = "sine"; o.connect(g); o.start(t);
  for (let k = 0; k < n; k++) {
    const len = rnd(.05, .11), f = f0 * rnd(.92, 1.12);
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * rnd(1.15, 1.45), t + len);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.018, t + .01); g.gain.linearRampToValueAtTime(0, t + len);
    t += len + rnd(.04, .12);
  }
  o.stop(t + .1);
}
function cricket(dest) {                  // 3 ta tez pulsli chirillash
  const { ctx } = A; let t = ctx.currentTime + .02;
  const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = "square"; o.frequency.value = rnd(4200, 4700); bp.type = "bandpass"; bp.frequency.value = o.frequency.value; bp.Q.value = 8;
  g.gain.value = 0; o.connect(bp).connect(g); pan(g).connect(dest); o.start(t);
  for (let k = 0; k < 3; k++) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.012, t + .008); g.gain.linearRampToValueAtTime(0, t + .03); t += .05; }
  o.stop(t + .05);
}
function drip(dest) {                     // barg/tomchi: pastga sirpanuvchi qisqa ton
  const { ctx } = A, t = ctx.currentTime, f = rnd(1300, 2300);
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine";
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .45, t + .12);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.03, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + .18);
  o.connect(g); pan(g).connect(dest); o.start(t); o.stop(t + .2);
}
function audioScene(i) {
  if (!A || A.active === i) return;
  A.active = i; const t = A.ctx.currentTime;
  A.scenes.forEach((s, j) => s.out.gain.setTargetAtTime(j === i ? 1 : 0, t, .9));
}
let audioTimer = null;
function audioLoop() {                    // har 200ms: hodisalar ehtimollik bilan
  if (!A || !store.soundOn) return;
  const s = A.scenes[A.active]; if (!s) return;
  const { ctx } = A, t = ctx.currentTime;
  if (Math.random() < .09) pluck(s.sc.scale[Math.random() * s.sc.scale.length | 0], s.out, .045);
  if (Math.random() < .004) {             // ~har 50s akkord almashadi
    s.chord = 1 - s.chord;
    s.sc.chords[s.chord].forEach((f, k) => s.oscs[k].forEach((o) => o.frequency.setTargetAtTime(f, t, 2.5)));
  }
  if (s.sc.nature === "dusk" && Math.random() < .12) cricket(s.out);
  if (s.sc.nature === "brook") {
    scenes_brook.forEach((bp) => bp.frequency.setTargetAtTime(rnd(800, 1700), t, .08));
    if (Math.random() < .035) bird(s.out, rnd(2600, 3600));
  }
  if (s.sc.nature === "rain") {
    if (Math.random() < .22) drip(s.out);
    if (Math.random() < .012) bird(s.out, rnd(2000, 2600));
  }
}
function tick() {
  if (!store.soundOn || !A) return;
  pluck(A.scenes[A.active]?.sc.scale[5] || 880, A.master, .02, .5);
}
soundBtn.addEventListener("click", () => {
  if (!A) initAudio();
  store.soundOn = !store.soundOn;
  const t = A.ctx.currentTime;
  if (store.soundOn) {
    A.ctx.resume(); audioScene(store.theme);
    A.master.gain.cancelScheduledValues(t); A.master.gain.setTargetAtTime(.7, t, .8);
    clearInterval(audioTimer); audioTimer = setInterval(audioLoop, 200);
  } else {
    A.master.gain.cancelScheduledValues(t); A.master.gain.setTargetAtTime(0, t, .4);
    clearInterval(audioTimer); setTimeout(() => { if (!store.soundOn) A.ctx.suspend(); }, 1500);
  }
  soundBtn.setAttribute("aria-pressed", String(store.soundOn));
  soundBtn.classList.toggle("sound-on", store.soundOn);
  $("#sound-state").textContent = store.soundOn ? "ON" : "OFF";
});
document.addEventListener("visibilitychange", () => {
  if (!A || !store.soundOn) return;
  document.hidden ? A.ctx.suspend() : A.ctx.resume();
});

/* ---------------- Kursor ---------------- */
(() => {
  if (matchMedia("(hover: none)").matches) return;
  const c = $("#cursor");
  const qx = gsap.quickTo(c, "x", { duration: .35, ease: "power3" }), qy = gsap.quickTo(c, "y", { duration: .35, ease: "power3" });
  addEventListener("pointermove", (e) => { c.style.opacity = 1; qx(e.clientX); qy(e.clientY); }, { passive: true });
  document.addEventListener("pointerover", (e) => c.classList.toggle("is-big", !!e.target.closest("[data-cursor], a, button, summary")));
  document.addEventListener("pointerleave", () => (c.style.opacity = 0));
})();

/* ---------------- Qayta qurish (o'lcham, til) ---------------- */
function rebuild() {
  isMobile = mq.matches;
  sizeCanvas();
  renderRange();
  if (store.view === "home") buildMaster(); else buildProductST();
  ScrollTrigger.refresh();
}
let rw = innerWidth, rTimer;
addEventListener("resize", () => {
  sizeCanvas();
  if (Math.abs(innerWidth - rw) < 2 && !mq.matches === !isMobile) return; // telefon manzil satri
  rw = innerWidth; clearTimeout(rTimer); rTimer = setTimeout(rebuild, 200);
});

/* ---------------- Loader → hero ---------------- */
async function boot() {
  let saved = null; try { saved = localStorage.getItem("barc-lang"); } catch (e) {}
  const nav = (navigator.language || "uz").slice(0, 2);
  applyLang(saved || (LANGS.includes(nav) ? nav : "uz"));
  sizeCanvas();
  setActive(0, { instant: true, force: true });

  const pctEl = $("#loader-pct"), shown = { v: 0 };
  const assets = [...PRODUCTS.map((p) => p.img)];
  let done = 0; const total = assets.length + 1;
  const bump = () => { done++; gsap.to(shown, { v: done / total * 100, duration: .6, ease: "power2.out", overwrite: true }); };
  const strokeTo = gsap.quickTo(".ll-stroke", "strokeDashoffset", { duration: .6, ease: "power2.out" });
  gsap.ticker.add(function loaderTick() {
    pctEl.textContent = String(Math.round(shown.v)).padStart(3, "0");
    strokeTo(900 - shown.v * 9);
    if (store.loaded) gsap.ticker.remove(loaderTick);
  });
  await Promise.all([
    ...assets.map((src) => new Promise((r) => { const im = new Image(); im.onload = im.onerror = () => { bump(); r(); }; im.src = src; })),
    (document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve()).then(bump),
  ]);
  await new Promise((r) => gsap.to(shown, { v: 100, duration: .4, onComplete: r }));
  store.loaded = true;
  pctEl.textContent = "100";

  // 'loader' → 'hero' segmenti
  const tl = gsap.timeline();
  tl.to(".ll-stroke", { strokeDashoffset: 0, duration: .3 })
    .to(".ll-fill", { clipPath: "inset(0% 0 0 0)", duration: .6, ease: "power3.inOut" })
    .to("#loader", { yPercent: -100, duration: .9, ease: "power3.inOut" }, "+=.15")
    .add(() => {
      document.body.classList.remove("is-loading");
      $("#loader").remove();
      R.op = 0; R.scale = .6; R.y = 20; // sahna pastdan ko'tariladi (S hero holatida)
    }, "-=.45")
    .fromTo("#hero-name", { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: EASE_IN }, "-=.5")
    .fromTo(".hero-meta, .hero-bar, .peek, #chrome", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: EASE_IN, stagger: .06 }, "-=.7")
    .add(() => {
      buildMaster();
      if (location.hash.startsWith("#/") && location.hash.length > 2) route();
      lenis && lenis.start();
    });
}
// Sahna loader paytida ko'rinmaydi
S.op = 1; R.op = 0;
boot();
})();
