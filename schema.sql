-- BÄRC — D1 sxemasi
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,              -- URL slug: amethyst
  sort        INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'published', -- published | draft
  name        TEXT NOT NULL,                 -- "Crystal Bloom"
  color       TEXT NOT NULL,                 -- asosiy rang, #RRGGBB
  theme       TEXT NOT NULL,                 -- JSON {bg,bg2,surface,accent,glow}
  pack        TEXT NOT NULL,                 -- qadoq rasmi URL (shaffof fon)
  atmo        TEXT NOT NULL DEFAULT '',      -- fon uchun kichik xira rasm URL
  gallery     TEXT NOT NULL DEFAULT '[]',    -- JSON [{src, cap:{uz,ru,en,ar}}]
  i18n        TEXT NOT NULL DEFAULT '{}',    -- JSON {uz:{scent,line,hook,desc,for}, ...}
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Sayt matnlari: faqat o'zgartirilgan kalitlar saqlanadi (qolgani i18n.js dagi asl matn)
CREATE TABLE IF NOT EXISTS texts (
  lang        TEXT PRIMARY KEY,
  data        TEXT NOT NULL DEFAULT '{}',
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id          TEXT PRIMARY KEY,
  mime        TEXT NOT NULL,
  data        BLOB NOT NULL,
  size        INTEGER NOT NULL,
  w           INTEGER, h INTEGER,
  name        TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no    TEXT UNIQUE,
  items       TEXT NOT NULL,                 -- JSON [{id,name,qty}]
  qty_total   INTEGER NOT NULL,
  phone       TEXT NOT NULL,                 -- +998XXXXXXXXX
  name        TEXT, comment TEXT,
  locale      TEXT, source TEXT,
  status      TEXT NOT NULL DEFAULT 'new',   -- new | called | confirmed | delivered | cancelled
  note        TEXT NOT NULL DEFAULT '',
  ip          TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone   ON orders(phone);

CREATE TABLE IF NOT EXISTS order_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL,
  at          INTEGER NOT NULL,
  kind        TEXT NOT NULL,                 -- created | status | note
  text        TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id, at);

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL
);

-- Cheklovlar (buyurtma va login urinishlari)
CREATE TABLE IF NOT EXISTS hits (
  key         TEXT NOT NULL,
  at          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hits ON hits(key, at);
