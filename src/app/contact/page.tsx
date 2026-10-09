import Link from 'next/link';
import Reveal from '@/components/Reveal';
import ContactForm from '@/components/ContactForm';
import { getSettings } from '@/lib/db';
import { requireArtist } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact — Beatvault' };

const SERVICE_SUBJECTS: Record<string, string> = {
  recording: 'Recording session',
  mixing: 'Mixing',
  mastering: 'Mastering',
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: { service?: string };
}) {
  const s = getSettings();
  const user = await requireArtist();
  const initialSubject = searchParams.service
    ? SERVICE_SUBJECTS[searchParams.service.toLowerCase()]
    : undefined;

  const cards = [
    { icon: '✉️', label: 'Email', value: s.support_email, href: `mailto:${s.support_email}` },
    { icon: '📱', label: 'Mobile Money enquiries', value: s.momo_number, href: `tel:${s.momo_number.replace(/\s/g, '')}` },
    {
      icon: '🏦',
      label: 'Bank transfer',
      value: `${s.bank_name} · ${s.bank_account_number}`,
      sub: s.bank_account_name,
    },
  ];

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
            <span className="h-[2px] w-7 bg-brand-500" />
            Let&apos;s work
          </div>
          <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)] text-white">
            GET IN <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">TOUCH</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/45">
            Custom production, mixing, mastering, or a question about an order — send a message and
            you&apos;ll get a reply by email.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-7 lg:grid-cols-[.85fr_1.15fr]">
        <Reveal>
          <div className="space-y-4">
            {cards.map((c) => (
              <div key={c.label} className="card flex items-start gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-brand-500/20 bg-brand-950/40 text-lg">
                  {c.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                    {c.label}
                  </div>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="mt-1 block break-words text-[14px] font-bold text-white transition hover:text-brand-300"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <div className="mt-1 break-words text-[14px] font-bold text-white">{c.value}</div>
                  )}
                  {c.sub && <div className="text-[12px] text-white/40">{c.sub}</div>}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-brand-500/20 bg-brand-950/30 p-5">
              <div className="display text-sm text-white">Faster than email?</div>
              <p className="mt-2 text-[12px] leading-relaxed text-white/50">
                Buying a beat? Skip the wait —{' '}
                <Link href="/beats" className="text-brand-300 hover:underline">
                  browse the catalogue
                </Link>
                , pay with Mobile Money or bank transfer and the files land in your inbox within
                seconds.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <ContactForm
            name={user?.name || ''}
            email={user?.email || ''}
            initialSubject={initialSubject}
          />
        </Reveal>
      </div>
    </div>
  );
}
