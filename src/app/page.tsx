import Link from 'next/link';
import Hero from '@/components/Hero';
import SectionHeading from '@/components/SectionHeading';
import BeatGrid from '@/components/BeatGrid';
import Reveal from '@/components/Reveal';
import VideoCard from '@/components/VideoCard';
import { getSettings } from '@/lib/db';
import { listBeats, listVideos } from '@/lib/queries';
import { playableBeats } from '@/lib/preview';
import { depositPercent, listStudioServices, servicePriceSummary } from '@/lib/studio';
import { formatMoney } from '@/lib/utils';

function StudioServiceIcon({ name }: { name: 'recording' | 'mixing' | 'mastering' }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'recording' ? (
        <>
          <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1m7 8v4m-4 0h8" />
        </>
      ) : name === 'mixing' ? (
        <>
          <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3" />
          <path d="M2 14h4m4-6h4m4 4h4" />
        </>
      ) : (
        <path d="M2 12h3l2-6 4 12 3-9 2 6 2-3h4" />
      )}
    </svg>
  );
}

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const settings = getSettings();
  // No cap: every published beat is listed, so every preview is reachable here.
  // listBeats() sorts featured first, so the highlights still lead the grid.
  const beats = listBeats();
  const previews = playableBeats(beats);
  const videos = listVideos(3);
  const stats = { beats: beats.length };
  const heroBeat = beats.find((b) => b.featured) || beats[0] || null;
  const percent = depositPercent();
  // One source of truth for studio pricing: the same rows the booking engine uses.
  const services = listStudioServices()
    .filter((sv) => sv.published)
    .map((sv, i) => {
      const summary = servicePriceSummary(sv);
      return {
        id: sv.id,
        slug: sv.slug,
        number: String(i + 1).padStart(2, '0'),
        icon: sv.icon,
        title: sv.title,
        description: sv.blurb,
        rate: sv.price_per_hour
          ? `${formatMoney(sv.price_per_hour, settings.currency_symbol)} per hour · ${summary.hours}`
          : 'Quoted per project',
        details: (sv.includes || '')
          .split('|')
          .map((x) => x.trim())
          .filter(Boolean),
        bookLabel:
          sv.price_per_hour && summary.depositFrom
            ? `Book ${sv.title} · ${formatMoney(summary.depositFrom, settings.currency_symbol)} down`
            : `Ask about ${sv.title}`,
        bookable: Boolean(sv.price_per_hour),
      };
    });

  return (
    <>
      <Hero
        settings={settings}
        beat={heroBeat}
        tracks={previews}
        stats={stats}
      />

      {/* ---------------- every beat ---------------- */}
      <section className="container-x py-20 sm:py-28">
        <SectionHeading
          eyebrow="The catalogue"
          title="Original beats,"
          accent="ready to hear."
          sub={`${beats.length} instrumental${beats.length === 1 ? '' : 's'} available. Listen to the preview, check the licence options, and choose what works for your release.`}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/previews" className="btn-red !px-6 !py-3 text-xs">
                Preview list →
              </Link>
              <Link href="/beats" className="btn-ghost !px-6 !py-3 text-xs">
                View all beats →
              </Link>
            </div>
          }
        />
        <BeatGrid beats={beats} />
      </section>

      {/* ---------------- videos ---------------- */}
      {videos.length > 0 && (
        <section className="relative overflow-hidden border-y border-white/[.06] bg-ink-850/50 py-20 sm:py-28">
          <div className="container-x relative">
            <SectionHeading
              eyebrow="From the room"
              title="A look at"
              accent="the work."
              sub="Session clips, beat breakdowns and other things happening in the studio."
              action={
                <Link href="/videos" className="btn-ghost !px-5 !py-3 text-xs">
                  More videos →
                </Link>
              }
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {videos.map((v, i) => (
                <Reveal key={v.id} delay={i * 90}>
                  <VideoCard video={v} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- studio services ---------------- */}
      <section
        id="studio"
        className="scroll-mt-24 border-t border-white/[.10] bg-ink-850/35"
      >
        <div className="container-x py-20 sm:py-24">
          <SectionHeading
            eyebrow="Studio work"
            title="From the first take"
            accent="to the final mix."
            sub={`Recording, mixing and mastering sessions with ${settings.producer_name}. Pay ${percent}% to hold a time; settle the balance at the studio.`}
            action={
              <Link href="/studio" className="btn-ghost !px-6 !py-3 text-xs">
                Studio calendar →
              </Link>
            }
          />

          <div className="grid gap-4 md:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.title} delay={index * 70}>
                <article className="group h-full border-t border-white/[.14] py-5 transition-colors hover:border-brand-400">
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center border border-white/15 text-brand-200">
                      <StudioServiceIcon name={service.icon as 'recording' | 'mixing' | 'mastering'} />
                    </span>
                    <span className="font-serif text-lg italic text-white/35">{service.number}</span>
                  </div>
                  <div className="mt-6 text-[10px] font-medium uppercase tracking-[.13em] text-brand-300">
                    {service.rate}
                  </div>
                  <h3 className="display mt-2 text-2xl text-white">{service.title}</h3>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-white/55">
                    {service.description}
                  </p>
                  <ul className="mt-5 space-y-1 border-t border-white/[.09] pt-4">
                    {service.details.map((detail) => (
                      <li key={detail} className="text-[11px] leading-5 text-white/50">{detail}</li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={service.bookable ? `/studio?service=${service.slug}` : `/contact?service=${service.title.toLowerCase()}`}
                      aria-label={
                        service.bookable
                          ? `Book a ${service.title} session`
                          : `Enquire about ${service.title}`
                      }
                      className="btn-red flex-1 !justify-between !px-4 !py-3 text-xs"
                    >
                      {service.bookLabel}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                    {service.bookable && (
                      <Link
                        href={`/contact?service=${service.title.toLowerCase()}`}
                        className="btn-ghost !px-3 !py-3 text-xs"
                      >
                        Ask first
                      </Link>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-8 flex flex-col gap-5 border-t border-white/[.11] py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="display text-xl text-white">Not sure what you need?</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
                  Send a rough mix or a reference track. We can talk through recording, mixing, or mastering before you book.
                </p>
              </div>
              <Link href="/contact" className="btn-ghost shrink-0 !px-5 !py-3 text-xs">
                Ask the studio
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
