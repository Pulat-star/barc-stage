// Boshlang'ich ma'lumot: hozirgi 3 mahsulot → seed.sql
import fs from "node:fs"; import vm from "node:vm";
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync("public/assets/i18n.js", "utf8"), ctx);
const I = ctx.window.I18N, L = ["uz", "ru", "en", "ar"];
const P = [
  { id: "amethyst", name: "Amethyst", color: "#7A2DB8", theme: { bg: "#1E0A2E", bg2: "#0B0414", surface: "#6A1FA8", accent: "#C58BFF", glow: "#9B3DEB" } },
  { id: "crystal", name: "Crystal Bloom", color: "#1F5FD9", theme: { bg: "#071A45", bg2: "#030A1E", surface: "#1C55D6", accent: "#7DC2FF", glow: "#2F7BFF" } },
  { id: "original", name: "Original", color: "#23963F", theme: { bg: "#062A1A", bg2: "#02130B", surface: "#1E8A3E", accent: "#8EE58A", glow: "#2FBF55" } },
];
const CAP = {
  studio: { uz: "Asl qadoq — 60 ta kapsula", ru: "Оригинальная упаковка — 60 капсул", en: "The real pack — 60 pods", ar: "العبوة الأصلية — 60 كبسولة" },
  room: { uz: "Kir yuvish xonangizda doim qo‘l ostida", ru: "Всегда под рукой в вашей прачечной", en: "Always at hand in your laundry room", ar: "دائمًا في متناول يدك في غرفة الغسيل" },
};
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const t = Date.now(); let sql = "DELETE FROM products;\n";
P.forEach((p, k) => {
  const cap = (key) => Object.fromEntries(L.map((l) => [l, I[l][key] || ""]));
  const gallery = [
    { src: `assets/img/${p.id}-studio.webp`, cap: CAP.studio },
    { src: `assets/img/${p.id}-scent.webp`, cap: cap(`prod.${p.id}.g1`) },
    { src: `assets/img/${p.id}-room.webp`, cap: CAP.room },
    { src: `assets/img/${p.id}-result.webp`, cap: cap(`prod.${p.id}.g2`) },
    { src: `assets/img/${p.id}-cold.webp`, cap: cap(`prod.${p.id}.g3`) },
  ];
  const i18n = Object.fromEntries(L.map((l) => [l, Object.fromEntries(["scent", "line", "hook", "desc", "for"].map((f) => [f, I[l][`prod.${p.id}.${f}`] || ""]))]));
  sql += `INSERT INTO products (id, sort, status, name, color, theme, pack, atmo, gallery, i18n, created_at, updated_at) VALUES (${[
    q(p.id), k + 1, q("published"), q(p.name), q(p.color), q(JSON.stringify(p.theme)), q(`assets/img/${p.id}.webp`),
    q(`assets/img/${p.id}-atmo.webp`), q(JSON.stringify(gallery)), q(JSON.stringify(i18n)), t, t].join(", ")});\n`;
});
fs.writeFileSync("seed.sql", sql); console.log("seed.sql", sql.length, "bytes");
