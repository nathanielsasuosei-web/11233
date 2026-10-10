import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { getSettings } from '@/lib/db';
import { listBeats } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'About Project 1 — The producer' };

export default function AboutPage() {
  const settings = getSettings();
  const beats = listBeats();
  const producer = settings.producer_name || 'the producer';
  const studio = settings.studio_name || 'Project 1';
  const address = settings.studio_address?.split('—')[0]?.trim();

  const thingsHere = [
    {
      number: '01',
      title: 'Listen before you decide',
      copy: `${beats.length} original instrumental${beats.length === 1 ? '' : 's'} in the catalogue, with previews and licence details on each track.`,
    },
    {
      number: '02',
      title: 'Make the record in the room',
      copy: 'Book time for vocal recording, mixing, or mastering. The booking page shows the rate and deposit before you confirm.',
    },
    {
      number: '03',
      title: 'Ask a real question',
      copy: 'If you have a reference, a release date, or a question about a licence, send a note before you buy.',
    },
  ];

  return (
    <>
      <section className="border-b border-white/[.10] bg-ink-900">
        <div className="container-x py-20 sm:py-28">
          <Reveal>
            <div className="mb-4 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-brand-300">
              <span className="h-px w-7 bg-brand-500" />
              About {studio}
            </div>
            <h1 className="display max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)] text-white">
              Made by {producer}.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/60">
              {settings.tagline || 'Beats and studio work from Accra.'} A producer-led place to hear original instrumentals, choose a licence, and book time for the rest of the record.
            </p>
            <div className="mt-12 grid gap-5 border-t border-white/[.11] pt-5 text-sm sm:grid-cols-3 sm:gap-8">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/40">In the catalogue</div>
                <div className="display mt-1 text-2xl text-white">{beats.length} beats</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/40">Studio</div>
                <div className="mt-2 text-white/80">Recording · mixing · mastering</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/40">Location</div>
                <div className="mt-2 text-white/80">{address || 'By appointment'}</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x grid gap-12 py-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.15em] text-brand-300">How it works</p>
            <h2 className="display text-[clamp(2rem,4vw,3.2rem)] text-white">
              Hear it.<br />
              <span className="font-normal italic text-brand-300">Then make it yours.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
              {studio} keeps the practical parts clear: listen to a beat, read what each licence includes, and get the files once payment clears. For studio work, choose a service and a time that suits you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/beats" className="btn-red">Browse the beats</Link>
              <Link href="/studio" className="btn-ghost">Book studio time</Link>
            </div>
          </div>
        </Reveal>

        <div className="border-t border-white/[.12]">
          {thingsHere.map((item, index) => (
            <Reveal key={item.number} delay={index * 60}>
              <article className="grid gap-3 border-b border-white/[.10] py-6 sm:grid-cols-[48px_1fr] sm:gap-5">
                <span className="font-serif text-sm italic text-brand-300">{item.number}</span>
                <div>
                  <h3 className="display text-xl text-white">{item.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{item.copy}</p>
                </div>
              </article>
            </Reveal>
          ))}
          <div className="pt-6">
            <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/40">A direct line</div>
            <a href={`mailto:${settings.support_email}`} className="mt-2 inline-block text-sm text-brand-200 transition-colors hover:text-white">
              {settings.support_email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
