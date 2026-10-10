import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import StudioBookingForm from '@/components/StudioBookingForm';
import { getSettings } from '@/lib/db';
import { formatMoney } from '@/lib/utils';
import { requireArtist } from '@/lib/auth';
import {
  bookingEnabled,
  depositPercent,
  earliestBookableDate,
  listStudioServices,
  openingHoursLabel,
  servicePriceSummary,
} from '@/lib/studio';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Book studio time — Project 1',
  description:
    'Recording, mixing and mastering sessions in Accra. Pick a slot, pay the deposit with Mobile Money, and your confirmation is emailed instantly.',
};

const SERVICE_ICON: Record<string, JSX.Element> = {
  recording: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1m7 8v4m-4 0h8" />
    </>
  ),
  mixing: (
    <>
      <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3" />
      <path d="M2 14h4m4-6h4m4 4h4" />
    </>
  ),
  mastering: <path d="M2 12h3l2-6 4 12 3-9 2 6 2-3h4" />,
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: { service?: string };
}) {
  const settings = getSettings();
  const user = await requireArtist();
  const services = listStudioServices().filter((s) => s.price_per_hour > 0);
  const percent = depositPercent();
  const bookable = bookingEnabled() && services.length > 0;

  return (
    <div className="container-x py-14 sm:py-20">
      {/* ---------- header ---------- */}
      <Reveal>
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-brand-300">
              <span className="h-px w-7 bg-brand-500" />
              Studio · {settings.studio_address?.split('—')[0] || 'By appointment'}
            </div>
            <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)] text-white">
              Book a studio <span className="font-normal italic text-brand-300">session.</span>
            </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                Recording, mixing and mastering with {settings.producer_name}. Pick a slot, pay{' '}
                <strong className="text-white/80">{percent}% now</strong> to lock it, and settle the
                balance at the studio. Your confirmation is emailed the moment the deposit lands.
              </p>
            </div>
            <div className="card px-5 py-4">
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                Opening hours
              </div>
              <div className="display mt-1.5 text-lg text-white">{openingHoursLabel()}</div>
              {(settings.studio_phone || settings.support_email) && (
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/45">
                  {settings.studio_phone && (
                    <a href={`tel:${settings.studio_phone.replace(/\s/g, '')}`} className="hover:text-brand-300">
                      {settings.studio_phone}
                    </a>
                  )}
                  <a href={`mailto:${settings.support_email}`} className="hover:text-brand-300">
                    {settings.support_email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* ---------- services ---------- */}
        <section className="mb-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {services.map((s, i) => {
              const summary = servicePriceSummary(s);
              return (
                <Reveal key={s.id} delay={i * 80}>
                  <article className="card h-full p-5">
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-brand-500/20 bg-brand-950/40 text-brand-300">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          {SERVICE_ICON[s.icon] || SERVICE_ICON.recording}
                        </svg>
                      </span>
                      <span className="chip border-white/10 bg-white/[.03] text-[9px]">
                        {summary.hours}
                      </span>
                    </div>
                    <h2 className="display mt-4 text-xl text-white">{s.title}</h2>
                    <div className="mt-1 text-[13px] font-bold text-brand-300">
                      {s.price_per_hour ? `${formatMoney(s.price_per_hour, settings.currency_symbol)} per hour` : 'On request'}
                    </div>
                    <p className="mt-3 text-[12px] leading-relaxed text-white/45">{s.blurb}</p>
                    {s.includes && (
                      <ul className="mt-4 space-y-1.5 border-t border-white/[.07] pt-3.5">
                        {s.includes
                          .split('|')
                          .map((x) => x.trim())
                          .filter(Boolean)
                          .map((inc) => (
                            <li key={inc} className="flex items-start gap-2 text-[11px] text-white/45">
                              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                              {inc}
                            </li>
                          ))}
                      </ul>
                    )}
                    <div className="mt-4 text-[10px] font-bold uppercase tracking-[.16em] text-white/30">
                      From {formatMoney(summary.depositFrom, settings.currency_symbol)} deposit
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ---------- booking ---------- */}
        {bookable ? (
          <section id="book">
            <SectionHeading
              eyebrow="Reserve a slot"
              title="Lock it in with"
              accent={`${percent}% down`}
              sub={`${percent}% now holds the calendar for you — the remaining ${100 - percent}% is paid at the studio before we hit record. Unpaid holds are released automatically.`}
            />
            <StudioBookingForm
              services={services.map((s) => ({
                id: s.id,
                slug: s.slug,
                title: s.title,
                blurb: s.blurb,
                includes: s.includes,
                price_per_hour: s.price_per_hour,
                min_hours: s.min_hours,
                max_hours: s.max_hours,
              }))}
              depositPercent={percent}
              today={earliestBookableDate()}
              defaultService={searchParams.service}
              person={{
                name: user?.artist_name || user?.name || '',
                email: user?.email || '',
                phone: user?.phone || '',
              }}
              policy={settings.studio_policy}
              hours={openingHoursLabel()}
            />
          </section>
        ) : (
          <div className="card p-8 text-center">
            <h3 className="display text-xl text-white">Booking is paused</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
              The studio is not taking online bookings right now.{' '}
              <Link href="/contact" className="text-brand-300 hover:underline">
                Send a message
              </Link>{' '}
              and we will find you a slot.
            </p>
          </div>
        )}

        {/* ---------- my bookings ---------- */}
        {user && (
          <div className="mt-10 text-center">
            <Link href="/dashboard/studio" className="btn-ghost !px-6 !py-3 text-xs">
              My studio bookings →
            </Link>
          </div>
        )}
    </div>
  );
}
