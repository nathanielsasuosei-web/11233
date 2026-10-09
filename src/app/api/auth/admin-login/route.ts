import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { ADMIN_COOKIE, signSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const admin = get<any>('SELECT * FROM admins WHERE email = ?', [email.toLowerCase().trim()]);
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
  }

  const token = await signSession({
    sub: String(admin.id),
    role: 'admin',
    email: admin.email,
    name: admin.name,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
