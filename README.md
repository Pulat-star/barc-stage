# BÄRC — 3in1 PODS sayti

Statik sayt (HTML + GSAP + Lenis). Build kerak emas.

    python3 -m http.server 4321   # → http://localhost:4321

- `assets/app.js` — bitta sahna, bitta master timeline, mavzu o'tishi, buyurtma
- `assets/i18n.js` — uz / ru / en / ar (arabchada sahifa RTL)
- `assets/style.css` — tokenlar, 8pt to'r
- Mahsulot sahifasi: `#/amethyst`, `#/crystal`, `#/original`

Buyurtma: `index.html` dagi `BARC_CONFIG.orderEndpoint` bo'sh bo'lsa demo rejim
(hech qayerga yuborilmaydi). Backend `POST {items, phone, name, comment, locale, sourcePage}`
qabul qilib `{orderNo}` qaytarishi kerak.
