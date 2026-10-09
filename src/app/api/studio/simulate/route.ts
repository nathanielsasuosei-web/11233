import { NextResponse } from 'next/server';
import { paystackMode } from '@/lib/paystack';
import { completeBooking } from '@/lib/complete';
import { absoluteUrl } from '@/lib/fulfill';
import { getBookingByRef } from '@/lib/studio';

/**
 * Demo-mode deposit confirmation. Only live while no Paystack keys are set, so
 * it can never mark a real booking as paid.
 */
export async function POST(req: Request) {
  if (paystackMode() !== 'demo') {
    return NextResponse.json(
      { error: 'Simulated payments are disabled while Paystack keys are configured.' },
      { status: 403 },
    );
  }

  const { reference, channel } = (await req.json().catch(() => ({}))) as {
    reference?: string;
    channel?: string;
  };
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  const booking = getBookingByRef(reference);
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const result = await completeBooking(reference, (p) => absoluteUrl(req, p), {
    force: true,
    channel: channel || 'demo',
  });

  return NextResponse.json(result);
}
