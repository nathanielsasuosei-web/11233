import Link from 'next/link';
import { requireArtist } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ordersWithItems, listBeats } from '@/lib/queries';
import { getSetting } from '@/lib/db';
import { formatMoney, timeAgo } from '@/lib/utils';
import DownloadRow from '@/components/DownloadRow';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My library — Beatvault' };

export default async function DashboardHome() {
  const user = await requireArtist();
  if (!user) redirect('/login?next=/dashboard');
  const symbol = getSetting('currency_symbol') || 'GH₵';
  const orders = ordersWithItems(Number(user.id));
  const paid = orders.filter((o) => o.status === 'paid');

  const owned = paid.flatMap((o) =>
    o.items.map((it: any) => ({ ...it, paid: o.status === 'paid', orderRef: o.reference })),
  );
  const spent = paid.reduce((s, o) => s + Number(o.total), 0);
  const suggestions = listBeats({ limit: 4 }).slice(0, 3);

  return (
    <div>
      <Reveal>
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
            <span className="h-[2px] w-7 bg-brand-500" />
            Your account
          </div>
          <h1 className="display text-[clamp(1.9rem,4.6vw,3rem)] text-white">
            HELLO,{' '}
            <span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">
              {(user.artist_name || user.name).split(' ')[0].toUpperCase()}
            </span>
          </h1>
          <p className="mt-3 text-sm text-white/45">
            {owned.length
              ? 'Everything you own, with fresh download links whenever you need them.'
              : 'You have not bought a beat yet — start with the featured picks below.'}
          </p>
        </div>
      </Reveal>

      {/* stats */}
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        {[
          { k: 'Beats owned', v: String(owned.length), icon: '🎧' },
          { k: 'Total spent', v: formatMoney(spent, symbol), icon: '💳' },
          { k: 'Orders', v: String(orders.length), icon: '🧾' },
        ].map((s, i) => (
          <Reveal key={s.k} delay={i * 70}>
            <div className="card flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-brand-500/20 bg-brand-950/40 text-xl">
                {s.icon}
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                  {s.k}
                </div>
                <div className="display mt-1 text-2xl text-white">{s.v}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* owned */}
      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="display text-xl text-white">
            YOUR <span className="text-brand-500">BEATS</span>
          </h2>
          {owned.length > 4 && (
            <Link href="/dashboard/library" className="text-xs font-bold text-brand-300 hover:underline">
              View all →
            </Link>
          )}
        </div>

        {owned.length === 0 ? (
          <div className="card grid place-items-center px-6 py-14 text-center">
            <div className="mb-4 text-4xl">🎧</div>
            <h3 className="display text-lg text-white">No beats yet</h3>
            <p className="mt-2 max-w-sm text-sm text-white/45">
              When you buy a beat it lands here instantly — along with the download link we email
              you.
            </p>
            <Link href="/beats" className="btn-red mt-6 !px-7 text-xs">
              Browse the catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {owned.slice(0, 4).map((it: any) => (
              <DownloadRow
                key={it.id}
                title={it.beat_title}
                license={it.license}
                price={formatMoney(it.price, symbol)}
                token={it.download_token}
                downloads={it.download_count}
                limit={it.download_limit}
                paid={it.paid}
                cover={it.cover_url}
                slug={it.slug}
              />
            ))}
          </div>
        )}
      </section>

      {/* recent orders */}
      {orders.length > 0 && (
        <section className="mb-12">
          <h2 className="display mb-4 text-xl text-white">
            RECENT <span className="text-brand-500">ORDERS</span>
          </h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="border-b border-white/[.07]">
                <tr>
                  <th className="table-th">Reference</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Method</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.05]">
                {orders.slice(0, 6).map((o: any) => (
                  <tr key={o.id}>
                    <td className="table-td font-mono text-[12px] text-white/50">
                      <Link href={`/checkout/success?reference=${o.reference}`} className="hover:text-brand-300">
                        {o.reference}
                      </Link>
                      <div className="text-[10px] text-white/25">{timeAgo(o.created_at)}</div>
                    </td>
                    <td className="table-td">{o.items.length}</td>
                    <td className="table-td">{o.method || '—'}</td>
                    <td className="table-td">
                      <span
                        className={`chip ${
                          o.status === 'paid'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : o.status === 'pending'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                              : 'border-white/10 bg-white/5 text-white/50'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="table-td text-right font-bold text-white">
                      {formatMoney(o.total, symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* suggestions */}
      <section>
        <h2 className="display mb-4 text-xl text-white">
          YOU MIGHT <span className="text-brand-500">LIKE</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {suggestions.map((b) => (
            <Link
              key={b.id}
              href={`/beats/${b.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-white/[.07] bg-ink-850/60 p-3 transition hover:border-brand-500/40"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                {b.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-800 to-ink-900 text-[9px] font-black text-white/50">
                    BV
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-white transition group-hover:text-brand-300">
                  {b.title}
                </div>
                <div className="text-[11px] text-white/40">
                  {b.genre} · {b.bpm} BPM
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
