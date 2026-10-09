import { NextResponse } from 'next/server';
import { z } from 'zod';
import { get, run } from '@/lib/db';
import { hashPassword, signSession, SESSION_COOKIE } from '@/lib/auth';
import { sendEmail, welcomeEmail } from '@/lib/mailer';

const Schema = z.object({
  name: z.string().min(2, 'Please enter your full name'),
  artist_name: z.string().optional().default(''),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional().default(''),
  country: z.string().optional().default(''),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Check your details' },
      { status: 400 },
    );
  }

  const { name, artist_name, email, phone, country, password } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  const exists = get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (exists) {
    return NextResponse.json(
      { error: 'An account with that email already exists. Try logging in.' },
      { status: 409 },
    );
  }

  const res = run(
    'INSERT INTO users (name, artist_name, email, phone, country, password_hash) VALUES (?,?,?,?,?,?)',
    [name, artist_name || name, cleanEmail, phone, country, hashPassword(password)],
  );

  const token = await signSession({
    sub: String(res.lastInsertRowid),
    role: 'artist',
    email: cleanEmail,
    name,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  await sendEmail({
    to: cleanEmail,
    subject: 'Welcome to the vault 🎧',
    html: welcomeEmail(name),
    kind: 'welcome',
  });

  return response;
}
