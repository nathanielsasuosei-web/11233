import os from 'node:os';
import path from 'node:path';

/**
 * Serverless platforms (Vercel, AWS Lambda, …) run the app from a read-only
 * filesystem (`/var/task` on Lambda) where only the OS temp dir is writable.
 * Writing to `process.cwd()` there crashes with `ENOENT: mkdir '/var/task/...'`.
 */
export function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

/**
 * Writable directory for runtime files (SQLite database, uploads).
 * Locally this is the project folder; on serverless it is a folder inside
 * the OS temp dir. Note: the temp dir is ephemeral and per-instance, so
 * data written there does not persist across cold starts on serverless.
 */
export function writableDir(...segments: string[]): string {
  const base = isServerless() ? path.join(os.tmpdir(), 'beatvault') : process.cwd();
  return path.join(base, ...segments);
}
