import { NextResponse } from 'next/server';
import { z } from 'zod';
import { run } from '@/lib/db';
import { getSetting } from '@/lib/db';
import { readSession } from '@/lib/auth';
import { contactNotification, sendEmail } from '@/lib/mailer';

const Schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email address'),
  subject: z.string().min(3, 'Add a short subject'),
  body: z.string().min(10, 'Tell me a little more (at least 10 characters)'),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Check the form' },
      { status: 400 },
    );
  }

  const { name, email, subject, body } = parsed.data;
  const session = await readSession();

  run('INSERT INTO messages (name, email, subject, body, user_id) VALUES (?,?,?,?,?)', [
    name,
    email.toLowerCase().trim(),
    subject,
    body,
    session ? Number(session.sub) : null,
  ]);

  await sendEmail({
    to: getSetting('support_email') || email,
    subject: `New website message: ${subject}`,
    html: contactNotification({ name, email, subject, body }),
    kind: 'contact',
  });

  return NextResponse.json({ ok: true });
}
