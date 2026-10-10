import { all, get, run } from './db';

export { all };

export type BeatRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  genre: string;
  mood: string;
  bpm: number;
  musical_key: string;
  tags: string;
  cover_url: string;
  audio_url: string;
  preview_url: string;
  video_url: string;
  price_basic: number;
  price_premium: number;
  price_exclusive: number;
  price_buyout: number;
  status: string;
  featured: number;
  plays: number;
  sales: number;
  created_at: string;
  updated_at: string;
};

export function listBeats(opts: {
  genre?: string;
  q?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
  includeUnpublished?: boolean;
} = {}): BeatRow[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (!opts.includeUnpublished) where.push(`status = 'published'`);
  if (opts.featured) where.push(`featured = 1`);
  if (opts.genre && opts.genre !== 'All') {
    where.push(`genre = ?`);
    params.push(opts.genre);
  }
  if (opts.q) {
    where.push(`(title LIKE ? OR genre LIKE ? OR tags LIKE ? OR mood LIKE ? OR musical_key LIKE ?)`);
    const like = `%${opts.q}%`;
    params.push(like, like, like, like, like);
  }

  const order =
    opts.sort === 'price-asc'
      ? 'price_basic ASC'
      : opts.sort === 'price-desc'
        ? 'price_basic DESC'
        : opts.sort === 'bpm'
          ? 'bpm ASC'
          : opts.sort === 'title'
            ? 'title ASC'
            : 'featured DESC, id DESC';

  const sql = `SELECT * FROM beats ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${order} ${opts.limit ? 'LIMIT ' + Number(opts.limit) : ''}`;
  return all<BeatRow>(sql, params);
}

export function getBeatBySlug(slug: string) {
  return get<BeatRow>('SELECT * FROM beats WHERE slug = ?', [slug]);
}

export function getBeatById(id: number) {
  return get<BeatRow>('SELECT * FROM beats WHERE id = ?', [id]);
}

export function relatedBeats(beat: BeatRow, limit = 3) {
  return all<BeatRow>(
    `SELECT * FROM beats WHERE status='published' AND id != ? AND (genre = ? OR mood = ?)
     ORDER BY featured DESC, id DESC LIMIT ?`,
    [beat.id, beat.genre, beat.mood || '', limit],
  );
}

export function genres(): { genre: string; count: number }[] {
  return all<{ genre: string; count: number }>(
    `SELECT genre, COUNT(*) as count FROM beats WHERE status='published' GROUP BY genre ORDER BY count DESC`,
  );
}

export function listVideos(limit = 12) {
  return all<{
    id: number;
    title: string;
    description: string;
    source_type: string;
    video_url: string;
    thumbnail_url: string;
    beat_id: number | null;
    beat_title: string | null;
    beat_slug: string | null;
    published: number;
    created_at: string;
  }>(
    `SELECT v.*, b.title as beat_title, b.slug as beat_slug
     FROM videos v LEFT JOIN beats b ON b.id = v.beat_id
     WHERE v.published = 1
       AND (v.description IS NULL OR v.description NOT LIKE 'Demo placeholder:%')
     ORDER BY v.id DESC LIMIT ?`,
    [limit],
  );
}

export function bumpPlays(id: number) {
  run('UPDATE beats SET plays = plays + 1 WHERE id = ?', [id]);
}

export function siteStats() {
  const beats = get<{ c: number }>("SELECT COUNT(*) c FROM beats WHERE status='published'");
  const artists = get<{ c: number }>('SELECT COUNT(*) c FROM users');
  const sold = get<{ c: number }>("SELECT COUNT(*) c FROM orders WHERE status='paid'");
  const revenue = get<{ s: number }>(
    "SELECT COALESCE(SUM(total),0) s FROM orders WHERE status='paid'",
  );
  return {
    beats: beats?.c ?? 0,
    artists: artists?.c ?? 0,
    sold: sold?.c ?? 0,
    revenue: revenue?.s ?? 0,
  };
}

export function ordersWithItems(userId?: number) {
  const orders = all<any>(
    `SELECT o.*, u.name, u.email FROM orders o LEFT JOIN users u ON u.id = o.user_id
     ${userId ? 'WHERE o.user_id = ?' : ''} ORDER BY o.id DESC`,
    userId ? [userId] : [],
  );
  const ids = orders.map((o) => o.id);
  if (!ids.length) return [];
  const items = all<any>(
    `SELECT oi.*, b.slug, b.cover_url, b.genre FROM order_items oi
     LEFT JOIN beats b ON b.id = oi.beat_id
     WHERE oi.order_id IN (${ids.map(() => '?').join(',')})`,
    ids,
  );
  const byOrder: Record<number, any[]> = {};
  for (const it of items) {
    (byOrder[it.order_id] ||= []).push(it);
  }
  return orders.map((o) => ({ ...o, items: byOrder[o.id] || [] }));
}

export function getOrderByRef(ref: string) {
  const order = get<any>(
    `SELECT o.*, u.name, u.email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.reference = ?`,
    [ref],
  );
  if (!order) return null;
  const items = all<any>(
    `SELECT oi.*, b.slug, b.cover_url, b.audio_url, b.genre FROM order_items oi
     LEFT JOIN beats b ON b.id = oi.beat_id WHERE oi.order_id = ?`,
    [order.id],
  );
  return { ...order, items };
}

export function getUserByEmail(email: string) {
  return get<any>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
}
