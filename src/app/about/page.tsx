import Link from 'next/link';
import HeroCanvas from '@/components/HeroCanvas';
import Reveal from '@/components/Reveal';
import { getSettings, getSetting } from '@/lib/db';
import { siteStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'About the producer — Beatvault' };

const CREDITS = [
  ['Radio/TV', 'Adverts, idents & sync'],
  ['Independent artists', 'Singles, EPs & albums'],
  ['Labels', 'Catalogue & exclusive placements'],
  ['Content creators', 'YouTube, TikTok & podcast beds'],
];

export default function AboutPage() {
  const s = getSettings();
  const stats = siteStats();

  return (
    <>
      {/* banner */}
      <section className="relative overflow-hidden border-b border-white/[.06] bg-ink-900">
        <div className="grid-bg mask-fade-b absolute inset-0 opacity-50" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-700/20 blur-[110px]" />
        <HeroCanvas className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />

        <div className="container-x relative py-24 sm:py-32">
          <Reveal>
            <div className="mb-4 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
              <span className="h-[2px] w-7 bg-brand-500" />
              The producer
            </div>
            <h1 className="display max-w-4xl text-[clamp(2.4rem,7vw,5.4rem)] text-white">
              {s.producer_name.toUpperCase().split(' ').slice(0, -1).join(' ')}{' '}
              <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">
                {s.producer_name.split(' ').slice(-1)}
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/55">
              {s.tagline}. I build instrumentals for artists who care about how the record
              actually sounds — mixed, mastered and delivered the same day you buy.
            </p>
          </Reveal>
        </div>
      </section>

      {/* stats */}
      <section className="container-x -mt-10">
        <div className="card grid grid-cols-2 divide-x divide-white/[.06] p-6 lg:grid-cols-4">
          {[
            ['Beats published', String(stats.beats)],
            ['Artists served', String(stats.artists)],
            ['Licences sold', String(stats.sold)],
            ['Avg. delivery', 'Instant'],
          ].map(([k, v]) => (
            <div key={k} className="px-4 py-2 text-center">
              <div className="display text-[clamp(1.5rem,3.4vw,2.4rem)] text-white">{v}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-white/35">
                {k}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* story */}
      <section className="container-x grid gap-12 py-20 lg:grid-cols-[1.2fr_.8fr]">
        <Reveal>
          <div>
            <h2 className="display text-[clamp(1.7rem,4vw,2.6rem)] text-white">
              SOUND FIRST. <span className="text-brand-500">ALWAYS.</span>
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-white/55">
              <p>
                {getSetting('studio_name')} started as a bedroom setup and a hard drive full of
                unfinished ideas. Today it is a full production house turning around records for
                artists across Ghana, Nigeria, the UK and the US.
              </p>
              <p>
                Every instrumental here is written, arranged, mixed and mastered in-house. Nothing is
                resold from a pack, and nothing goes on the shelf until it sounds like a record on
                its own — before a single vocal is recorded.
              </p>
              <p>
                Buying a beat here is deliberately boring in the best way: pick it, pay with Mobile
                Money or a bank transfer, and the files are in your email before you have closed the
                tab.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="card p-6">
            <h3 className="display mb-5 text-base text-white">WORKING WITH</h3>
            <ul className="space-y-4">
              {CREDITS.map(([title, sub]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <div className="text-[13px] font-bold text-white">{title}</div>
                    <div className="text-[12px] text-white/40">{sub}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-7 border-t border-white/[.07] pt-5">
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                Enquiries
              </div>
              <a
                href={`mailto:${s.support_email}`}
                className="mt-1 block text-[14px] font-bold text-brand-300 hover:underline"
              >
                {s.support_email}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* cta */}
      <section className="container-x pb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[30px] border border-brand-500/20 bg-gradient-to-br from-brand-950 to-ink-900 px-6 py-14 text-center">
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-25" />
            <div className="relative">
              <h2 className="display mx-auto max-w-2xl text-[clamp(1.8rem,4.6vw,3rem)] text-white">
                Ready to find your next single?
              </h2>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/beats" className="btn-red !px-8 !py-4 text-sm">
                  Browse beats
                </Link>
                <Link href="/contact" className="btn-ghost !px-8 !py-4 text-sm">
                  Commission a custom beat
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
