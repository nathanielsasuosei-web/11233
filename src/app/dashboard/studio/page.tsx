import Link from 'next/link';
import { redirect } from 'next/navigation';
import BookingReceipt from '@/components/BookingReceipt';
import Reveal from '@/components/Reveal';
import { requireArtist } from '@/lib/auth';
import { getSetting } from '@/lib/db';
import { listBookingsForEmail, releaseStaleHolds } from '@/lib/studio';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio bookings — Project 1' };

export default async function DashboardStudioPage() {
  const user = await requireArtist();
  if (!user) redirect('/login?next=/dashboard/studio');

  releaseStaleHolds();
  const bookings = listBookingsForEmail(String(user.email));
  const upcoming = bookings.filter((b) => ['pending', 'deposit_paid', 'confirmed'].includes(b.status));
  const past = bookings.filter((b) => !['pending', 'deposit_paid', 'confirmed'].includes(b.status));

  return (
    <div>
      <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
              <span className="h-[2px] w-7 bg-brand-500" />
              Studio
            </div>
            <h1 className="display text-[clamp(1.9rem,4.6vw,3rem)] text-white">
              Your <span className="font-normal italic text-brand-300">sessions.</span>
            </h1>
            <p className="mt-3 text-sm text-white/45">
              {upcoming.length
                ? `${upcoming.length} upcoming session${upcoming.length === 1 ? '' : 's'} — pay the deposit to lock the slot, settle the balance on the day.`
                : 'No sessions booked yet. Half now locks the calendar; the rest is paid at the studio.'}
            </p>
          </div>
          <Link href="/studio" className="btn-red !px-6 !py-3 text-xs">
            Book studio time
          </Link>
        </div>
      </Reveal>

      {bookings.length === 0 ? (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <div className="mb-4 text-4xl">🎙️</div>
          <h3 className="display text-lg text-white">Nothing on the calendar</h3>
          <p className="mt-2 max-w-sm text-sm text-white/45">
            Recording, mixing and mastering — pick a service, choose a free slot and pay{' '}
            {getSetting('studio_deposit_percent') || '50'}% to hold it.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {upcoming.map((b, i) => (
            <Reveal key={b.reference} delay={Math.min(i * 60, 240)}>
              <BookingReceipt
                booking={b}
                policy={getSetting('studio_policy')}
                address={getSetting('studio_address')}
                phone={getSetting('studio_phone') || getSetting('momo_number')}
              />
            </Reveal>
          ))}

          {past.length > 0 && (
            <section className="pt-6">
              <h2 className="display mb-4 text-lg text-white">
                PAST <span className="text-white/35">SESSIONS</span>
              </h2>
              <div className="card divide-y divide-white/[.05] overflow-hidden">
                {past.map((b) => (
                  <div key={b.reference} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-white">
                        {b.hours}h {b.service_title}
                      </div>
                      <div className="text-[11px] text-white/35">
                        {b.session_date} {b.start_time} · {b.reference}
                        {b.cancel_reason ? ` · ${b.cancel_reason}` : ''}
                      </div>
                    </div>
                    <span className="chip text-[9px]">{b.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
