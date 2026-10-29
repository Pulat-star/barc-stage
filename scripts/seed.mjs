// Boshlang'ich ma'lumot → seed.sql (toza baza uchun) va seed-family.sql (mavjud bazaga yangi turkumlarni qo'shish)
import fs from "node:fs"; import vm from "node:vm";
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync("public/assets/i18n.js", "utf8"), ctx);
const I = ctx.window.I18N, L = ["uz", "ru", "en", "ar"];
const cap = (key) => Object.fromEntries(L.map((l) => [l, I[l][key] || ""]));
const TH = {
  amethyst: ["#7A2DB8", { bg: "#1E0A2E", bg2: "#0B0414", surface: "#6A1FA8", accent: "#C58BFF", glow: "#9B3DEB" }],
  crystal: ["#1F5FD9", { bg: "#071A45", bg2: "#030A1E", surface: "#1C55D6", accent: "#7DC2FF", glow: "#2F7BFF" }],
  original: ["#23963F", { bg: "#062A1A", bg2: "#02130B", surface: "#1E8A3E", accent: "#8EE58A", glow: "#2FBF55" }],
  "gel-amethyst": ["#6B2FC0", { bg: "#1B0B30", bg2: "#090312", surface: "#5B21A8", accent: "#B98CFF", glow: "#8A3FF0" }],
  "gel-crystal": ["#1F55D0", { bg: "#06173F", bg2: "#020818", surface: "#1846C0", accent: "#79B8FF", glow: "#2A6CF0" }],
  "gel-original": ["#1F8040", { bg: "#05261A", bg2: "#01110A", surface: "#18733A", accent: "#9BE58A", glow: "#2DB352" }],
  "powder-ocean": ["#0E6FD0", { bg: "#04234A", bg2: "#010D1E", surface: "#0E66C2", accent: "#6FD6FF", glow: "#1C9BF0" }],
  "powder-purple": ["#9A2FC8", { bg: "#2A0A3D", bg2: "#110318", surface: "#8E2DBF", accent: "#E79BFF", glow: "#B847E8" }],
  oxi: ["#E9D8B4", { bg: "#0D1B33", bg2: "#050B16", surface: "#1E3A66", accent: "#E9C98E", glow: "#3F6FB0" }],
  booster: ["#9B4FB5", { bg: "#2B0F33", bg2: "#120515", surface: "#8A3E9E", accent: "#F0B6F0", glow: "#C764D8" }],
};
const POD = (id, photos) => [...photos, [`${id}-studio.webp`, "cap.podStudio"], [`${id}-room.webp`, "cap.podRoom"], [`${id}-scent.webp`, `prod.${id}.g1`]];
const GEL = (id) => [[`${id}-studio.webp`, "cap.gelStudio"], ["gel-room.webp", "cap.gelRoom"], ["gel-photo.jpg", "cap.gelPhoto"]];
const POW = (id) => [[`${id}-studio.webp`, "cap.powderStudio"], ["powder-room.webp", "cap.powderRoom"], ["powder-photo.jpg", "cap.powderPhoto"]];
const P = [
  ["amethyst", "Amethyst", "pods", POD("amethyst", [["amethyst-photos-2.webp", "cap.photosBig"], ["amethyst-photos-1.webp", "cap.photos"]])],
  ["crystal", "Crystal Bloom", "pods", POD("crystal", [["crystal-photos.webp", "cap.photos"]])],
  ["original", "Original", "pods", POD("original", [["original-photos.webp", "cap.photos"]])],
  ["gel-amethyst", "Amethyst", "gel", GEL("gel-amethyst")],
  ["gel-crystal", "Crystal Bloom", "gel", GEL("gel-crystal")],
  ["gel-original", "Original", "gel", GEL("gel-original")],
  ["powder-ocean", "Ocean Fresh", "powder", POW("powder-ocean")],
  ["powder-purple", "Purple Splash", "powder", POW("powder-purple")],
  ["oxi", "OXI Power", "oxi", [["oxi-photo-front.webp", "cap.oxiFront"], ["oxi-photo-back-1.webp", "cap.oxiBack"], ["oxi-photo-back-2.webp", "cap.oxiBack"],
    ["oxi-photo-back-3.webp", "cap.oxiBack30"], ["oxi-studio.webp", "cap.oxiStudio"], ["oxi-room.webp", "cap.oxiRoom"]]],
  ["booster", "Endless Scent", "booster", [["booster-studio.webp", "cap.boosterStudio"], ["booster-room.webp", "cap.boosterRoom"], ["booster-photo.jpg", "cap.boosterPhoto"]]],
];
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const t = Date.now();
const row = ([id, name, line, gal], k, verb) => {
  const gallery = gal.map(([f, key]) => ({ src: `assets/img/${f}`, cap: cap(key) }));
  const i18n = Object.fromEntries(L.map((l) => [l, Object.fromEntries(["scent", "line", "hook", "desc", "for"].map((f) => [f, I[l][`prod.${id}.${f}`] || ""]))]));
  return `${verb} INTO products (id, sort, status, line, name, color, theme, pack, atmo, gallery, i18n, created_at, updated_at) VALUES (${[
    q(id), k + 1, q("published"), q(line), q(name), q(TH[id][0]), q(JSON.stringify(TH[id][1])), q(`assets/img/${id}.webp?v=2`),
    q(`assets/img/${id}-atmo.webp`), q(JSON.stringify(gallery)), q(JSON.stringify(i18n)), t, t].join(", ")});\n`;
};
fs.writeFileSync("seed.sql", "DELETE FROM products;\n" + P.map((p, k) => row(p, k, "INSERT")).join(""));
// Mavjud bazada: kapsulalarga tegilmaydi (admin o'zgartirgan bo'lishi mumkin), yangilari qo'shiladi va tartib beriladi
fs.writeFileSync("seed-family.sql", P.filter((p) => p[2] !== "pods").map((p) => row(p, P.indexOf(p), "INSERT OR IGNORE")).join("")
  + P.map((p, k) => `UPDATE products SET sort = ${k + 1} WHERE id = ${q(p[0])};\n`).join(""));
console.log("seed.sql + seed-family.sql", P.length, "mahsulot");
