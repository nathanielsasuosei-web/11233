import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { fulfillOrder, absoluteUrl } from '@/lib/fulfill';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const id = Number(ctx.params.id);
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };
  const order = get<any>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (action === 'resend') {
    const result = await fulfillOrder(id, (p) => absoluteUrl(req, p));
    return NextResponse.json({ ok: result.ok, mode: result.mode });
  }

  if (action === 'mark-paid') {
    run("UPDATE orders SET status='paid', paid_at=? WHERE id=?", [new Date().toISOString(), id]);
    const result = await fulfillOrder(id, (p) => absoluteUrl(req, p));
    return NextResponse.json({ ok: result.ok });
  }

  if (action === 'refund') {
    run("UPDATE orders SET status='refunded' WHERE id=?", [id]);
    await sendEmail({
      to: order.pay_email || '',
      subject: `Refund issued for ${order.reference}`,
      html: `<div style="font-family:sans-serif"><h2>Refund processed</h2><p>Your order <b>${order.reference}</b> has been refunded. Any downloads from that order are now disabled.</p></div>`,
      kind: 'admin_notice',
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reset-downloads') {
    run('UPDATE order_items SET download_count = 0 WHERE order_id = ?', [id]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  run('DELETE FROM orders WHERE id = ?', [Number(ctx.params.id)]);
  return NextResponse.json({ ok: true });
}
