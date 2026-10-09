import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { replyEmail, sendEmail } from '@/lib/mailer';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const id = Number(ctx.params.id);
  const { reply } = (await req.json().catch(() => ({}))) as { reply?: string };
  if (!id || !reply || reply.trim().length < 2) {
    return NextResponse.json({ error: 'Write a reply first' }, { status: 400 });
  }

  const msg = get<any>('SELECT * FROM messages WHERE id = ?', [id]);
  if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  run("UPDATE messages SET status='read', admin_reply=?, replied_at=? WHERE id=?", [
    reply,
    new Date().toISOString(),
    id,
  ]);

  await sendEmail({
    to: msg.email,
    subject: `Re: ${msg.subject}`,
    html: replyEmail({
      name: msg.name,
      subject: msg.subject,
      reply,
      original: msg.body,
    }),
    kind: 'message_reply',
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  run('DELETE FROM messages WHERE id = ?', [Number(ctx.params.id)]);
  return NextResponse.json({ ok: true });
}
