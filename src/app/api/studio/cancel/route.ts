import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';
import { readSession } from '@/lib/auth';
import { sendEmail, bookingCancelledEmail } from '@/lib/mailer';
import { getBookingByRef, setBookingStatus } from '@/lib/studio';

/**
 * Releases a slot that has not been paid for. Once a deposit is down the
 * producer handles cancellation — the money has to be refunded or moved.
 */
export async function POST(req: Request) {
  const { reference } = (await req.json().catch(() => ({}))) as { reference?: string };
  const booking = reference ? getBookingByRef(reference) : undefined;
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  if (booking.status !== 'pending') {
    return NextResponse.json(
      { error: 'This deposit is already taken — message the producer to move the session.' },
      { status: 409 },
    );
  }

  const session = await readSession();
  const mine =
    (session && Number(session.sub) === Number(booking.user_id)) ||
    (session && session.email?.toLowerCase() === String(booking.email).toLowerCase()) ||
    (!booking.user_id && !session);
  if (!mine) {
    return NextResponse.json({ error: 'Only the artist who booked can release this slot.' }, { status: 403 });
  }

  setBookingStatus(booking.id, 'cancelled', 'Released by the artist before paying the deposit');

  await sendEmail({
    to: booking.email,
    subject: `Studio slot released — ${booking.reference}`,
    html: bookingCancelledEmail({
      name: booking.name,
      reference: booking.reference,
      service: booking.service_title,
      date: booking.session_date,
      start: booking.start_time,
      reason: 'Released before the deposit was paid.',
      depositState: 'Nothing was charged.',
    }),
    kind: 'booking_cancelled',
  });

  await sendEmail({
    to: getSetting('support_email') || booking.email,
    subject: `Booking released — ${booking.reference} (${booking.session_date} ${booking.start_time})`,
    html: `<div style="font-family:sans-serif"><h2>Slot is back on the calendar</h2>
      <p>${booking.name} released <b>${booking.service_title}</b> on ${booking.session_date} at ${booking.start_time} without paying the deposit.</p></div>`,
    kind: 'admin_notice',
  });

  return NextResponse.json({ ok: true });
}
