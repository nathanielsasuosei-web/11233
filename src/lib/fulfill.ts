import { all, get, getSetting, run } from './db';
import { beatDeliveryEmail, sendEmail } from './mailer';
import { formatMoney, LICENSES } from './utils';

export function absoluteUrl(req: Request, path: string) {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (env) return `${env}${path}`;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}${path}`;
}

export function fallbackUrl(path: string) {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const stored = getSetting('site_url').replace(/\/$/, '');
  return `${env || stored || 'http://localhost:3000'}${path}`;
}

/**
 * Emails every purchased beat to the buyer and records the send.
 * Safe to call more than once (admin "resend" button).
 */
export async function fulfillOrder(orderId: number, base: (p: string) => string) {
  const order = get<any>(
    `SELECT o.*, u.name, u.email, u.artist_name FROM orders o
     LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
    [orderId],
  );
  if (!order) return { ok: false, error: 'Order not found' };

  const items = all<any>(
    `SELECT oi.*, b.title, b.cover_url, b.audio_url FROM order_items oi
     LEFT JOIN beats b ON b.id = oi.beat_id WHERE oi.order_id = ?`,
    [orderId],
  );

  const symbol = getSetting('currency_symbol') || 'GH₵';
  const currency = getSetting('currency') || 'GHS';

  const emailItems = items.map((it) => ({
    title: it.title || it.beat_title,
    license: LICENSES[it.license as keyof typeof LICENSES]?.name || it.license,
    price: formatMoney(it.price, symbol),
    downloadUrl: base(`/api/download/${it.download_token}`),
  }));

  const html = beatDeliveryEmail({
    name: order.artist_name || order.name || 'there',
    orderRef: order.reference,
    items: emailItems,
    total: formatMoney(order.total, symbol),
    method: order.method || 'Online',
  });

  const result = await sendEmail({
    to: order.email,
    subject: `🎧 Your beats are ready — ${order.reference}`,
    html,
    kind: 'beat_delivery',
  });

  if (result.ok) {
    run('UPDATE order_items SET emailed_at = ? WHERE order_id = ?', [
      new Date().toISOString(),
      orderId,
    ]);
  }

  // tell the producer too
  await sendEmail({
    to: getSetting('support_email') || order.email,
    subject: `New order ${order.reference} — ${formatMoney(order.total, symbol)}`,
    html: `<div style="font-family:sans-serif"><h2>New paid order</h2>
      <p><b>Reference:</b> ${order.reference}</p>
      <p><b>Customer:</b> ${order.name} (${order.email})</p>
      <p><b>Total:</b> ${formatMoney(order.total, symbol)} ${currency}</p>
      <p><b>Method:</b> ${order.method || '—'} (${order.channel || '—'})</p>
      <ul>${emailItems.map((i) => `<li>${i.title} — ${i.license}</li>`).join('')}</ul></div>`,
    kind: 'admin_notice',
  });

  return { ok: result.ok, mode: result.mode, items: items.length };
}
