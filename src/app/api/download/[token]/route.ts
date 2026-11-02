import { NextResponse } from 'next/server';
import path from 'node:path';
import { get, run } from '@/lib/db';
import { keyFromUrl, presignGet, readUpload, storageMode } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const item = get<any>(
    `SELECT oi.*, o.status, o.reference, o.paid_at, b.audio_url, b.title
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN beats b ON b.id = oi.beat_id
     WHERE oi.download_token = ?`,
    [params.token],
  );

  if (!item) {
    return new NextResponse('Download link not found.', { status: 404 });
  }
  if (item.status !== 'paid') {
    return new NextResponse('This order has not been paid yet, so the files are locked.', {
      status: 402,
    });
  }
  if (item.download_count >= item.download_limit) {
    return new NextResponse(
      `Download limit reached (${item.download_limit}). Reply to your order email and we will refresh the link.`,
      { status: 410 },
    );
  }

  const fileUrl = item.audio_url || '';
  if (!fileUrl) {
    return new NextResponse('The producer has not attached a master file to this beat yet.', {
      status: 404,
    });
  }

  run('UPDATE order_items SET download_count = download_count + 1 WHERE id = ?', [item.id]);

  const filename = `${item.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${item.license
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()}${path.extname(fileUrl) || '.mp3'}`;

  const ext = path.extname(fileUrl).toLowerCase();
  const contentType =
    ext === '.wav'
      ? 'audio/wav'
      : ext === '.mp3'
        ? 'audio/mpeg'
        : ext === '.ogg'
          ? 'audio/ogg'
          : ext === '.flac'
            ? 'audio/flac'
            : ext === '.m4a'
              ? 'audio/mp4'
              : 'application/octet-stream';

  // Object storage: hand off to a presigned URL that forces the attachment
  // download — works for private buckets and keeps large masters off this
  // serverless function's response body.
  const key = keyFromUrl(fileUrl);
  if (key && storageMode() === 's3') {
    try {
      const signed = await presignGet(key, {
        disposition: `attachment; filename="${filename}"`,
      });
      return NextResponse.redirect(signed, 302);
    } catch (err) {
      console.error('[download] presign failed, streaming instead:', err);
    }
  }

  // Local disk (or presign fallback): stream the bytes with an attachment header.
  const data = await readUpload(fileUrl);
  if (!data) {
    return new NextResponse('File is missing on the server.', { status: 404 });
  }
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
