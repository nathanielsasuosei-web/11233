/**
 * Zero-dependency persistence layer.
 *
 * Uses the SQLite engine built into Node.js (`node:sqlite`) so the project needs
 * no native compilation step. Swap this file for Prisma/Postgres later by keeping
 * the same exported helpers (`all`, `get`, `run`, `exec`).
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { writableDir } from '@/lib/env';

/**
 * The SQLite file lives in a writable directory: the project folder locally,
 * or the OS temp dir on serverless hosts (Vercel/Lambda) where the deployment
 * filesystem is read-only — writing to `process.cwd()` there crashes the
 * first request with `ENOENT: mkdir '/var/task/data'`. Set DATABASE_PATH to
 * override (it must point at a writable location). See src/lib/env.ts.
 */
const DB_PATH = process.env.DATABASE_PATH || writableDir('data', 'beatvault.db');

let _db: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA journal_mode = WAL;');
  _db.exec('PRAGMA foreign_keys = ON;');
  migrate(_db);
  try {
    seedIfEmpty(_db);
  } catch (err) {
    console.error('[db] seeding skipped:', err);
  }
  return _db;
}

function migrate(d: DatabaseSync) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'admin',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    artist_name  TEXT,
    email        TEXT NOT NULL UNIQUE,
    phone        TEXT,
    country      TEXT,
    password_hash TEXT NOT NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS beats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    genre       TEXT DEFAULT 'Afrobeats',
    mood        TEXT DEFAULT '',
    bpm         INTEGER DEFAULT 100,
    musical_key TEXT DEFAULT '',
    tags        TEXT DEFAULT '',
    cover_url   TEXT DEFAULT '',
    audio_url   TEXT DEFAULT '',
    preview_url TEXT DEFAULT '',
    video_url   TEXT DEFAULT '',
    price_basic     INTEGER NOT NULL DEFAULT 0,
    price_premium   INTEGER NOT NULL DEFAULT 0,
    price_exclusive INTEGER NOT NULL DEFAULT 0,
    price_buyout    INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'published',
    featured    INTEGER NOT NULL DEFAULT 0,
    plays       INTEGER NOT NULL DEFAULT 0,
    sales       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS videos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    description  TEXT DEFAULT '',
    source_type  TEXT NOT NULL DEFAULT 'youtube',
    video_url    TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    beat_id      INTEGER REFERENCES beats(id) ON DELETE SET NULL,
    published    INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    reference   TEXT NOT NULL UNIQUE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subtotal    INTEGER NOT NULL DEFAULT 0,
    total       INTEGER NOT NULL DEFAULT 0,
    currency    TEXT NOT NULL DEFAULT 'GHS',
    status      TEXT NOT NULL DEFAULT 'pending',
    method      TEXT DEFAULT '',
    channel     TEXT DEFAULT '',
    provider    TEXT NOT NULL DEFAULT 'paystack',
    provider_ref TEXT DEFAULT '',
    pay_email   TEXT DEFAULT '',
    pay_phone   TEXT DEFAULT '',
    paid_at     TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    beat_id      INTEGER NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
    beat_title   TEXT NOT NULL,
    license      TEXT NOT NULL,
    price        INTEGER NOT NULL,
    download_token TEXT NOT NULL,
    download_count INTEGER NOT NULL DEFAULT 0,
    download_limit INTEGER NOT NULL DEFAULT 5,
    emailed_at   TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL,
    body       TEXT NOT NULL,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status     TEXT NOT NULL DEFAULT 'unread',
    admin_reply TEXT DEFAULT '',
    replied_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email   TEXT NOT NULL,
    subject    TEXT NOT NULL,
    body       TEXT NOT NULL,
    kind       TEXT NOT NULL DEFAULT 'general',
    status     TEXT NOT NULL DEFAULT 'queued',
    error      TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_beats_status ON beats(status);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
  `);
}

/* ------------------------------------------------------------------ */
/* First-run seeding                                                   */
/* ------------------------------------------------------------------ */

const DEMO_BEATS = [
  { file: 'midnight-in-accra', title: 'Midnight In Accra', genre: 'Afrobeats', mood: 'Smooth', bpm: 112, key: 'F Minor', basic: 5000, premium: 12000, exclusive: 40000, buyout: 120000, tags: 'afrobeats,log drum,romantic,accra', featured: 1 },
  { file: 'concrete-roses', title: 'Concrete Roses', genre: 'Drill', mood: 'Dark', bpm: 142, key: 'A Minor', basic: 4500, premium: 11000, exclusive: 38000, buyout: 110000, tags: 'drill,uk,gritty,piano', featured: 1 },
  { file: 'sunlight-driver', title: 'Sunlight Driver', genre: 'Amapiano', mood: 'Warm', bpm: 113, key: 'Bb Major', basic: 6000, premium: 14000, exclusive: 45000, buyout: 135000, tags: 'amapiano,logdrum,south africa,summer', featured: 1 },
  { file: 'neon-testament', title: 'Neon Testament', genre: 'Trap', mood: 'Moody', bpm: 140, key: 'Eb Minor', basic: 4000, premium: 10000, exclusive: 35000, buyout: 100000, tags: 'trap,808,melodic,night', featured: 0 },
  { file: 'war-drum', title: 'War Drum', genre: 'Afro Drill', mood: 'Aggressive', bpm: 146, key: 'C Minor', basic: 5500, premium: 13000, exclusive: 42000, buyout: 125000, tags: 'afro drill,hard,energy,street', featured: 0 },
  { file: 'slow-burn', title: 'Slow Burn', genre: 'R&B', mood: 'Soulful', bpm: 92, key: 'G Minor', basic: 5000, premium: 12000, exclusive: 40000, buyout: 115000, tags: 'rnb,slow,soul,guitar', featured: 0 },
  { file: 'glass-highway', title: 'Glass Highway', genre: 'Highlife', mood: 'Bright', bpm: 118, key: 'C Major', basic: 4500, premium: 11000, exclusive: 36000, buyout: 105000, tags: 'highlife,ghana,guitar,dance', featured: 0 },
  { file: 'nocturne-77', title: 'Nocturne 77', genre: 'Amapiano', mood: 'Hypnotic', bpm: 112, key: 'D Minor', basic: 6500, premium: 15000, exclusive: 50000, buyout: 150000, tags: 'amapiano,deep,hypnotic,late night', featured: 0 },
];

const DEMO_VIDEOS = [
  { title: 'Studio Session — Log Drum Breakdown', description: 'Demo placeholder: replace this with your own studio video (YouTube link or uploaded file).', url: 'https://www.youtube.com/watch?v=YE7VzlLtp-4', beat: 'midnight-in-accra' },
  { title: 'Beat Break — "Concrete Roses" from scratch', description: 'Demo placeholder: replace this with your own studio video (YouTube link or uploaded file).', url: 'https://www.youtube.com/watch?v=eRsGyueVLvQ', beat: 'concrete-roses' },
  { title: 'Live at the Warehouse — Sunlight Driver', description: 'Demo placeholder: replace this with your own studio video (YouTube link or uploaded file).', url: 'https://www.youtube.com/watch?v=R6MlUcmOul8', beat: 'sunlight-driver' },
];

function seedIfEmpty(d: DatabaseSync) {
  const adminCount = d.prepare('SELECT COUNT(*) c FROM admins').get() as { c: number };
  if (Number(adminCount?.c || 0) === 0) {
    const email = (process.env.ADMIN_EMAIL || 'admin@beatvault.gh').toLowerCase();
    const pass = process.env.ADMIN_PASSWORD || 'admin123';
    d.prepare('INSERT INTO admins (email, name, password_hash) VALUES (?,?,?)').run(
      email,
      process.env.ADMIN_NAME || 'Studio Admin',
      bcrypt.hashSync(pass, 10),
    );
  }

  const userCount = d.prepare('SELECT COUNT(*) c FROM users').get() as { c: number };
  let demoUserId = 0;
  if (Number(userCount?.c || 0) === 0) {
    const res = d
      .prepare(
        'INSERT INTO users (name, artist_name, email, phone, country, password_hash) VALUES (?,?,?,?,?,?)',
      )
      .run('Ama Serwaa', 'Ama Serwaa', 'artist@example.com', '0551234567', 'Ghana', bcrypt.hashSync('artist123', 10));
    demoUserId = Number(res.lastInsertRowid);
  } else {
    const u = d.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get() as { id: number };
    demoUserId = Number(u?.id || 0);
  }

  const beatCount = d.prepare('SELECT COUNT(*) c FROM beats').get() as { c: number };
  if (Number(beatCount?.c || 0) === 0) {
    const ins = d.prepare(
      `INSERT INTO beats (slug,title,description,genre,mood,bpm,musical_key,tags,cover_url,preview_url,audio_url,
        price_basic,price_premium,price_exclusive,price_buyout,status,featured,plays,sales)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'published', ?, ?, ?)`,
    );
    const plays = [1284, 962, 2103, 745, 1533, 889, 604, 1761];
    const sales = [14, 9, 22, 5, 11, 7, 4, 18];
    DEMO_BEATS.forEach((b, i) => {
      ins.run(
        b.file,
        b.title,
        `${b.mood} ${b.genre} instrumental at ${b.bpm} BPM in ${b.key}. Delivered instantly as MP3, WAV and stems depending on the licence you pick.`,
        b.genre,
        b.mood,
        b.bpm,
        b.key,
        b.tags,
        `/uploads/covers/${b.file}.svg`,
        `/uploads/beats/${b.file}.wav`,
        `/uploads/beats/${b.file}.wav`,
        b.basic,
        b.premium,
        b.exclusive,
        b.buyout,
        b.featured,
        plays[i],
        sales[i],
      );
    });
  }

  const videoCount = d.prepare('SELECT COUNT(*) c FROM videos').get() as { c: number };
  if (Number(videoCount?.c || 0) === 0) {
    const ins = d.prepare(
      'INSERT INTO videos (title, description, source_type, video_url, beat_id) VALUES (?,?,?,?,?)',
    );
    for (const v of DEMO_VIDEOS) {
      const b = d.prepare('SELECT id FROM beats WHERE slug = ?').get(v.beat) as
        | { id: number }
        | undefined;
      ins.run(v.title, v.description, 'youtube', v.url, b ? Number(b.id) : null);
    }
  }

  const orderCount = d.prepare('SELECT COUNT(*) c FROM orders').get() as { c: number };
  if (Number(orderCount?.c || 0) === 0 && demoUserId) {
    const mkOrder = (
      ref: string,
      status: string,
      method: string,
      beatSlug: string,
      license: string,
      price: number,
      daysAgo: number,
    ) => {
      const b = d.prepare('SELECT id, title FROM beats WHERE slug = ?').get(beatSlug) as
        | { id: number; title: string }
        | undefined;
      if (!b) return;
      const res = d
        .prepare(
          `INSERT INTO orders (reference,user_id,subtotal,total,currency,status,method,channel,paid_at,created_at)
           VALUES (?,?,?,?,?,?,?,?,?, datetime('now','-'||?||' days'))`,
        )
        .run(
          ref,
          demoUserId,
          price,
          price,
          'GHS',
          status,
          method,
          method === 'Mobile Money' ? 'mobile_money' : 'bank',
          status === 'paid' ? new Date(Date.now() - daysAgo * 86400000).toISOString() : null,
          daysAgo,
        );
      d.prepare(
        `INSERT INTO order_items (order_id,beat_id,beat_title,license,price,download_token,download_count,emailed_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      ).run(
        Number(res.lastInsertRowid),
        Number(b.id),
        b.title,
        license,
        price,
        crypto.randomBytes(18).toString('hex'),
        status === 'paid' ? 2 : 0,
        status === 'paid' ? new Date(Date.now() - daysAgo * 86400000).toISOString() : null,
      );
    };

    mkOrder('BV-DEMO-0001', 'paid', 'Mobile Money', 'midnight-in-accra', 'Premium Lease (WAV)', 12000, 12);
    mkOrder('BV-DEMO-0002', 'paid', 'Bank Transfer', 'sunlight-driver', 'Basic Lease (MP3)', 6000, 4);
    mkOrder('BV-DEMO-0003', 'pending', 'Mobile Money', 'concrete-roses', 'Exclusive Rights', 38000, 1);
  }

  const msgCount = d.prepare('SELECT COUNT(*) c FROM messages').get() as { c: number };
  if (Number(msgCount?.c || 0) === 0) {
    d.prepare(
      'INSERT INTO messages (name,email,subject,body,status) VALUES (?,?,?,?,?)',
    ).run(
      'Kwame Osei',
      'kwame@streetlabel.gh',
      'Custom beat for an album',
      'Hey — I need 5 exclusive beats for an upcoming album. Budget is GH₵5,000 total. Can we talk this week?',
      'unread',
    );
    d.prepare(
      'INSERT INTO messages (name,email,subject,body,status) VALUES (?,?,?,?,?)',
    ).run(
      'Zainab Musah',
      'zainab.m@gmail.com',
      'Stem request',
      'I bought Midnight In Accra last week, can I get the stems for mixing?',
      'unread',
    );
  }
}

/* ------------------------------------------------------------------ */
/* Typed query helpers                                                 */
/* ------------------------------------------------------------------ */

type Row = Record<string, any>;

/**
 * node:sqlite returns rows with a null prototype, which React refuses to pass
 * from a Server Component to a Client Component. Re-shape them as plain objects.
 */
function toPlain<T>(row: unknown): T {
  if (row === null || typeof row !== 'object') return row as T;
  if (Array.isArray(row)) return (row as unknown[]).map((r) => toPlain(r)) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row as Record<string, unknown>)) {
    out[k] = (row as Record<string, unknown>)[k];
  }
  return out as T;
}

export function all<T = Row>(sql: string, params: unknown[] = []): T[] {
  const stmt = db().prepare(sql);
  return (stmt.all(...(params as any[])) as unknown[]).map((r) => toPlain<T>(r));
}

export function get<T = Row>(sql: string, params: unknown[] = []): T | undefined {
  const stmt = db().prepare(sql);
  const row = stmt.get(...(params as any[]));
  return row == null ? undefined : toPlain<T>(row);
}

export function run(sql: string, params: unknown[] = []) {
  const stmt = db().prepare(sql);
  const res = stmt.run(...(params as any[]));
  return {
    changes: Number(res.changes ?? 0),
    lastInsertRowid: Number(res.lastInsertRowid ?? 0),
  };
}

export function exec(sql: string) {
  db().exec(sql);
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS: Record<string, string> = {
  studio_name: 'BEATVAULT',
  producer_name: 'Nathaniel Sasuosei',
  tagline: 'Premium beats for serious artists',
  hero_headline: 'SOUND THAT',
  hero_headline_accent: 'MOVES CROWDS',
  hero_sub:
    'Buy exclusive Afrobeat, Drill, Amapiano and Trap instrumentals. Pay with Mobile Money or bank transfer and get your files in your inbox instantly.',
  email_from: 'Beatvault <onboarding@resend.dev>',
  support_email: 'hello@beatvault.gh',
  currency: 'GHS',
  currency_symbol: 'GH₵',
  momo_number: '055 000 0000',
  bank_name: 'GCB Bank',
  bank_account_name: 'Nathaniel Sasuosei',
  bank_account_number: '0000000000',
  paystack_public_key: '',
  paystack_secret_key: '',
  broadcast_message: '',
};

export function getSetting(key: string): string {
  const row = get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  if (row) return row.value;
  return DEFAULT_SETTINGS[key] ?? '';
}

export function getSettings(): Record<string, string> {
  const rows = all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function setSetting(key: string, value: string) {
  run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}
