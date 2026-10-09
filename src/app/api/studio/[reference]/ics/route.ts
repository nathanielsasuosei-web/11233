import { NextResponse } from 'next/server';
import { getBookingByRef } from '@/lib/studio';
import { getSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * .ics file for a booked session. The booking reference is the capability — an
 * artist can add their session to any calendar without an account.
 */
export async function GET(_req: Request, ctx: { params: { reference: string } }) {
  const booking = getBookingByRef(ctx.params.reference);
  if (!booking) return new NextResponse('Not found', { status: 404 });
  if (booking.status === 'cancelled' || booking.status === 'expired' || booking.status === 'refunded') {
    return new NextResponse('This booking is no longer active.', { status: 410 });
  }

  const [y, m, d] = booking.session_date.split('-').map(Number);
  const [sh, sm] = booking.start_time.split(':').map(Number);
  const [eh, em] = booking.end_time.split(':').map(Number);
  const stamp = new Date();
  const dtstamp = `${stamp.getUTCFullYear()}${pad(stamp.getUTCMonth() + 1)}${pad(stamp.getUTCDate())}T${pad(
    stamp.getUTCHours(),
  )}${pad(stamp.getUTCMinutes())}${pad(stamp.getUTCSeconds())}Z`;

  const fold = (text: string) =>
    text.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

  const symbol = getSetting('currency_symbol') || 'GH₵';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Project 1//Studio bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.reference}@beatvault`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${y}${pad(m)}${pad(d)}T${pad(sh)}${pad(sm)}00`,
    `DTEND:${y}${pad(m)}${pad(d)}T${pad(eh)}${pad(em)}00`,
    fold(`SUMMARY:${booking.service_title} session — ${booking.name}`),
    fold(`LOCATION:${getSetting('studio_address')}`),
    fold(
      `DESCRIPTION:Booking ${booking.reference}\n${booking.hours}h of ${booking.service_title}\nDeposit paid ${symbol}${(
        booking.deposit / 100
      ).toFixed(2)}\nBalance due at the studio ${symbol}${(booking.balance / 100).toFixed(2)}\n${getSetting(
        'studio_policy',
      )}`,
    ),
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    fold(`DESCRIPTION:Studio session in 2 hours — ${booking.service_title}`),
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="studio-${booking.reference}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
