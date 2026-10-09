import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { SESSION_COOKIE, signSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = get<any>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
  }

  const token = await signSession({
    sub: String(user.id),
    role: 'artist',
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
