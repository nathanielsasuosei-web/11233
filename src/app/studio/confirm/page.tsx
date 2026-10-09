import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Reveal from '@/components/Reveal';
import StudioSimulateClient from '@/components/StudioSimulateClient';
import BookingReceipt from '@/components/BookingReceipt';
import { completeBooking } from '@/lib/complete';
import { getSetting } from '@/lib/db';
import { paystackMode } from '@/lib/paystack';
import { getBookingByRef } from '@/lib/studio';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your studio booking — Project 1' };

export default async function StudioConfirmPage({
  searchParams,
}: {
  searchParams: { reference?: string; simulate?: string };
}) {
  const reference = searchParams.reference;
  if (!reference) redirect('/studio');

  const demo = paystackMode() === 'demo';
  let booking = getBookingByRef(reference);
  if (!booking) notFound();

  // Paystack has just sent the artist back here — verify the deposit once.
  if (!demo && !searchParams.simulate && booking.status === 'pending') {
    const h = headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const base = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
    await completeBooking(reference, (p) => `${base}${p}`);
    booking = getBookingByRef(reference) || booking;
  }

  const paid = booking.status !== 'pending';

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-[28px] border border-brand-500/25 bg-gradient-to-br from-brand-950 via-ink-900 to-ink-900 px-6 py-10 text-center sm:px-12">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-600/25 blur-[80px]" />
            <div
              className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-2xl ${
                paid
                  ? 'bg-brand-500 text-white shadow-[0_0_50px_-8px_rgba(255,45,58,.9)]'
                  : 'border border-amber-500/40 bg-amber-500/10 text-amber-200'
              }`}
            >
              {paid ? '✓' : '⏳'}
            </div>
            <h1 className="display mt-6 text-[clamp(1.8rem,4.6vw,2.8rem)] text-white">
              {paid ? 'SLOT ' : 'ALMOST '}
              <span className="text-brand-500">{paid ? 'LOCKED' : 'YOURS'}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/55">
              {paid
                ? `Your deposit is in, so ${booking.session_date} at ${booking.start_time} is off the calendar for everyone else. Bring the rest to the studio.`
                : 'We are holding this slot for a few minutes while the deposit clears. Finish the payment and the confirmation email goes out straight away.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
              <span>Ref {booking.reference}</span>
              <span>·</span>
              <span>{getSetting('studio_name')}</span>
            </div>
          </div>

          {demo && !paid && (
            <div className="mt-6">
              <StudioSimulateClient booking={booking} />
            </div>
          )}

          {!paid && !demo && (
            <div className="card mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <div className="text-[13px] font-bold text-white">Deposit not confirmed yet</div>
                <p className="mt-1 text-[12px] text-white/45">
                  Nothing was charged. Retry the payment or message the studio and we will sort a
                  time out.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href="/studio" className="btn-red !px-5 !py-2.5 text-xs">
                  Book again
                </Link>
                <Link href="/contact" className="btn-ghost !px-5 !py-2.5 text-xs">
                  Contact studio
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8">
            <BookingReceipt booking={booking} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/beats" className="btn-ghost !px-6 !py-3 text-xs">
              Browse beats for the session →
            </Link>
            <Link href="/dashboard/studio" className="btn-ghost !px-6 !py-3 text-xs">
              My bookings
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
