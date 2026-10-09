'use client';

import Link from 'next/link';
import HeroCanvas from './HeroCanvas';
import { useSettings } from './SettingsProvider';

export default function AuthShell({
  title,
  accent,
  sub,
  children,
  footer,
}: {
  title: string;
  accent: string;
  sub: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { settings } = useSettings();
  return (
    <div className="relative flex min-h-[calc(100svh-68px)] items-center overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-40" />
      <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-brand-700/20 blur-[120px]" />
      <div className="absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-brand-800/20 blur-[110px]" />
      <HeroCanvas className="absolute inset-x-0 bottom-0 h-[40%] w-full opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,transparent_30%,rgba(8,8,10,.9)_100%)]" />

      <div className="container-x relative grid w-full gap-12 py-16 lg:grid-cols-2 lg:items-center">
        <div className="auth-from-left hidden lg:block">
          <div className="chip border-brand-500/30 bg-brand-950/50 text-brand-200">
            Artist access
          </div>
          <h1 className="display mt-6 text-[clamp(2.4rem,5vw,4.2rem)] text-white">
            {title} <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">{accent}</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/50">{sub}</p>

          <ul className="mt-9 space-y-3">
            {[
              'Every purchase and download link in one library',
              'Instant email delivery of MP3, WAV and stems',
              'Message the producer directly from your account',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[13px] text-white/55">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/20 text-[10px] text-brand-300">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-white/[.07] bg-ink-850/50 p-5 text-[12px] leading-relaxed text-white/40">
            <b className="text-white/70">Demo account</b> — email{' '}
            <code className="text-brand-300">artist@example.com</code>, password{' '}
            <code className="text-brand-300">artist123</code>
          </div>
        </div>

        <div className="auth-from-right mx-auto w-full max-w-md">{children}</div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-white/20">
        {settings.studio_name} · secure area
      </div>

      {footer}
    </div>
  );
}
