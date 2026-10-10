import Link from 'next/link';
import Reveal from '@/components/Reveal';
import ContactForm from '@/components/ContactForm';
import { getSettings } from '@/lib/db';
import { requireArtist } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact — Project 1' };

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
    ...(s.support_email
      ? [{ icon: '@', label: 'Email', value: s.support_email, href: `mailto:${s.support_email}` }]
      : []),
    ...(s.momo_number && s.momo_number.replace(/\s/g, '') !== '0550000000'
      ? [{ icon: '☎', label: 'Mobile Money enquiries', value: s.momo_number, href: `tel:${s.momo_number.replace(/\s/g, '')}` }]
      : []),
    ...(s.bank_account_number && !/^0+$/.test(s.bank_account_number.replace(/\D/g, ''))
      ? [{
          icon: '↗',
          label: 'Bank transfer',
          value: `${s.bank_name} · ${s.bank_account_number}`,
          sub: s.bank_account_name,
        }]
      : []),
  ];

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[.16em] text-brand-300">
            <span className="h-px w-7 bg-brand-500" />
            Contact
          </div>
          <h1 className="display text-[clamp(2.2rem,6vw,4.4rem)] text-white">
            Talk to the <span className="font-normal italic text-brand-300">studio.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
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
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-brand-500/25 text-base font-serif text-brand-200">
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
              <div className="display text-sm text-white">Looking for a beat?</div>
              <p className="mt-2 text-[12px] leading-relaxed text-white/55">
                The catalogue has previews and licence details for each track.{' '}
                <Link href="/beats" className="text-brand-200 hover:underline">
                  Take a look.
                </Link>
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
