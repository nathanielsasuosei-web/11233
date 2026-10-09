import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  run('INSERT OR IGNORE INTO subscribers (email) VALUES (?)', [email.toLowerCase().trim()]);
  return NextResponse.json({ ok: true });
}
