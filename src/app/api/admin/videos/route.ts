import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteUpload, saveUpload, storageMode } from '@/lib/storage';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const fd = await req.formData();
  const str = (k: string) => String(fd.get(k) ?? '').trim();
  const title = str('title');
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const sourceType = str('source_type') === 'file' ? 'file' : 'youtube';
  const file = fd.get('file');
  let url = str('video_url');

  if (sourceType === 'file') {
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Choose a video file to upload' }, { status: 400 });
    }
    url = await saveUpload(file, 'videos', file.name);
  } else if (!url) {
    return NextResponse.json({ error: 'Paste a YouTube link' }, { status: 400 });
  }

  const thumb = fd.get('thumbnail');
  const thumbUrl =
    thumb instanceof File && thumb.size > 0
      ? await saveUpload(thumb, 'covers', thumb.name)
      : str('thumbnail_url');

  run(
    'INSERT INTO videos (title, description, source_type, video_url, thumbnail_url, beat_id, published) VALUES (?,?,?,?,?,?,?)',
    [
      title,
      str('description'),
      sourceType,
      url,
      thumbUrl,
      str('beat_id') ? Number(str('beat_id')) : null,
      str('published') === '0' ? 0 : 1,
    ],
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const video = get<any>('SELECT video_url, thumbnail_url FROM videos WHERE id = ?', [id]);
  run('DELETE FROM videos WHERE id = ?', [id]);
  if (video) {
    // Only uploaded files belong to this app's storage — YouTube links are left alone.
    const ours = (u: string) =>
      u && (u.startsWith('/uploads/') || u.startsWith('/api/media/') || storageMode() === 's3');
    await Promise.all(
      [video.video_url, video.thumbnail_url]
        .filter((u: string) => ours(u))
        .map((u: string) => deleteUpload(u).catch(() => {})),
    );
  }
  return NextResponse.json({ ok: true });
}
