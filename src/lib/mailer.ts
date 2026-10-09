/**
 * Transactional email.
 *
 * Uses SMTP (nodemailer) when SMTP_HOST is configured. Otherwise every message is
 * still composed and stored in the `email_log` table so it can be read in the
 * admin "Outbox" — the app stays fully usable without credentials.
 */
import nodemailer from 'nodemailer';
import { run, getSetting } from './db';

export type EmailKind =
  | 'beat_delivery'
  | 'order_receipt'
  | 'welcome'
  | 'contact'
  | 'message_reply'
  | 'broadcast'
  | 'admin_notice';

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export type SendResult = { ok: boolean; mode: 'smtp' | 'outbox'; error?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  kind?: EmailKind;
}): Promise<SendResult> {
  const kind = opts.kind ?? 'general';
  const from = process.env.EMAIL_FROM || getSetting('email_from');

  if (!smtpConfigured()) {
    run(
      'INSERT INTO email_log (to_email, subject, body, kind, status) VALUES (?,?,?,?,?)',
      [opts.to, opts.subject, opts.html, kind, 'outbox'],
    );
    return { ok: true, mode: 'outbox' };
  }

  try {
    await transporter().sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
    run(
      'INSERT INTO email_log (to_email, subject, body, kind, status) VALUES (?,?,?,?,?)',
      [opts.to, opts.subject, opts.html, kind, 'sent'],
    );
    return { ok: true, mode: 'smtp' };
  } catch (err: any) {
    run(
      'INSERT INTO email_log (to_email, subject, body, kind, status, error) VALUES (?,?,?,?,?,?)',
      [opts.to, opts.subject, opts.html, kind, 'failed', String(err?.message || err)],
    );
    return { ok: false, mode: 'smtp', error: String(err?.message || err) };
  }
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export function escapeHtml(s: string) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

function shell(opts: { title: string; body: string; preheader?: string }) {
  const studio = getSetting('studio_name') || 'PROJECT 1';
  const producer = getSetting('producer_name') || '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#0b0b0d;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f5f5f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader || '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#121216;border:1px solid #26262e;border-radius:18px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#ff2d3a,#8f1020);padding:26px 32px;">
  <div style="font-size:26px;font-weight:900;letter-spacing:.14em;color:#fff;">${escapeHtml(studio)}</div>
  <div style="font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:rgba(255,255,255,.75);margin-top:6px;">${escapeHtml(producer)}</div>
</td></tr>
<tr><td style="padding:32px;">
  ${opts.body}
</td></tr>
<tr><td style="padding:20px 32px 30px;border-top:1px solid #26262e;color:#8a8a95;font-size:12px;line-height:1.7;">
  Sent by ${escapeHtml(studio)} · ${escapeHtml(getSetting('support_email') || '')}<br>
  You are receiving this because you have an account or made a purchase on our store.
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<div style="margin:28px 0;"><a href="${href}" style="background:#ff2d3a;color:#fff;text-decoration:none;padding:15px 30px;border-radius:999px;font-weight:700;font-size:15px;display:inline-block;letter-spacing:.04em;">${escapeHtml(label)}</a></div>
  <div style="font-size:12px;color:#8a8a95;">If the button does not work, copy this link:<br><a href="${href}" style="color:#ff6467;word-break:break-all;">${href}</a></div>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 14px;font-size:24px;line-height:1.3;color:#fff;">${text}</h1>`;
}
function p(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#c9c9d2;">${text}</p>`;
}

function metaTable(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border:1px solid #26262e;border-radius:12px;overflow:hidden;">
  ${rows
    .map(
      ([k, v], i) =>
        `<tr style="background:${i % 2 ? '#16161b' : '#1a1a20'};">
      <td style="padding:11px 16px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#8a8a95;width:38%;">${escapeHtml(k)}</td>
      <td style="padding:11px 16px;font-size:14px;color:#fff;font-weight:600;">${v}</td>
    </tr>`,
    )
    .join('')}
  </table>`;
}

export function beatDeliveryEmail(opts: {
  name: string;
  orderRef: string;
  items: { title: string; license: string; price: string; downloadUrl: string }[];
  total: string;
  method: string;
}) {
  const studio = getSetting('studio_name');
  const rows = opts.items
    .map(
      (it) =>
        `<tr><td style="padding:20px 0;border-bottom:1px solid #26262e;">
      <div style="font-size:17px;font-weight:800;color:#fff;">${escapeHtml(it.title)}</div>
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#ff6467;margin-top:5px;">${escapeHtml(it.license)} · ${escapeHtml(it.price)}</div>
      ${button(it.downloadUrl, `Download ${escapeHtml(it.title)}`)}
    </td></tr>`,
    )
    .join('');

  const body = `${h1(`Your beats are ready, ${escapeHtml(opts.name.split(' ')[0])} 🔥`)}
  ${p(`Payment confirmed. Thank you for buying from <strong>${escapeHtml(studio)}</strong>. Your download links are below — they are unique to you and expire after 5 downloads or 30 days, whichever comes first.`)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  ${metaTable([
    ['Order reference', escapeHtml(opts.orderRef)],
    ['Total paid', escapeHtml(opts.total)],
    ['Payment method', escapeHtml(opts.method)],
  ])}
  ${p(`Keep the reference above for your records. Need a custom mix, stems or a revision? Just reply to this email.`)}`;

  return shell({
    title: `Your ${studio} downloads`,
    preheader: 'Your beat download links are inside.',
    body,
  });
}

export function welcomeEmail(name: string) {
  const studio = getSetting('studio_name');
  return shell({
    title: `Welcome to ${studio}`,
    preheader: 'Your artist account is live.',
    body: `${h1(`Welcome aboard, ${escapeHtml(name.split(' ')[0])} 👋`)}
    ${p(`Your ${escapeHtml(studio)} artist account is live. You can now buy beats, keep every download in one library, and message the producer directly.`)}
    ${button(process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/beats` : '/beats', 'Browse the beat catalogue')}`,
  });
}

export function contactNotification(m: { name: string; email: string; subject: string; body: string }) {
  return shell({
    title: `New message: ${m.subject}`,
    body: `${h1('New message from the website')}
    ${metaTable([
      ['From', escapeHtml(m.name)],
      ['Email', escapeHtml(m.email)],
      ['Subject', escapeHtml(m.subject)],
    ])}
    <div style="background:#16161b;border:1px solid #26262e;border-radius:12px;padding:18px;font-size:15px;line-height:1.75;color:#c9c9d2;white-space:pre-wrap;">${escapeHtml(m.body)}</div>`,
  });
}

export function replyEmail(opts: { name: string; subject: string; reply: string; original: string }) {
  return shell({
    title: `Re: ${opts.subject}`,
    body: `${h1(`Reply from ${escapeHtml(getSetting('producer_name'))}`)}
    <div style="background:#16161b;border-left:3px solid #ff2d3a;border-radius:8px;padding:18px;font-size:15px;line-height:1.75;color:#fff;white-space:pre-wrap;">${escapeHtml(opts.reply)}</div>
    <div style="margin-top:26px;font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#8a8a95;">Your original message</div>
    <div style="margin-top:8px;font-size:14px;line-height:1.7;color:#8a8a95;white-space:pre-wrap;">${escapeHtml(opts.original)}</div>`,
  });
}
