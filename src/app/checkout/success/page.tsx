import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Reveal from '@/components/Reveal';
import { getOrderByRef } from '@/lib/queries';
import { getSetting, get } from '@/lib/db';
import { formatMoney, timeAgo } from '@/lib/utils';
import { requireArtist } from '@/lib/auth';
import DownloadRow from '@/components/DownloadRow';
import { orderWhatsAppUrl, producerWhatsAppRaw } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Order confirmed — Project 1' };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  const reference = searchParams.reference || '';
  const order = getOrderByRef(reference);
  if (!order) notFound();

  const symbol = getSetting('currency_symbol') || 'GH₵';
  const user = await requireArtist();
  const mine = user && Number(user.id) === Number(order.user_id);
  if (!mine && order.status !== 'paid') notFound();

  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
  const whatsappUrl = orderWhatsAppUrl(
    order,
    order.items,
    `${base}/checkout/success?reference=${encodeURIComponent(order.reference)}`,
  );
  const producerPhone = producerWhatsAppRaw();

  const log = get<any>(
    "SELECT * FROM email_log WHERE kind = 'beat_delivery' AND subject LIKE ? ORDER BY id DESC LIMIT 1",
    [`%${reference}%`],
  );

  return (
    <div className="container-x py-14 sm:py-20">
      <Reveal>
        <div className="mx-auto max-w-3xl">
          {/* celebration header */}
          <div className="relative overflow-hidden rounded-[28px] border border-brand-500/25 bg-gradient-to-br from-brand-950 via-ink-900 to-ink-900 px-6 py-12 text-center sm:px-12">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-600/25 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-brand-800/25 blur-[80px]" />

            <div className="relative">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-500 text-white shadow-[0_0_50px_-8px_rgba(255,45,58,.9)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <h1 className="display mt-6 text-[clamp(1.9rem,5vw,3.2rem)] text-white">
                PAYMENT <span className="text-brand-500">CONFIRMED</span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/55">
                {order.status === 'paid'
                  ? `Your files are on their way to ${order.email}. Download them below too — the links are also saved in your library.`
                  : 'We are still waiting on the payment confirmation. This page updates automatically.'}
              </p>

              <dl className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-white/[.08] pt-6">
                {[
                  ['Reference', order.reference.replace(/^BV-/, '')],
                  ['Total', formatMoney(order.total, symbol)],
                  ['Method', order.method || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[9px] font-bold uppercase tracking-[.14em] text-white/35">
                      {k}
                    </dt>
                    <dd className="mt-1 truncate text-[13px] font-bold text-white" title={String(v)}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* WhatsApp straight to producer */}
          {whatsappUrl && (
            <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[.08] p-5 sm:flex-row">
              <div className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20 text-xl">
                  💬
                </span>
                <div>
                  <div className="text-[13px] font-bold text-white">
                    Send order receipt straight to {getSetting('producer_name') || 'the producer'}&apos;s WhatsApp
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">
                    Your order message is already in the producer&apos;s website inbox. Tap to also send your order summary straight to WhatsApp ({producerPhone}) for stems, custom edits or quick support.
                  </p>
                </div>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-xs font-extrabold uppercase tracking-[.1em] text-black shadow-[0_0_30px_-8px_rgba(16,185,129,.8)] transition hover:bg-emerald-400"
              >
                <span>💬</span>
                Send on WhatsApp
              </a>
            </div>
          )}

          {/* downloads */}
          <div className="mt-8">
            <h2 className="display mb-4 text-xl text-white">
              YOUR <span className="text-brand-500">DOWNLOADS</span>
            </h2>
            <div className="space-y-3">
              {order.items.map((it: any) => (
                <DownloadRow
                  key={it.id}
                  title={it.beat_title}
                  license={it.license}
                  price={formatMoney(it.price, symbol)}
                  token={it.download_token}
                  downloads={it.download_count}
                  limit={it.download_limit}
                  paid={order.status === 'paid'}
                  cover={it.cover_url}
                  slug={it.slug}
                />
              ))}
            </div>
          </div>

          {order.status === 'paid' && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-white/[.07] bg-ink-850/60 p-4">
                <span className="text-xl">✉️</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-white">Email sent to {order.email}</div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-white/40">
                    {log
                      ? `${log.status === 'sent' ? 'Delivered' : 'Queued in outbox'} · ${timeAgo(log.created_at)}. Check your spam folder if it has not arrived.`
                      : 'Check your spam folder if it has not arrived within a minute.'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/[.07] bg-ink-850/60 p-4">
                <span className="text-xl">🎧</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-white">Saved to your library</div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-white/40">
                    Every purchase lives in your account — re-download any time.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className="btn-red !px-7 text-sm">
              Go to my library
            </Link>
            <Link href="/beats" className="btn-ghost !px-7 text-sm">
              Browse more beats
            </Link>
            <Link href="/contact" className="btn-ghost !px-7 text-sm">
              Message the producer
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
