import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { LICENSES } from '@/lib/utils';
import { getSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Licensing explained — Beatvault',
  description: 'What each beat licence allows: leases, exclusive rights and buyouts.',
};

const FAQ = [
  {
    q: 'What is a lease?',
    a: 'A lease lets you use the beat commercially up to a limit (streams, videos, distribution) while the beat stays on sale to other artists. It is the cheapest way to release music properly.',
  },
  {
    q: 'What does exclusive mean?',
    a: 'Exclusive rights remove the beat from the store the moment you buy it. Nobody else can license it after that. You get WAV plus tracked-out stems and unlimited usage.',
  },
  {
    q: 'Do I still credit the producer?',
    a: 'Yes — please credit the producer as the composer on every release, on every licence tier. It costs nothing and it is how the beat gets discovered again.',
  },
  {
    q: 'How do I receive my files?',
    a: 'The instant payment clears, your download links are emailed to the address on your account and saved in your library. Each link allows up to 5 downloads.',
  },
  {
    q: 'Can I upgrade a lease later?',
    a: 'Yes. Message the producer with your order reference and you can pay the difference to upgrade to a higher tier while the beat is still available.',
  },
  {
    q: 'What payment methods work?',
    a: 'Mobile Money (MTN, Vodafone, AirtelTigo), instant bank transfer, USSD and cards, processed by Paystack.',
  },
];

export default function LicensingPage() {
  const symbol = getSetting('currency_symbol') || 'GH₵';

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mb-12">
          <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
            <span className="h-[2px] w-7 bg-brand-500" />
            Know what you own
          </div>
          <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)] text-white">
            LICENSING <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">EXPLAINED</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/45">
            Every beat comes with four licence options. Pick the one that matches how far you plan
            to push the record — you can upgrade later if it blows up.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {(Object.values(LICENSES)).map((l, i) => (
          <Reveal key={l.id} delay={i * 80}>
            <div
              className={`card flex h-full flex-col p-6 ${
                l.id === 'exclusive' ? 'border-brand-500/40 shadow-[0_0_50px_-24px_rgba(255,45,58,.9)]' : ''
              }`}
            >
              {l.id === 'exclusive' && (
                <span className="chip mb-3 w-fit border-brand-500/40 bg-brand-950/60 text-brand-300">
                  Most popular
                </span>
              )}
              <h2 className="display text-lg text-white">{l.name}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-white/45">{l.blurb}</p>
              <ul className="mt-5 flex-1 space-y-2 border-t border-white/[.07] pt-5">
                {l.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-[12px] leading-relaxed text-white/60">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                    {d}
                  </li>
                ))}
              </ul>
              <Link href="/beats" className="btn-ghost mt-6 w-full text-xs">
                Browse beats
              </Link>
            </div>
          </Reveal>
        ))}
      </div>

      <section className="mt-20">
        <Reveal>
          <h2 className="display mb-8 text-2xl text-white">
            COMMON <span className="text-brand-500">QUESTIONS</span>
          </h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i * 60, 300)}>
              <div className="card h-full p-6">
                <h3 className="text-[15px] font-bold text-white">{f.q}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-white/50">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <div className="mt-14 rounded-3xl border border-white/[.07] bg-ink-850/60 p-7 text-center">
          <p className="text-sm text-white/50">
            All prices are in {getSetting('currency') || 'GHS'} ({symbol}) and include instant email
            delivery. Still unsure which licence fits?{' '}
            <Link href="/contact" className="text-brand-300 hover:underline">
              Ask directly
            </Link>
            .
          </p>
        </div>
      </Reveal>
    </div>
  );
}
