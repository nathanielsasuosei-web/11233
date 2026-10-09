import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { completeBooking, completeOrder } from '@/lib/complete';
import { fallbackUrl } from '@/lib/fulfill';

/**
 * Paystack signs webhooks with your secret key (HMAC-SHA512).
 * In demo mode this endpoint is a no-op.
 */
export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ received: true, demo: true });

  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(raw || '{}');
  if (event?.event === 'charge.success') {
    const reference = event?.data?.reference;
    if (reference) {
      // Studio deposits use a BK- reference; beat orders use BV-.
      if (String(reference).startsWith('BK-')) {
        await completeBooking(reference, fallbackUrl, { channel: event?.data?.channel });
      } else {
        await completeOrder(reference, fallbackUrl, { channel: event?.data?.channel });
      }
    }
  }

  return NextResponse.json({ received: true });
}
