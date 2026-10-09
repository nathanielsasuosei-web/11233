/**
 * File storage with two backends:
 *  - S3-compatible object storage (when S3_* env vars are present)
 *  - Local disk under /public/uploads (default, works out of the box)
 *
 * Both return a publicly reachable URL so <img>, <audio> and <video> just work.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

export function storageMode(): 's3' | 'local' {
  return process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID ? 's3' : 'local';
}

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

async function putS3(buffer: Buffer, key: string, contentType: string) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET as string,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: (process.env.S3_ACL as any) || undefined,
    }),
  );
  const publicBase =
    process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}`;
  return `${publicBase.replace(/\/$/, '')}/${key}`;
}

export async function saveUpload(
  file: File | Blob,
  folder: 'beats' | 'covers' | 'videos',
  originalName = 'file',
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = safeName(originalName);
  const key = `${folder}/${name}`;
  const contentType = (file as File).type || 'application/octet-stream';

  if (storageMode() === 's3') {
    return putS3(buffer, key, contentType);
  }

  const dir = path.join(UPLOAD_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return `/uploads/${folder}/${name}`;
}

export async function deleteUpload(url: string) {
  if (!url) return;
  if (url.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', url);
    try {
      await fs.unlink(filePath);
    } catch {
      /* already gone */
    }
    return;
  }
  if (storageMode() === 's3' && process.env.S3_BUCKET) {
    try {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
        },
      });
      const key = url.split(process.env.S3_BUCKET + '/')[1] || url.split('/').pop();
      await client.send(
        new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key as string }),
      );
    } catch {
      /* best effort */
    }
  }
}

/**
 * Files are served from /public in local mode. In S3 mode deliveries use the
 * object URL directly. This helper keeps that decision in one place.
 */
export function deliveryUrl(url: string) {
  return url;
}
