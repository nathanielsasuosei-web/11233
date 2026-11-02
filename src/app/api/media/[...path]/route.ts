import { NextResponse } from 'next/server';
import { keyFromUrl, objectExists, presignGet, storageMode } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const ALLOWED_PREFIX = /^(beats|covers|videos)\//;

/**
 * Serves uploaded media through the app so private object-storage buckets work
 * in <img>, <audio> and <video> tags:
 *
 *  - S3 mode: verify the object exists, then 302 to a short-lived presigned GET
 *    URL. The browser (or player) lands directly on the object store, so HTTP
 *    range requests for audio/video seeking keep working.
 *  - Local mode: forward to /uploads/<key>, which Next.js serves from public/
 *    or, for runtime writes on serverless hosts, from the /uploads route.
 *
 * The DB stores this route's URL (/api/media/<key>) in S3 mode, so the stored
 * value never contains credentials or an endpoint that could go stale.
 */
export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  const key = keyFromUrl(`/api/media/${params.path.join('/')}`);
  if (!key || !ALLOWED_PREFIX.test(key)) {
    return new NextResponse('Not found', { status: 404 });
  }

  if (storageMode() === 's3') {
    if (!(await objectExists(key))) {
      return new NextResponse('Not found', { status: 404 });
    }
    try {
      const signed = await presignGet(key);
      return NextResponse.redirect(signed, 302);
    } catch (err) {
      console.error('[media] presign failed:', err);
      return new NextResponse('Storage error', { status: 502 });
    }
  }

  return NextResponse.redirect(new URL(`/uploads/${key}`, req.url), 307);
}
