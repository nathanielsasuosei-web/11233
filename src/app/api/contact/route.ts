import { NextResponse } from 'next/server';
import { z } from 'zod';
import { run, getSetting } from '@/lib/db';
import { readSession } from '@/lib/auth';
import { contactNotification, sendEmail } from '@/lib/mailer';
import { notifyProducerEnquiry } from '@/lib/whatsapp';

const Schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().max(40).optional().default(''),
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

  const { name, email, phone, subject, body } = parsed.data;
  const session = await readSession();

  const res = run(
    'INSERT INTO messages (name, email, phone, subject, body, kind, user_id) VALUES (?,?,?,?,?,?,?)',
    [
      name,
      email.toLowerCase().trim(),
      phone.trim(),
      subject,
      body,
      'enquiry',
      session ? Number(session.sub) : null,
    ],
  );

  const wa = await notifyProducerEnquiry({
    messageId: res.lastInsertRowid,
    name,
    email,
    phone: phone.trim(),
    subject,
    body,
  });

  await sendEmail({
    to: getSetting('support_email') || email,
    subject: `New website message: ${subject}`,
    html: contactNotification({ name, email, subject, body: phone ? `Phone / WhatsApp: ${phone}\n\n${body}` : body }),
    kind: 'contact',
  });

  return NextResponse.json({ ok: true, whatsapp_url: wa.whatsappUrl });
}
