import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSetting } from '@/lib/db';
import { bookingPendingEmail, sendEmail } from '@/lib/mailer';
import { readSession } from '@/lib/auth';
import { initializeTransaction, paystackMode } from '@/lib/paystack';
import { formatMoney } from '@/lib/utils';
import {
  availability,
  createBooking,
  depositPercent,
  isClosedDay,
  listStudioServices,
  releaseStaleHolds,
  slotInPast,
  toMinutes,
  getStudioService,
} from '@/lib/studio';

const Schema = z.object({
  serviceId: z.number().int().positive(),
  hours: z.number().int().min(1).max(12),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Pick a start time'),
  name: z.string().min(2, 'Tell us who is coming in'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(7, 'A phone number the engineer can call'),
  notes: z.string().max(900).optional().default(''),
  method: z.enum(['mobile_money', 'bank', 'card']).default('mobile_money'),
  payPhone: z.string().max(40).optional().default(''),
  holdOnly: z.boolean().optional().default(false),
});

/**
 * Creates a booking and charges the deposit (half by default). The slot is held
 * as `pending` while the payment runs, so nobody else can grab it mid-checkout.
 */
export async function POST(req: Request) {
  if (!getSetting('studio_bookable') || getSetting('studio_bookable') === '0') {
    return NextResponse.json({ error: 'Studio bookings are closed right now.' }, { status: 403 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Check the booking details' },
      { status: 400 },
    );
  }
  const input = parsed.data;

  releaseStaleHolds();

  const service = listStudioServices().find((s) => s.id === input.serviceId) || getStudioService(input.serviceId);
  if (!service || service.published === 0) {
    return NextResponse.json({ error: 'That service is not bookable' }, { status: 400 });
  }
  if (!service.price_per_hour) {
    return NextResponse.json({ error: 'This service has no rate set yet — message the studio' }, { status: 409 });
  }
  if (input.hours < service.min_hours || input.hours > service.max_hours) {
    return NextResponse.json(
      { error: `${service.title} sessions run ${service.min_hours}–${service.max_hours} hours` },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  if (input.date < today) {
    return NextResponse.json({ error: 'Pick a date from today onwards' }, { status: 400 });
  }
  if (isClosedDay(input.date)) {
    return NextResponse.json({ error: 'The studio is closed that day' }, { status: 409 });
  }
  const day = availability(input.date, input.hours);
  const slot = day.slots.find((s) => s.time === input.start);
  if (!slot) {
    return NextResponse.json({ error: 'That start time is outside our opening hours' }, { status: 400 });
  }
  if (slotInPast(input.date, input.start)) {
    return NextResponse.json({ error: 'That start time is too soon — pick a later slot' }, { status: 409 });
  }
  if (!slot.free) {
    return NextResponse.json(
      { error: 'Someone just took that slot. Try the next free time.' },
      { status: 409 },
    );
  }
  if (toMinutes(input.start) + input.hours * 60 > Number(getSetting('studio_close_hour') || 18) * 60) {
    return NextResponse.json({ error: 'That session runs past closing time' }, { status: 400 });
  }

  const session = await readSession();
  const booking = createBooking({
    service,
    hours: input.hours,
    date: input.date,
    start: input.start,
    name: input.name,
    email: input.email,
    phone: input.phone,
    notes: input.notes,
    userId: session && session.role === 'artist' ? Number(session.sub) : null,
    method:
      input.method === 'mobile_money'
        ? 'Mobile Money'
        : input.method === 'bank'
          ? 'Bank Transfer'
          : 'Card',
    payPhone: input.payPhone,
  });

  const origin = new URL(req.url).origin;
  const confirmUrl = `${origin}/studio/confirm?reference=${encodeURIComponent(booking.reference)}`;

  // "Hold my slot" — no payment yet; the producer confirms manually.
  if (input.holdOnly || paystackMode() === 'demo') {
    if (input.holdOnly) {
      const symbol = getSetting('currency_symbol') || 'GH₵';
      await sendEmail({
        to: input.email,
        subject: `Slot held — ${service.title} ${input.date} ${input.start}`,
        html: bookingPendingEmail({
          name: input.name,
          reference: booking.reference,
          service: service.title,
          date: input.date,
          start: input.start,
          hours: input.hours,
          deposit: formatMoney(booking.deposit, symbol),
          total: formatMoney(booking.price, symbol),
          payUrl: `${origin}/studio/booking/${booking.reference}`,
        }),
        kind: 'booking_pending',
      });
      await sendEmail({
        to: getSetting('support_email') || input.email,
        subject: `Hold on ${input.date} ${input.start} — ${input.name} (${booking.reference})`,
        html: `<div style="font-family:sans-serif"><h2>Someone is holding a slot</h2>
          <p>${input.name} asked to hold ${input.hours}h of ${service.title} on ${input.date} at ${input.start} and pay the ${formatMoney(booking.deposit, symbol)} deposit at the studio. Total ${formatMoney(booking.price, symbol)}.</p>
          <p>The slot stays blocked for other artists until you confirm it or the hold expires.</p>
          <p>${input.phone ? `<b>Phone:</b> ${input.phone}<br>` : ''}${input.notes ? `<b>Notes:</b> ${input.notes}` : ''}</p>
          <p><a href="${origin}/admin/bookings">Confirm it in the booking calendar</a></p></div>`,
        kind: 'admin_notice',
      });
    }
    return NextResponse.json({
      ok: true,
      reference: booking.reference,
      deposit: booking.deposit,
      balance: booking.balance,
      depositPercent: depositPercent(),
      demo: paystackMode() === 'demo',
      // The confirm page decides whether to verify or offer the demo approval,
      // so both paths land on the same clean link.
      authorization_url: confirmUrl,
    });
  }

  try {
    const init = await initializeTransaction({
      email: input.email,
      amount: booking.deposit,
      currency: getSetting('currency') || 'GHS',
      reference: booking.reference,
      callbackUrl: confirmUrl,
      metadata: {
        booking_id: booking.id,
        kind: 'studio_deposit',
        method: input.method,
      },
      channels:
        input.method === 'mobile_money' ? ['mobile_money'] : input.method === 'bank' ? ['bank'] : ['card'],
    });
    return NextResponse.json({
      ok: true,
      reference: booking.reference,
      authorization_url: init.authorization_url,
      deposit: booking.deposit,
      balance: booking.balance,
      depositPercent: depositPercent(),
      demo: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Could not start the deposit payment', reference: booking.reference },
      { status: 502 },
    );
  }
}
