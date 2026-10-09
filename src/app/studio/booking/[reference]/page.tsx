import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingReceipt from '@/components/BookingReceipt';
import Reveal from '@/components/Reveal';
import { getSetting } from '@/lib/db';
import { getBookingByRef, releaseStaleHolds } from '@/lib/studio';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your booking — Beatvault' };

/**
 * The link an artist keeps: what was booked, what is paid, what is owed on the
 * day. The reference in the URL is the capability — no account needed.
 */
export default function BookingPage({ params }: { params: { reference: string } }) {
  releaseStaleHolds();
  const booking = getBookingByRef(params.reference);
  if (!booking) notFound();

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
              <span className="h-[2px] w-7 bg-brand-500" />
              Studio booking
            </div>
            <h1 className="display text-[clamp(1.9rem,5vw,3rem)] text-white">
              YOUR <span className="text-brand-500">SLOT</span>
            </h1>
            <p className="mt-3 text-sm text-white/45">
              Keep this link — it shows the deposit we received and what is still due at the studio.
            </p>
          </div>

          <BookingReceipt
            booking={booking}
            policy={getSetting('studio_policy')}
            address={getSetting('studio_address')}
            phone={getSetting('studio_phone') || getSetting('momo_number')}
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio" className="btn-ghost !px-6 !py-3 text-xs">
              Book another session
            </Link>
            <Link href="/beats" className="btn-ghost !px-6 !py-3 text-xs">
              Browse beats
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
