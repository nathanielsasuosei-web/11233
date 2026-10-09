import { NextResponse } from 'next/server';
import { paystackMode } from '@/lib/paystack';
import { initializeTransaction } from '@/lib/paystack';
import { getSetting } from '@/lib/db';
import { getBookingByRef, releaseStaleHolds } from '@/lib/studio';

/**
 * Restart the deposit payment for a booking that is still on hold — used by the
 * artist's booking page when they walked away from the Paystack screen.
 */
export async function POST(req: Request) {
  const { reference } = (await req.json().catch(() => ({}))) as { reference?: string };
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  releaseStaleHolds();
  const booking = getBookingByRef(reference);
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'The deposit for this booking is already settled.' }, { status: 409 });
  }

  const origin = new URL(req.url).origin;
  const callbackUrl = `${origin}/studio/confirm?reference=${encodeURIComponent(booking.reference)}`;

  if (paystackMode() === 'demo') {
    return NextResponse.json({ ok: true, authorization_url: `${callbackUrl}&simulate=1`, demo: true });
  }

  try {
    const init = await initializeTransaction({
      email: booking.email,
      amount: booking.deposit,
      currency: getSetting('currency') || 'GHS',
      reference: booking.reference,
      callbackUrl,
      metadata: { booking_id: booking.id, kind: 'studio_deposit', retry: true },
      channels: ['mobile_money', 'bank', 'card'],
    });
    return NextResponse.json({ ok: true, authorization_url: init.authorization_url, demo: false });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Could not start payment' }, { status: 502 });
  }
}
