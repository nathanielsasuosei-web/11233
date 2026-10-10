'use client';

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
    <div className="relative flex min-h-[calc(100svh-68px)] items-center border-b border-white/[.10] bg-ink-900">
      <div className="container-x grid w-full gap-12 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="hidden lg:block">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.16em] text-brand-300">
            Artist account
          </p>
          <h1 className="display max-w-xl text-[clamp(2.5rem,5vw,4.5rem)] text-white">
            {title}{' '}
            <span className="font-normal italic text-brand-300">{accent}</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-white/60">{sub}</p>

          <ul className="mt-9 max-w-md border-t border-white/[.10]">
            {[
              'Keep your licences and download links in one library',
              'Find your past studio bookings and messages',
              'Get back to a beat whenever you need it',
            ].map((text, index) => (
              <li key={text} className="flex gap-4 border-b border-white/[.09] py-3 text-[13px] text-white/60">
                <span className="font-serif italic text-brand-300">0{index + 1}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[10px] uppercase tracking-[.13em] text-white/25">
        {settings.studio_name} · Artist account
      </div>

      {footer}
    </div>
  );
}
