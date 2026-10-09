import { NextResponse } from 'next/server';
import { z } from 'zod';
import { get, run } from '@/lib/db';
import { hashPassword, readSession } from '@/lib/auth';

const Schema = z.object({
  name: z.string().min(2),
  artist_name: z.string().optional().default(''),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  country: z.string().optional().default(''),
  password: z.string().min(6).optional(),
});

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Check your details' }, { status: 400 });
  }

  const { name, artist_name, email, phone, country, password } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();
  const id = Number(session.sub);

  const clash = get<any>('SELECT id FROM users WHERE email = ? AND id != ?', [cleanEmail, id]);
  if (clash) return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });

  if (password) {
    run(
      'UPDATE users SET name=?, artist_name=?, email=?, phone=?, country=?, password_hash=? WHERE id=?',
      [name, artist_name, cleanEmail, phone, country, hashPassword(password), id],
    );
  } else {
    run('UPDATE users SET name=?, artist_name=?, email=?, phone=?, country=? WHERE id=?', [
      name,
      artist_name,
      cleanEmail,
      phone,
      country,
      id,
    ]);
  }

  return NextResponse.json({ ok: true });
}
