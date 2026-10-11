/**
 * Producer Website Inbox + Direct WhatsApp notifications for Bookings, Orders & Enquiries.
 *
 * Works in two complementary ways:
 * 1. Website Inbox (`messages` table) — every studio booking and beat order is
 *    delivered straight to the producer's in-app Messages inbox (`/admin/messages`)
 *    and dashboard (`/admin`).
 * 2. Producer's WhatsApp Straight — builds a pre-filled `https://wa.me/<number>`
 *    link for instant 1-tap / auto-open WhatsApp delivery AND dispatches automatically
 *    in the background when Meta Cloud API, CallMeBot, or a WhatsApp Webhook is set.
 *    Every notification is also recorded in `whatsapp_log`.
 */
import { all, get, getSetting, run } from './db';
import { buildWhatsAppUrl, formatMoney, LICENSES, normalizeWhatsAppPhone } from './utils';

export { buildWhatsAppUrl, normalizeWhatsAppPhone };

export type WhatsAppMode = 'cloud' | 'callmebot' | 'webhook' | 'wa.me';

export function whatsappEnabled() {
  return getSetting('whatsapp_enabled') !== '0';
}

export function whatsappAutoOpen() {
  return getSetting('whatsapp_auto_open') !== '0';
}

export function producerWhatsAppRaw() {
  return (
    getSetting('whatsapp_number').trim() ||
    getSetting('studio_phone').trim() ||
    getSetting('momo_number').trim() ||
    '055 000 0000'
  );
}

export function whatsappCountryCode() {
  return (getSetting('whatsapp_country_code') || '233').replace(/\D/g, '') || '233';
}

export function producerWhatsAppDigits() {
  return normalizeWhatsAppPhone(producerWhatsAppRaw(), whatsappCountryCode());
}

export function whatsappMode(): WhatsAppMode {
  const cloudToken = process.env.WHATSAPP_ACCESS_TOKEN || getSetting('whatsapp_cloud_token');
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || getSetting('whatsapp_phone_number_id');
  if (cloudToken && phoneId) return 'cloud';

  const callmebotKey = process.env.WHATSAPP_CALLMEBOT_KEY || getSetting('whatsapp_callmebot_key');
  if (callmebotKey) return 'callmebot';

  const webhook = process.env.WHATSAPP_WEBHOOK_URL || getSetting('whatsapp_webhook_url');
  if (webhook) return 'webhook';

  return 'wa.me';
}

export function producerWhatsAppUrl(text: string) {
  return buildWhatsAppUrl(producerWhatsAppRaw(), text, whatsappCountryCode());
}

/* ------------------------------------------------------------------ */
/* Message formatting                                                  */
/* ------------------------------------------------------------------ */

export function formatBookingWhatsAppText(
  booking: {
    reference: string;
    service_title: string;
    hours: number;
    session_date: string;
    start_time: string;
    end_time: string;
    name: string;
    email: string;
    phone?: string;
    pay_phone?: string;
    notes?: string;
    price: number;
    deposit: number;
    balance: number;
    deposit_percent: number;
    status: string;
    method?: string;
  },
  opts: { manageUrl?: string; event?: 'created' | 'hold' | 'deposit_paid' } = {},
) {
  const studio = getSetting('studio_name') || 'PROJECT 1';
  const symbol = getSetting('currency_symbol') || 'GH₵';
  const paid =
    booking.status === 'deposit_paid' ||
    booking.status === 'confirmed' ||
    opts.event === 'deposit_paid';

  const statusLine = paid
    ? 'Deposit Paid — Slot Locked ✅'
    : opts.event === 'hold'
      ? 'Slot Held — Pay Deposit at Studio ⏳'
      : 'New Booking Order — Deposit Pending ⏳';

  const artistPhone = booking.phone || booking.pay_phone || '—';

  const lines = [
    `🎙️ *STUDIO BOOKING ORDER — ${studio}*`,
    `*Status:* ${statusLine}`,
    `*Reference:* ${booking.reference}`,
    `*Service:* ${booking.service_title} (${booking.hours} hr${booking.hours === 1 ? '' : 's'})`,
    `*Date & Time:* ${booking.session_date} · ${booking.start_time}–${booking.end_time}`,
    `*Artist:* ${booking.name}`,
    `*Phone / WhatsApp:* ${artistPhone}`,
    `*Email:* ${booking.email}`,
    `*Session Total:* ${formatMoney(booking.price, symbol)}`,
    `*Deposit (${booking.deposit_percent || 50}%):* ${formatMoney(booking.deposit, symbol)}`,
    `*Balance at Studio:* ${formatMoney(booking.balance, symbol)}`,
    `*Payment Method:* ${booking.method || 'Mobile Money'}`,
  ];

  if (booking.notes && booking.notes.trim()) {
    lines.push(`*Notes:* ${booking.notes.trim()}`);
  }
  if (opts.manageUrl) {
    lines.push(`*Booking Link:* ${opts.manageUrl}`);
  }

  return lines.join('\n');
}

export function formatOrderWhatsAppText(
  order: {
    reference: string;
    name?: string;
    artist_name?: string;
    email?: string;
    pay_email?: string;
    phone?: string;
    pay_phone?: string;
    total: number;
    status: string;
    method?: string;
  },
  items: { title?: string; beat_title?: string; license: string; price: number }[],
  opts: { orderUrl?: string; event?: 'created' | 'paid' } = {},
) {
  const studio = getSetting('studio_name') || 'PROJECT 1';
  const symbol = getSetting('currency_symbol') || 'GH₵';
  const paid = order.status === 'paid' || opts.event === 'paid';
  const statusLine = paid ? 'Payment Confirmed ✅' : 'New Order Placed ⏳';
  const customerName = order.artist_name || order.name || 'Artist';
  const customerEmail = order.email || order.pay_email || '—';
  const customerPhone = order.pay_phone || order.phone || '—';

  const itemLines = items.map((it) => {
    const licName = LICENSES[it.license as keyof typeof LICENSES]?.name || it.license;
    return `• ${it.title || it.beat_title} — ${licName} (${formatMoney(it.price, symbol)})`;
  });

  const lines = [
    `🎧 *BEAT ORDER — ${studio}*`,
    `*Status:* ${statusLine}`,
    `*Reference:* ${order.reference}`,
    `*Customer:* ${customerName}`,
    `*Phone / WhatsApp:* ${customerPhone}`,
    `*Email:* ${customerEmail}`,
    `*Items:*`,
    ...(itemLines.length ? itemLines : ['• Beat order']),
    `*Total:* ${formatMoney(order.total, symbol)}`,
    `*Payment Method:* ${order.method || 'Mobile Money'}`,
  ];

  if (opts.orderUrl) {
    lines.push(`*Order Link:* ${opts.orderUrl}`);
  }

  return lines.join('\n');
}

export function bookingWhatsAppUrl(booking: any, manageUrl?: string) {
  const text = formatBookingWhatsAppText(booking, { manageUrl });
  return producerWhatsAppUrl(text);
}

export function orderWhatsAppUrl(order: any, items: any[], orderUrl?: string) {
  const text = formatOrderWhatsAppText(order, items, { orderUrl });
  return producerWhatsAppUrl(text);
}

/* ------------------------------------------------------------------ */
/* Website Inbox (`messages` table)                                    */
/* ------------------------------------------------------------------ */

export function upsertWebsiteMessage(opts: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
  userId?: number | null;
  kind: 'booking' | 'order' | 'enquiry';
  reference?: string;
  whatsappUrl?: string;
}) {
  const ref = (opts.reference || '').trim();
  const phone = (opts.phone || '').trim();
  const waUrl = (opts.whatsappUrl || '').trim();

  if (ref) {
    const existing = get<{ id: number }>(
      'SELECT id FROM messages WHERE reference = ? AND kind = ? ORDER BY id DESC LIMIT 1',
      [ref, opts.kind],
    );
    if (existing) {
      run(
        `UPDATE messages
         SET name = ?, email = ?, phone = COALESCE(NULLIF(?, ''), phone),
             subject = ?, body = ?, whatsapp_url = ?, status = 'unread',
             created_at = datetime('now')
         WHERE id = ?`,
        [opts.name, opts.email.toLowerCase().trim(), phone, opts.subject, opts.body, waUrl, existing.id],
      );
      return existing.id;
    }
  }

  const res = run(
    `INSERT INTO messages (name, email, phone, subject, body, kind, reference, whatsapp_url, user_id, status)
     VALUES (?,?,?,?,?,?,?,?,?, 'unread')`,
    [
      opts.name,
      opts.email.toLowerCase().trim(),
      phone,
      opts.subject,
      opts.body,
      opts.kind,
      ref,
      waUrl,
      opts.userId ?? null,
    ],
  );
  return res.lastInsertRowid;
}

/* ------------------------------------------------------------------ */
/* Server-side WhatsApp transport & log                                */
/* ------------------------------------------------------------------ */

export async function sendWhatsAppToProducer(opts: {
  message: string;
  kind: 'booking' | 'order' | 'enquiry' | 'test';
  reference?: string;
}): Promise<{ ok: boolean; mode: WhatsAppMode; whatsappUrl: string; toPhone: string; error?: string }> {
  const toPhone = producerWhatsAppDigits();
  const whatsappUrl = producerWhatsAppUrl(opts.message);
  const mode = whatsappMode();
  const ref = opts.reference || '';

  if (!whatsappEnabled()) {
    return { ok: true, mode: 'wa.me', whatsappUrl, toPhone };
  }

  if (mode === 'cloud') {
    const token = process.env.WHATSAPP_ACCESS_TOKEN || getSetting('whatsapp_cloud_token');
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || getSetting('whatsapp_phone_number_id');
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(phoneId)}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: { preview_url: true, body: opts.message },
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(errText.slice(0, 240));
      }
      run(
        `INSERT INTO whatsapp_log (to_phone, message, whatsapp_url, kind, reference, status, provider)
         VALUES (?,?,?,?,?,?,?)`,
        [toPhone, opts.message, whatsappUrl, opts.kind, ref, 'sent', 'cloud'],
      );
      return { ok: true, mode: 'cloud', whatsappUrl, toPhone };
    } catch (err: any) {
      const msg = String(err?.message || err);
      run(
        `INSERT INTO whatsapp_log (to_phone, message, whatsapp_url, kind, reference, status, provider, error)
         VALUES (?,?,?,?,?,?,?,?)`,
        [toPhone, opts.message, whatsappUrl, opts.kind, ref, 'failed', 'cloud', msg],
      );
      return { ok: false, mode: 'cloud', whatsappUrl, toPhone, error: msg };
    }
  }

  if (mode === 'callmebot') {
    const apiKey = process.env.WHATSAPP_CALLMEBOT_KEY || getSetting('whatsapp_callmebot_key');
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
        toPhone,
      )}&text=${encodeURIComponent(opts.message)}&apikey=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(errText.slice(0, 240));
      }
      run(
        `INSERT INTO whatsapp_log (to_phone, message, whatsapp_url, kind, reference, status, provider)
         VALUES (?,?,?,?,?,?,?)`,
        [toPhone, opts.message, whatsappUrl, opts.kind, ref, 'sent', 'callmebot'],
      );
      return { ok: true, mode: 'callmebot', whatsappUrl, toPhone };
    } catch (err: any) {
      const msg = String(err?.message || err);
      run(
        `INSERT INTO whatsapp_log (to_phone, message, whatsapp_url, kind, reference, status, provider, error)
         VALUES (?,?,?,?,?,?,?,?)`,
        [toPhone, opts.message, whatsappUrl, opts.kind, ref, 'failed', 'callmebot', msg],
      );
      return { ok: false, mode: 'callmebot', whatsappUrl, toPhone, error: msg };
    }
  }

  if (mode === 'webhook') {
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || getSetting('whatsapp_webhook_url');
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toPhone,
          phone: producerWhatsAppRaw(),
          message: opts.message,
          kind: opts.kind,
          reference: ref,
          whatsapp_url: whatsappUrl,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(errText.slice(0, 240));
      }
      run(
        `INSERT INTO whatsapp_log (to_phone, message, whatsapp_url, kind, reference, status, provider)
         VALUES (?,?,?,?,?,?,?)`,
        [toPhone, opts.message, whatsappUrl, opts.kind, ref, 'sent', 'webhook'],
      );
      return { ok: true, mode: 'webhook', whatsappUrl, toPhone };
    } catch (err: any) {
      const msg = String(err?.message || err);
      run(
        `INSERT INTO whatsapp_log (to_phone, message, whatsapp_url, kind, reference, status, provider, error)
         VALUES (?,?,?,?,?,?,?,?)`,
        [toPhone, opts.message, whatsappUrl, opts.kind, ref, 'failed', 'webhook', msg],
      );
      return { ok: false, mode: 'webhook', whatsappUrl, toPhone, error: msg };
    }
  }

  // Default zero-key mode: log the message with its direct wa.me link
  run(
    `INSERT INTO whatsapp_log (to_phone, message, whatsapp_url, kind, reference, status, provider)
     VALUES (?,?,?,?,?,?,?)`,
    [toPhone, opts.message, whatsappUrl, opts.kind, ref, 'ready', 'wa.me'],
  );
  return { ok: true, mode: 'wa.me', whatsappUrl, toPhone };
}

/* ------------------------------------------------------------------ */
/* High-level Producer Notification Orchestrators                      */
/* ------------------------------------------------------------------ */

export async function notifyProducerBooking(
  bookingIdOrRef: number | string,
  base: (p: string) => string,
  opts: { event?: 'created' | 'hold' | 'deposit_paid' } = {},
) {
  const booking =
    typeof bookingIdOrRef === 'number'
      ? get<any>('SELECT * FROM bookings WHERE id = ?', [bookingIdOrRef])
      : get<any>('SELECT * FROM bookings WHERE reference = ?', [bookingIdOrRef]);

  if (!booking) return null;

  const manageUrl = base(`/studio/booking/${booking.reference}`);
  const text = formatBookingWhatsAppText(booking, { manageUrl, event: opts.event });
  const paid =
    booking.status === 'deposit_paid' ||
    booking.status === 'confirmed' ||
    opts.event === 'deposit_paid';

  const statusTag = paid ? 'Deposit Paid' : opts.event === 'hold' ? 'Slot Held' : 'New Booking';
  const subject = `🎙️ Studio Booking [${statusTag}]: ${booking.service_title} (${booking.session_date} ${booking.start_time}) — ${booking.reference}`;

  const wa = await sendWhatsAppToProducer({
    message: text,
    kind: 'booking',
    reference: booking.reference,
  });

  upsertWebsiteMessage({
    name: booking.name,
    email: booking.email,
    phone: booking.phone || booking.pay_phone || '',
    subject,
    body: text,
    userId: booking.user_id ? Number(booking.user_id) : null,
    kind: 'booking',
    reference: booking.reference,
    whatsappUrl: wa.whatsappUrl,
  });

  return {
    whatsappUrl: wa.whatsappUrl,
    mode: wa.mode,
    subject,
    message: text,
  };
}

export async function notifyProducerOrder(
  orderIdOrRef: number | string,
  base: (p: string) => string,
  opts: { event?: 'created' | 'paid' } = {},
) {
  const order =
    typeof orderIdOrRef === 'number'
      ? get<any>(
          `SELECT o.*, u.name, u.email, u.artist_name, u.phone as user_phone
           FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
          [orderIdOrRef],
        )
      : get<any>(
          `SELECT o.*, u.name, u.email, u.artist_name, u.phone as user_phone
           FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.reference = ?`,
          [orderIdOrRef],
        );

  if (!order) return null;

  const items = all<any>(
    `SELECT oi.*, b.title FROM order_items oi LEFT JOIN beats b ON b.id = oi.beat_id WHERE oi.order_id = ?`,
    [order.id],
  );

  const symbol = getSetting('currency_symbol') || 'GH₵';
  const orderUrl = base(`/checkout/success?reference=${encodeURIComponent(order.reference)}`);
  const customerPhone = order.pay_phone || order.user_phone || '';
  const text = formatOrderWhatsAppText(
    { ...order, phone: customerPhone },
    items,
    { orderUrl, event: opts.event },
  );

  const paid = order.status === 'paid' || opts.event === 'paid';
  const statusTag = paid ? 'Paid' : 'New Order';
  const itemSummary = items.map((i) => i.title || i.beat_title).join(', ') || 'Beat Order';
  const subject = `🧾 Beat Order [${statusTag}]: ${itemSummary} (${formatMoney(order.total, symbol)}) — ${order.reference}`;

  const wa = await sendWhatsAppToProducer({
    message: text,
    kind: 'order',
    reference: order.reference,
  });

  upsertWebsiteMessage({
    name: order.artist_name || order.name || 'Artist',
    email: order.email || order.pay_email || 'artist@example.com',
    phone: customerPhone,
    subject,
    body: text,
    userId: order.user_id ? Number(order.user_id) : null,
    kind: 'order',
    reference: order.reference,
    whatsappUrl: wa.whatsappUrl,
  });

  return {
    whatsappUrl: wa.whatsappUrl,
    mode: wa.mode,
    subject,
    message: text,
  };
}

export async function notifyProducerEnquiry(input: {
  messageId?: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
}) {
  const studio = getSetting('studio_name') || 'PROJECT 1';
  const lines = [
    `✉️ *WEBSITE MESSAGE — ${studio}*`,
    `*From:* ${input.name}`,
    `*Email:* ${input.email}`,
    ...(input.phone ? [`*Phone / WhatsApp:* ${input.phone}`] : []),
    `*Subject:* ${input.subject}`,
    '',
    input.body,
  ];
  const text = lines.join('\n');

  const wa = await sendWhatsAppToProducer({
    message: text,
    kind: 'enquiry',
    reference: input.messageId ? `MSG-${input.messageId}` : '',
  });

  if (input.messageId) {
    run('UPDATE messages SET whatsapp_url = ? WHERE id = ?', [wa.whatsappUrl, input.messageId]);
  }

  return {
    whatsappUrl: wa.whatsappUrl,
    mode: wa.mode,
    message: text,
  };
}
