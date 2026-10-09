import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { get, run } from '@/lib/db';

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

  // Locally stored files are streamed with an attachment header.
  if (fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', fileUrl);
    try {
      const data = await fs.readFile(filePath);
      return new NextResponse(new Uint8Array(data), {
        headers: {
          'Content-Type': fileUrl.endsWith('.wav')
            ? 'audio/wav'
            : fileUrl.endsWith('.mp3')
              ? 'audio/mpeg'
              : 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    } catch {
      return new NextResponse('File is missing on the server.', { status: 404 });
    }
  }

  // Cloud storage: hand off to the object URL.
  return NextResponse.redirect(fileUrl, 302);
}
