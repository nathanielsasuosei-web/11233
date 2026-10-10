import Link from 'next/link';
import { requireArtist } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ordersWithItems } from '@/lib/queries';
import { getSetting } from '@/lib/db';
import { formatMoney, timeAgo } from '@/lib/utils';
import DownloadRow from '@/components/DownloadRow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My beats — Project 1' };

export default async function LibraryPage() {
  const user = await requireArtist();
  if (!user) redirect('/login?next=/dashboard/library');
  const symbol = getSetting('currency_symbol') || 'GH₵';
  const orders = ordersWithItems(Number(user.id));

  const owned = orders
    .flatMap((o) =>
      o.items.map((it: any) => ({
        ...it,
        paid: o.status === 'paid',
        orderRef: o.reference,
        boughtAt: o.paid_at || o.created_at,
        method: o.method,
      })),
    )
    .sort((a: any, b: any) => String(b.boughtAt).localeCompare(String(a.boughtAt)));

  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
          <span className="h-[2px] w-7 bg-brand-500" />
          Downloads
        </div>
        <h1 className="display text-[clamp(1.9rem,4.6vw,3rem)] text-white">
          Your <span className="font-normal italic text-brand-300">library.</span>
        </h1>
        <p className="mt-3 text-sm text-white/45">
          {owned.length} licence{owned.length === 1 ? '' : 's'}. Each link allows 5 downloads and
          stays valid for 30 days — ask for a refresh any time.
        </p>
      </div>

      {owned.length === 0 ? (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <div className="mb-4 text-4xl">🎧</div>
          <h3 className="display text-lg text-white">Nothing here yet</h3>
          <p className="mt-2 max-w-sm text-sm text-white/45">
            Buy a beat and it will appear here instantly, along with an email containing the same
            download links.
          </p>
          <Link href="/beats" className="btn-red mt-6 !px-7 text-xs">
            Browse beats
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {owned.map((it: any) => (
            <div key={it.id}>
              <DownloadRow
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
              <div className="mt-1 pl-1 text-[10px] uppercase tracking-[.14em] text-white/25">
                {it.orderRef} · {timeAgo(it.boughtAt)} · {it.method || '—'}
                {!it.paid && <span className="ml-2 text-amber-300">awaiting payment</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
