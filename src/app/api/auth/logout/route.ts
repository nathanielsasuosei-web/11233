import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const which = url.searchParams.get('type') === 'admin' ? ADMIN_COOKIE : SESSION_COOKIE;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(which, '', { path: '/', maxAge: 0 });
  return res;
}
