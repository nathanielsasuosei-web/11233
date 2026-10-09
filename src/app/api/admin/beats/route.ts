import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { saveUpload } from '@/lib/storage';
import { slugify, toMinor, randomToken } from '@/lib/utils';

async function guard() {
  const admin = await requireAdmin();
  if (!admin) return null;
  return admin;
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const fd = await req.formData();
  const str = (k: string) => String(fd.get(k) ?? '').trim();
  const title = str('title');
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const baseSlug = slugify(str('slug') || title);
  let slug = baseSlug || `beat-${randomToken(6)}`;
  let n = 2;
  while (get('SELECT id FROM beats WHERE slug = ?', [slug])) slug = `${baseSlug}-${n++}`;

  const cover = fd.get('cover');
  const audio = fd.get('audio');
  const preview = fd.get('preview');

  const coverUrl =
    cover instanceof File && cover.size > 0
      ? await saveUpload(cover, 'covers', cover.name)
      : str('cover_url');
  const audioUrl =
    audio instanceof File && audio.size > 0
      ? await saveUpload(audio, 'beats', audio.name)
      : str('audio_url');
  const previewUrl =
    preview instanceof File && preview.size > 0
      ? await saveUpload(preview, 'beats', preview.name)
      : str('preview_url') || audioUrl;

  const res = run(
    `INSERT INTO beats (slug,title,description,genre,mood,bpm,musical_key,tags,cover_url,audio_url,preview_url,video_url,
      price_basic,price_premium,price_exclusive,price_buyout,status,featured)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      slug,
      title,
      str('description'),
      str('genre') || 'Afrobeats',
      str('mood'),
      Number(str('bpm')) || 100,
      str('musical_key'),
      str('tags'),
      coverUrl,
      audioUrl,
      previewUrl,
      str('video_url'),
      toMinor(str('price_basic') || '0'),
      toMinor(str('price_premium') || '0'),
      toMinor(str('price_exclusive') || '0'),
      toMinor(str('price_buyout') || '0'),
      str('status') || 'published',
      str('featured') === '1' ? 1 : 0,
    ],
  );

  return NextResponse.json({ ok: true, id: res.lastInsertRowid, slug });
}

export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const fd = await req.formData();
  const id = Number(fd.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const existing = get<any>('SELECT * FROM beats WHERE id = ?', [id]);
  if (!existing) return NextResponse.json({ error: 'Beat not found' }, { status: 404 });

  const str = (k: string) => String(fd.get(k) ?? '').trim();

  const cover = fd.get('cover');
  const audio = fd.get('audio');
  const preview = fd.get('preview');

  const coverUrl =
    cover instanceof File && cover.size > 0
      ? await saveUpload(cover, 'covers', cover.name)
      : str('cover_url');
  const audioUrl =
    audio instanceof File && audio.size > 0
      ? await saveUpload(audio, 'beats', audio.name)
      : str('audio_url');
  const previewUrl =
    preview instanceof File && preview.size > 0
      ? await saveUpload(preview, 'beats', preview.name)
      : str('preview_url');

  run(
    `UPDATE beats SET title=?, description=?, genre=?, mood=?, bpm=?, musical_key=?, tags=?,
      cover_url=?, audio_url=?, preview_url=?, video_url=?,
      price_basic=?, price_premium=?, price_exclusive=?, price_buyout=?, status=?, featured=?,
      updated_at=datetime('now')
     WHERE id=?`,
    [
      str('title') || existing.title,
      str('description'),
      str('genre') || existing.genre,
      str('mood'),
      Number(str('bpm')) || existing.bpm,
      str('musical_key'),
      str('tags'),
      coverUrl,
      audioUrl,
      previewUrl,
      str('video_url'),
      toMinor(str('price_basic') || '0'),
      toMinor(str('price_premium') || '0'),
      toMinor(str('price_exclusive') || '0'),
      toMinor(str('price_buyout') || '0'),
      str('status') || existing.status,
      str('featured') === '1' ? 1 : 0,
      id,
    ],
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  run('DELETE FROM beats WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
