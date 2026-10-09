import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { get } from './db';

export const SESSION_COOKIE = 'bv_session';
export const ADMIN_COOKIE = 'bv_admin';

function secret() {
  const s = process.env.AUTH_SECRET || 'beatvault-dev-secret-change-me-in-production-0e8b598d';
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string;
  role: 'artist' | 'admin';
  email: string;
  name: string;
};

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

export async function readSession(token?: string): Promise<SessionPayload | null> {
  try {
    const raw = token ?? cookies().get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const { payload } = await jwtVerify(raw, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function readAdmin(token?: string): Promise<SessionPayload | null> {
  try {
    const raw = token ?? cookies().get(ADMIN_COOKIE)?.value;
    if (!raw) return null;
    const { payload } = await jwtVerify(raw, secret());
    if (payload.role !== 'admin') return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function hashPassword(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw: string, hash: string) {
  try {
    return bcrypt.compareSync(pw, hash);
  } catch {
    return false;
  }
}

export function currentUser() {
  return get<any>('SELECT id, name, artist_name, email, phone, country, created_at FROM users WHERE id = ?', [
    // populated by callers that already resolved the session
    0,
  ]);
}

export async function requireArtist() {
  const session = await readSession();
  if (!session || session.role !== 'artist') return null;
  const user = get<any>(
    'SELECT id, name, artist_name, email, phone, country, created_at FROM users WHERE id = ?',
    [Number(session.sub)],
  );
  return user ?? null;
}

export async function requireAdmin() {
  const session = await readAdmin();
  if (!session) return null;
  const admin = get<any>('SELECT id, email, name, role FROM admins WHERE id = ?', [
    Number(session.sub),
  ]);
  return admin ?? null;
}
