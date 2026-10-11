import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSetting } from '@/lib/db';
import { absoluteUrl } from '@/lib/fulfill';
import { sendWhatsAppToProducer, upsertWebsiteMessage } from '@/lib/whatsapp';

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  const studio = getSetting('studio_name') || 'PROJECT 1';
  const producer = getSetting('producer_name') || 'Producer';
  const ref = `BK-TEST-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  const origin = absoluteUrl(req, '');

  const message = [
    `🎙️ *TEST BOOKING & ORDER ALERT — ${studio}*`,
    `*Producer:* ${producer}`,
    `*Reference:* ${ref}`,
    `*Status:* Website Inbox + WhatsApp Connected ✅`,
    `*Dashboard:* ${origin}/admin/messages`,
  ].join('\n');

  const wa = await sendWhatsAppToProducer({
    message,
    kind: 'test',
    reference: ref,
  });

  upsertWebsiteMessage({
    name: studio,
    email: getSetting('support_email') || 'hello@beatvault.gh',
    phone: wa.toPhone,
    subject: `🎙️ Test Booking & WhatsApp Alert — ${ref}`,
    body: message,
    kind: 'booking',
    reference: ref,
    whatsappUrl: wa.whatsappUrl,
  });

  return NextResponse.json({
    ok: wa.ok,
    mode: wa.mode,
    whatsapp_url: wa.whatsappUrl,
    to_phone: wa.toPhone,
    error: wa.error,
  });
}
