/**
 * File storage with two backends:
 *
 *  - S3-compatible object storage — Neon Storage buckets, AWS S3, Cloudflare R2,
 *    MinIO, Backblaze B2, Wasabi… Configure it with the S3_* env vars, or with the
 *    AWS-standard vars Neon injects for a bucket declared in neon.ts
 *    (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, AWS_REGION)
 *    plus the bucket name in S3_BUCKET (e.g. `S3_BUCKET=assets`).
 *  - Local disk under public/uploads (default, zero config). On serverless hosts
 *    the writable temp dir is used and files are served by /uploads/[...path].
 *
 * In S3 mode the database stores a stable app-relative URL (/api/media/<key>) —
 * never the object endpoint — and every read goes through a short-lived presigned
 * GET redirect issued by /api/media/[...path] (or the download route), so PRIVATE
 * buckets work end to end for covers, previews, videos and paid downloads.
 * Deletes map any stored URL form back to the object key.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { writableDir } from '@/lib/env';

export const UPLOAD_ROOT = writableDir('public', 'uploads');

export type StorageMode = 's3' | 'local';

export interface StorageInfo {
  mode: StorageMode;
  bucket?: string;
  /** Host of the S3 endpoint, when a custom one is configured. */
  endpoint?: string;
  /** How objects are read: presigned redirects (private buckets) or public URLs. */
  access: 'presigned-private' | 'public-url' | 'local-disk';
  /** Presigned-URL lifetime in seconds. */
  signedTtl: number;
}

interface S3Config {
  bucket: string;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  publicUrl?: string;
}

/**
 * Resolve the S3 configuration from the environment, or null when object storage
 * is not configured (→ local disk mode). Accepts both the generic S3_* vars and
 * the AWS_* vars Neon injects for a declared bucket.
 */
export function s3Config(): S3Config | null {
  const bucket = (process.env.S3_BUCKET || process.env.NEON_STORAGE_BUCKET || '').trim();
  const accessKeyId = (process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    ''
  ).trim();
  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  const endpoint = (process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3 || '').trim();
  // Path-style addressing is required by Neon Storage and MinIO; default to it
  // whenever a custom endpoint is set, unless explicitly overridden.
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE != null && process.env.S3_FORCE_PATH_STYLE !== ''
      ? process.env.S3_FORCE_PATH_STYLE === 'true'
      : Boolean(endpoint);
  return {
    bucket,
    endpoint: endpoint || undefined,
    region: (process.env.S3_REGION || process.env.AWS_REGION || 'auto').trim() || 'auto',
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
    publicUrl: (process.env.S3_PUBLIC_URL || '').trim() || undefined,
  };
}

export function storageMode(): StorageMode {
  return s3Config() ? 's3' : 'local';
}

function signedTtl(): number {
  const n = Number(process.env.S3_SIGNED_TTL || 3600);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 604800) : 3600;
}

export function storageInfo(): StorageInfo {
  const cfg = s3Config();
  if (!cfg) return { mode: 'local', access: 'local-disk', signedTtl: signedTtl() };
  let endpoint: string | undefined;
  if (cfg.endpoint) {
    try {
      endpoint = new URL(cfg.endpoint).host;
    } catch {
      endpoint = cfg.endpoint;
    }
  }
  return {
    mode: 's3',
    bucket: cfg.bucket,
    endpoint,
    access: cfg.publicUrl ? 'public-url' : 'presigned-private',
    signedTtl: signedTtl(),
  };
}

/* ------------------------------------------------------------------ */
/* S3 client + object helpers                                          */
/* ------------------------------------------------------------------ */

let _s3: any = null;

async function s3Client(): Promise<any> {
  const cfg = s3Config();
  if (!cfg) throw new Error('Object storage is not configured (set S3_BUCKET + credentials)');
  if (_s3) return _s3;
  const { S3Client } = await import('@aws-sdk/client-s3');
  _s3 = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: cfg.forcePathStyle,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  return _s3;
}

/** Decode + validate an object key (no empty/dot segments). Null when invalid. */
function safeKey(raw: string): string | null {
  const decoded = raw
    .split('/')
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    })
    .join('/');
  if (!decoded || decoded.split('/').some((s) => s === '' || s === '.' || s === '..')) return null;
  return decoded;
}

/** Stable app-relative URL stored in the DB for an object key. */
export function mediaUrl(key: string): string {
  return `/api/media/${key.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * Object key for any URL form the DB may hold: /api/media/<key> (current S3 mode),
 * an absolute object URL (legacy rows), or null for local /uploads/ files and
 * foreign URLs (YouTube links etc.).
 */
export function keyFromUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith('/api/media/')) return safeKey(url.slice('/api/media/'.length));
  if (url.startsWith('/uploads/')) return null;
  const cfg = s3Config();
  if (!cfg) return null;
  const bases = [
    cfg.endpoint ? `${cfg.endpoint.replace(/\/+$/, '')}/${cfg.bucket}/` : '',
    cfg.publicUrl ? `${cfg.publicUrl.replace(/\/+$/, '')}/` : '',
  ];
  for (const base of bases) {
    if (base && url.startsWith(base)) return safeKey(url.slice(base.length));
  }
  try {
    const u = new URL(url);
    // virtual-hosted style: https://<bucket>.s3.<region>.amazonaws.com/<key>
    if (u.hostname === cfg.bucket || u.hostname.startsWith(`${cfg.bucket}.`)) {
      return safeKey(u.pathname.replace(/^\/+/, ''));
    }
  } catch {
    /* not an absolute URL */
  }
  return null;
}

/** Presigned GET URL for an object key (optionally forcing an attachment download). */
export async function presignGet(
  key: string,
  opts: { disposition?: string; expiresIn?: number } = {},
): Promise<string> {
  const cfg = s3Config();
  if (!cfg) throw new Error('Object storage is not configured');
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const client = await s3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ...(opts.disposition ? { ResponseContentDisposition: opts.disposition } : {}),
    }),
    { expiresIn: opts.expiresIn ?? signedTtl() },
  );
}

/** True when the object exists in the configured bucket. */
export async function objectExists(key: string): Promise<boolean> {
  const cfg = s3Config();
  if (!cfg) return false;
  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3Client()).send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Local disk backend                                                  */
/* ------------------------------------------------------------------ */

/**
 * Every place a local `/uploads/...` file may live, in priority order:
 * the writable runtime root first, then the build-time public tree
 * (demo media generated by `npm run demo:media` during `prebuild`).
 */
function localUploadCandidates(url: string): string[] {
  const rel = url.replace(/^\/uploads\//, '');
  if (!rel || rel.split('/').some((seg) => seg === '..' || seg === '.')) return [];
  return [
    path.join(UPLOAD_ROOT, rel),
    path.join(process.cwd(), 'public', 'uploads', rel),
  ];
}

/** Read a locally stored `/uploads/...` file, or null if it is not on disk. */
export async function readLocalUpload(url: string): Promise<Buffer | null> {
  for (const filePath of localUploadCandidates(url)) {
    try {
      return await fs.readFile(filePath);
    } catch {
      /* try the next location */
    }
  }
  return null;
}

/** Best-effort delete of a locally stored `/uploads/...` file. */
export async function removeLocalUpload(url: string): Promise<void> {
  for (const filePath of localUploadCandidates(url)) {
    try {
      await fs.unlink(filePath);
    } catch {
      /* already gone */
    }
  }
}

/* ------------------------------------------------------------------ */
/* Unified read / write / delete                                       */
/* ------------------------------------------------------------------ */

function safeName(original: string) {
  const ext = path.extname(original).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const base = path
    .basename(original, path.extname(original))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base || 'file'}-${crypto.randomBytes(4).toString('hex')}${ext}`;
}

/**
 * Store an upload and return the URL to save in the DB.
 * S3 mode → `/api/media/<key>` (read via presigned redirect, private-bucket safe).
 * Local mode → `/uploads/<folder>/<name>` (served from public/, or the
 * /uploads/[...path] route for runtime writes on serverless hosts).
 */
export async function saveUpload(
  file: File | Blob,
  folder: 'beats' | 'covers' | 'videos',
  originalName = 'file',
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = safeName(originalName);
  const key = `${folder}/${name}`;
  const contentType = (file as File).type || 'application/octet-stream';

  const cfg = s3Config();
  if (cfg) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3Client()).send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Only set an ACL when explicitly asked — private buckets reject
        // public-read ACLs, and presigned URLs make public access unnecessary.
        ACL: (process.env.S3_ACL as any) || undefined,
        CacheControl:
          process.env.S3_CACHE_CONTROL ||
          (folder === 'beats' ? 'private, max-age=3600' : 'public, max-age=86400'),
      }),
    );
    return mediaUrl(key);
  }

  const dir = path.join(UPLOAD_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return `/uploads/${folder}/${name}`;
}

/** Read any stored upload (local disk or S3 object) into memory, or null. */
export async function readUpload(url: string): Promise<Buffer | null> {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return readLocalUpload(url);
  const key = keyFromUrl(url);
  const cfg = s3Config();
  if (!key || !cfg) return null;
  try {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const res = await (await s3Client()).send(
      new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch {
    return null;
  }
}

/** Best-effort delete of a stored upload, in whichever backend it lives. */
export async function deleteUpload(url: string): Promise<void> {
  if (!url) return;
  if (url.startsWith('/uploads/')) {
    await removeLocalUpload(url);
    return;
  }
  const key = keyFromUrl(url);
  const cfg = s3Config();
  if (!key || !cfg) return;
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await s3Client()).send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
  } catch {
    /* best effort */
  }
}

/**
 * Files are served from /public in local mode. In S3 mode the stored
 * /api/media/... URL already resolves to a presigned object URL.
 * This helper keeps that decision in one place.
 */
export function deliveryUrl(url: string) {
  return url;
}
