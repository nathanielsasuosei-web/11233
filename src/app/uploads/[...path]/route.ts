import { NextResponse } from 'next/server';
import path from 'node:path';
import { readLocalUpload } from '@/lib/storage';

/**
 * Serves locally stored uploads (`/uploads/...`).
 *
 * Files that exist in `public/uploads` (e.g. the demo media generated at
 * build time) are served by Next.js' static file handling before this route
 * runs. This handler covers files written at *runtime* to the writable temp
 * dir on serverless hosts (Vercel, AWS Lambda), where `public/` is read-only.
 */
export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const url = `/uploads/${params.path.join('/')}`;
  const data = await readLocalUpload(url);
  if (!data) {
    return new NextResponse('Not found', { status: 404 });
  }
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': MIME[path.extname(url).toLowerCase()] || 'application/octet-stream',
      // Runtime uploads may live in a per-instance temp dir — don't cache.
      'Cache-Control': 'no-store',
    },
  });
}
