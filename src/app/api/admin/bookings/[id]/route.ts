import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { completeBooking } from '@/lib/complete';
import { fallbackUrl } from '@/lib/fulfill';
import {
  bookingCancelledEmail,
  bookingReceiptEmail,
  sendEmail,
} from '@/lib/mailer';
import { getBookingById, setBookingStatus } from '@/lib/studio';
import { formatMoney } from '@/lib/utils';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const id = Number(ctx.params.id);
  const { action, refund, reason } = (await req.json().catch(() => ({}))) as {
    action?: string;
    refund?: string;
    reason?: string;
  };
  const booking = getBookingById(id);
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const symbol = getSetting('currency_symbol') || 'GH₵';
  const paid = ['deposit_paid', 'confirmed', 'completed'].includes(booking.status);

  if (action === 'mark-paid') {
    if (paid) return NextResponse.json({ ok: true, status: booking.status });
    const result = await completeBooking(booking.reference, (p) => fallbackUrl(p), {
      force: true,
      channel: 'offline',
    });
    return NextResponse.json({ ok: result.ok, status: result.status, error: result.error });
  }

  if (action === 'resend') {
    await sendEmail({
      to: booking.email,
      subject: `Your ${booking.service_title} session — ${booking.session_date} ${booking.start_time}`,
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
        method: booking.method || 'Mobile Money',
        address: getSetting('studio_address'),
        policy: getSetting('studio_policy'),
        manageUrl: fallbackUrl(`/studio/booking/${booking.reference}`),
      }),
      kind: 'booking_receipt',
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'complete') {
    setBookingStatus(id, 'completed', reason || '');
    await sendEmail({
      to: booking.email,
      subject: `Session done — ${booking.reference}`,
      html: bookingCancelledEmail({
        name: booking.name,
        reference: booking.reference,
        service: booking.service_title,
        date: booking.session_date,
        start: booking.start_time,
        reason: 'Marked complete by the studio. Anything you want re-cut or mixed down, just reply to this email.',
        depositState: `Balance settled — ${formatMoney(booking.price, symbol)} paid in total.`,
      }),
      kind: 'booking_cancelled',
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'cancel' || action === 'refund') {
    const refunding = action === 'refund' || refund === '1';
    setBookingStatus(
      id,
      refunding ? 'refunded' : 'cancelled',
      reason || (refunding ? 'Deposit returned' : 'Cancelled by the studio'),
    );
    await sendEmail({
      to: booking.email,
      subject: `Booking ${booking.reference} ${refunding ? 'cancelled — deposit returned' : 'cancelled'}`,
      html: bookingCancelledEmail({
        name: booking.name,
        reference: booking.reference,
        service: booking.service_title,
        date: booking.session_date,
        start: booking.start_time,
        reason: reason || 'Cancelled by the studio',
        depositState: refunding
          ? `${formatMoney(booking.deposit, symbol)} is on its way back to the number you paid from.`
          : booking.status === 'pending'
            ? 'Nothing was charged.'
            : `${formatMoney(booking.deposit, symbol)} deposit retained under the 24-hour reschedule policy.`,
      }),
      kind: 'booking_cancelled',
    });

    if (refunding) {
      await sendEmail({
        to: getSetting('support_email') || booking.email,
        subject: `Refund issued for booking ${booking.reference}`,
        html: `<div style="font-family:sans-serif"><h2>Deposit returned</h2>
          <p><b>${booking.name}</b> · ${booking.service_title} on ${booking.session_date} ${booking.start_time}</p>
          <p><b>Refunded:</b> ${formatMoney(booking.deposit, symbol)}</p>
          <p><b>Slot released:</b> the calendar is open again for that time.</p></div>`,
        kind: 'admin_notice',
      });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
