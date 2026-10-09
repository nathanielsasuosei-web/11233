import { all, get, getSetting, run } from './db';
import { verifyTransaction } from './paystack';
import { fulfillOrder } from './fulfill';
import { bookingReceiptEmail, sendEmail } from './mailer';
import { markBookingPaid, getBookingByRef, releaseStaleHolds, BOOKING_PAID } from './studio';
import { formatMoney } from './utils';

export type CompleteResult = {
  ok: boolean;
  status: string;
  reference: string;
  error?: string;
};

/**
 * Verifies a payment with the provider (or accepts it in demo mode), marks the
 * order paid, retires exclusively-sold beats, and emails the files.
 * Idempotent: calling it twice will not send the delivery email twice.
 */
export async function completeOrder(
  reference: string,
  base: (p: string) => string,
  opts: { force?: boolean; channel?: string } = {},
): Promise<CompleteResult> {
  const order = get<any>('SELECT * FROM orders WHERE reference = ?', [reference]);
  if (!order) return { ok: false, status: 'not_found', reference, error: 'Order not found' };

  if (order.status === 'paid') {
    return { ok: true, status: 'paid', reference };
  }

  let method = order.method;
  let channel = opts.channel || order.channel;
  let success = Boolean(opts.force);

  if (!opts.force) {
    const v = await verifyTransaction(reference);
    success = v.success;
    channel = v.channel || channel;
    method = v.method || method;
  }

  if (!success) {
    run("UPDATE orders SET status = 'failed' WHERE id = ?", [order.id]);
    return { ok: false, status: 'failed', reference, error: 'Payment not completed' };
  }

  const paidAt = new Date().toISOString();
  run(
    `UPDATE orders SET status = 'paid', paid_at = ?, method = ?, channel = ?, provider_ref = ?
     WHERE id = ?`,
    [paidAt, method, channel, channel, order.id],
  );

  const items = all<any>('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

  for (const it of items) {
    run('UPDATE beats SET sales = sales + 1 WHERE id = ?', [it.beat_id]);
    // Exclusive / buyout purchases retire the beat from the store.
    if (/exclusive|buyout/i.test(it.license)) {
      run("UPDATE beats SET status = 'sold', featured = 0 WHERE id = ?", [it.beat_id]);
    }
  }

  await fulfillOrder(order.id, base);

  return { ok: true, status: 'paid', reference };
}


/* ------------------------------------------------------------------ */
/* Studio bookings                                                     */
/* ------------------------------------------------------------------ */

export type BookingResult = CompleteResult & { booking?: any };

/**
 * Confirms a studio booking once its deposit clears: the slot stops being a
 * hold, the artist gets a receipt with the balance owed at the studio, and the
 * producer gets a line in today's schedule. Idempotent.
 */
export async function completeBooking(
  reference: string,
  base: (p: string) => string,
  opts: { force?: boolean; channel?: string } = {},
): Promise<BookingResult> {
  releaseStaleHolds();
  const booking = getBookingByRef(reference);
  if (!booking) return { ok: false, status: 'not_found', reference, error: 'Booking not found' };

  if (booking.status !== 'pending') {
    return {
      ok: booking.status === BOOKING_PAID || booking.status === 'confirmed' || booking.status === 'completed',
      status: booking.status,
      reference,
      booking,
    };
  }

  let method = booking.method;
  let channel = opts.channel || booking.channel;
  let success = Boolean(opts.force);

  if (!opts.force) {
    const v = await verifyTransaction(reference);
    success = v.success;
    channel = v.channel || channel;
    method = v.method || method;
  }

  if (!success) {
    return { ok: false, status: 'pending', reference, error: 'Deposit not completed', booking };
  }

  markBookingPaid(booking.id, { method, channel });
  const symbol = getSetting('currency_symbol') || 'GH₵';

  await sendEmail({
    to: booking.email,
    subject: `Studio slot locked — ${booking.service_title}, ${booking.session_date} ${booking.start_time}`,
    html: bookingReceiptEmail({
      name: booking.name,
      reference: booking.reference,
      service: booking.service_title,
      date: booking.session_date,
      start: booking.start_time,
      end: booking.end_time,
      hours: booking.hours,
      total: formatMoney(booking.price, symbol),
      deposit: formatMoney(booking.deposit, symbol),
      balance: formatMoney(booking.balance, symbol),
      method: method || 'Mobile Money',
      address: getSetting('studio_address'),
      policy: getSetting('studio_policy'),
      manageUrl: base(`/studio/booking/${booking.reference}`),
    }),
    kind: 'booking_receipt',
  });

  await sendEmail({
    to: getSetting('support_email') || booking.email,
    subject: `New booking ${booking.reference} — ${booking.service_title} ${booking.session_date} ${booking.start_time}`,
    html: `<div style="font-family:sans-serif"><h2>Deposit paid — slot is yours to keep</h2>
      <p><b>Artist:</b> ${booking.name} (${booking.email})${booking.phone ? ` · ${booking.phone}` : ''}</p>
      <p><b>Session:</b> ${booking.hours}h of ${booking.service_title} on ${booking.session_date} ${booking.start_time}–${booking.end_time}</p>
      <p><b>Deposit received:</b> ${formatMoney(booking.deposit, symbol)} of ${formatMoney(booking.price, symbol)}</p>
      <p><b>Balance due at the studio:</b> ${formatMoney(booking.balance, symbol)}</p>
      ${booking.notes ? `<p><b>Notes:</b> ${booking.notes}</p>` : ''}
      <p><a href="${base(`/admin/bookings`)}">Open the booking calendar</a></p></div>`,
    kind: 'admin_notice',
  });

  return { ok: true, status: BOOKING_PAID, reference, booking: { ...booking, status: BOOKING_PAID } };
}
