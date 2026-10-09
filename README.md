# BÄRC — sayt, admin panel va CRM

**Sayt:** https://barc-stage.pages.dev · **Admin:** https://barc-stage.pages.dev/admin/

Cloudflare (bepul tarif): Pages (statik sayt) + Pages Functions (API) + D1 (ma'lumotlar bazasi).

```
public/            sayt (index.html, assets/) va admin panel (admin/)
functions/         API: /api/site, /api/orders, /api/admin/*, /media/:id
lib/server.js      server yordamchilari (sessiya, parol, Telegram, cheklovlar)
schema.sql         D1 jadvallari
seed.sql           boshlang'ich 3 mahsulot (scripts/seed.mjs yasaydi)
```

## Mahalliy ishga tushirish

```
# .dev.vars:  ADMIN_PASSWORD="..."  SESSION_SECRET="..."
npx wrangler d1 execute barc-stage-db --local --file=schema.sql
npx wrangler d1 execute barc-stage-db --local --file=seed.sql
npx wrangler pages dev --port 8799
```

## Joylash

```
npx wrangler pages deploy --project-name barc-stage --branch main
```

Maxfiy o'zgaruvchilar (Cloudflare → Pages → barc-stage → Settings):
`ADMIN_PASSWORD` (boshlang'ich parol; admin paneldan o'zgartirilsa bazadagisi ishlaydi),
`SESSION_SECRET`.

Rasmlar D1 ichida saqlanadi (R2 bank kartasini talab qiladi). Admin panel rasmni
yuklashdan oldin brauzerda tekshiradi va WebP'ga siqadi (har biri < 1.8 MB).
