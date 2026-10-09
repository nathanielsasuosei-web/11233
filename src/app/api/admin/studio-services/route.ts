import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { slugify, toMinor } from '@/lib/utils';

type Body = {
  id?: number;
  title?: string;
  blurb?: string;
  includes?: string;
  icon?: string;
  price_per_hour?: string | number;
  min_hours?: string | number;
  max_hours?: string | number;
  published?: string | number;
  sort?: string | number;
};

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const title = String(body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Give the service a name' }, { status: 400 });

  const minHours = clamp(body.min_hours, 1, 12, 1);
  const maxHours = Math.max(minHours, clamp(body.max_hours, 1, 12, minHours));
  const price = Math.max(0, Math.round(toMinor(Number(body.price_per_hour) || 0)));
  const published = String(body.published) === '0' ? 0 : 1;
  const icon = ['recording', 'mixing', 'mastering'].includes(String(body.icon))
    ? String(body.icon)
    : 'recording';

  if (body.id) {
    run(
      `UPDATE studio_services SET title = ?, blurb = ?, includes = ?, icon = ?, price_per_hour = ?,
        min_hours = ?, max_hours = ?, published = ?, sort = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        title,
        String(body.blurb || ''),
        String(body.includes || ''),
        icon,
        price,
        minHours,
        maxHours,
        published,
        clamp(body.sort, 0, 99, 0),
        Number(body.id),
      ],
    );
    return NextResponse.json({ ok: true, id: Number(body.id) });
  }

  const slug = await uniqueSlug(slugify(title));
  const res = run(
    `INSERT INTO studio_services (slug, title, blurb, includes, icon, price_per_hour, min_hours, max_hours, published, sort)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      slug,
      title,
      String(body.blurb || ''),
      String(body.includes || ''),
      icon,
      price,
      minHours,
      maxHours,
      published,
      clamp(body.sort, 0, 99, 0),
    ],
  );
  return NextResponse.json({ ok: true, id: Number(res.lastInsertRowid), slug });
}

async function uniqueSlug(base: string) {
  const existing = all<{ slug: string }>('SELECT slug FROM studio_services').map((r) => r.slug);
  let candidate = base || 'session';
  let i = 2;
  while (existing.includes(candidate)) candidate = `${base}-${i++}`;
  return candidate;
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const hidden = run("UPDATE studio_services SET published = 0, updated_at = datetime('now') WHERE id = ?", [id]);
  if (!hidden.changes) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  return NextResponse.json({ ok: true, unpublished: true });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { id?: number; published?: number };
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  run('UPDATE studio_services SET published = ?, updated_at = datetime(\'now\') WHERE id = ?', [
    body.published ? 1 : 0,
    body.id,
  ]);
  return NextResponse.json({ ok: true });
}
