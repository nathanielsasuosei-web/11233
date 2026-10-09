import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { all, get, getSetting } from '@/lib/db';
import { ordersWithItems } from '@/lib/queries';
import { formatMoney, timeAgo } from '@/lib/utils';
import { paystackMode } from '@/lib/paystack';
import { smtpConfigured as mailConfigured } from '@/lib/mailer';
import { storageMode } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Producer dashboard — Project 1' };

export default function AdminHome() {
  const symbol = getSetting('currency_symbol') || 'GH₵';

  const revenue = get<{ s: number }>("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status='paid'");
  const month = get<{ s: number }>(
    "SELECT COALESCE(SUM(total),0) s FROM orders WHERE status='paid' AND paid_at >= datetime('now','start of month')",
  );
  const orders = get<{ c: number }>('SELECT COUNT(*) c FROM orders');
  const pending = get<{ c: number }>("SELECT COUNT(*) c FROM orders WHERE status='pending'");
  const beats = get<{ c: number }>("SELECT COUNT(*) c FROM beats WHERE status='published'");
  const artists = get<{ c: number }>('SELECT COUNT(*) c FROM users');
  const unread = get<{ c: number }>("SELECT COUNT(*) c FROM messages WHERE status='unread'");

  const recent = ordersWithItems().slice(0, 6);
  const top = all<any>(
    `SELECT b.title, b.slug, b.genre, b.cover_url, SUM(oi.price) rev, COUNT(*) sold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id AND o.status = 'paid'
     JOIN beats b ON b.id = oi.beat_id
     GROUP BY b.id ORDER BY rev DESC LIMIT 5`,
  );

  const stats = [
    { k: 'Total revenue', v: formatMoney(revenue?.s || 0, symbol), icon: '💰' },
    { k: 'This month', v: formatMoney(month?.s || 0, symbol), icon: '📈' },
    { k: 'Orders', v: String(orders?.c || 0), icon: '🧾' },
    { k: 'Beats live', v: String(beats?.c || 0), icon: '🎵' },
    { k: 'Artists', v: String(artists?.c || 0), icon: '👤' },
    { k: 'Unread messages', v: String(unread?.c || 0), icon: '✉️' },
  ];

  const setup = [
    {
      label: 'Payments',
      ok: paystackMode() === 'live',
      on: 'Paystack connected — live Mobile Money & bank',
      off: 'Demo mode — no Paystack keys yet',
      href: '/admin/settings#payments',
    },
    {
      label: 'Email',
      ok: mailConfigured(),
      on: 'SMTP configured — emails are delivered',
      off: 'Outbox mode — emails are stored, not sent',
      href: '/admin/settings#email',
    },
    {
      label: 'Storage',
      ok: storageMode() === 's3',
      on: 'S3-compatible object storage',
      off: 'Local disk storage (public/uploads, or temp dir on serverless)',
      href: '/admin/settings#storage',
    },
  ];

  return (
    <div>
      <AdminHeader
        eyebrow="Producer"
        title="STUDIO"
        accent="DASHBOARD"
        sub="Everything happening in the store — revenue, orders, artists and setup status."
        action={
          <Link href="/admin/beats?new=1" className="btn-red !px-6 text-xs">
            + Upload a beat
          </Link>
        }
      />

      {/* setup banners */}
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        {setup.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`flex items-center gap-3 rounded-2xl border p-4 transition hover:border-brand-500/40 ${
              s.ok ? 'border-emerald-500/25 bg-emerald-500/[.06]' : 'border-amber-500/25 bg-amber-500/[.06]'
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-black ${
                s.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {s.ok ? '✓' : '!'}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-white/40">
                {s.label}
              </div>
              <div className="truncate text-[12px] font-semibold text-white/80">
                {s.ok ? s.on : s.off}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <div key={s.k} className="card flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-brand-500/20 bg-brand-950/40 text-xl">
              {s.icon}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                {s.k}
              </div>
              <div className="display mt-1 truncate text-2xl text-white">{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-7 xl:grid-cols-[1.3fr_.7fr]">
        {/* recent orders */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="display text-lg text-white">RECENT ORDERS</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-brand-300 hover:underline">
              View all →
            </Link>
          </div>
          <div className="card overflow-x-auto">
            {recent.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-white/40">No orders yet.</p>
            ) : (
              <table className="w-full min-w-[520px]">
                <thead className="border-b border-white/[.07]">
                  <tr>
                    <th className="table-th">Reference</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[.05]">
                  {recent.map((o: any) => (
                    <tr key={o.id}>
                      <td className="table-td">
                        <Link href={`/admin/orders`} className="font-mono text-[12px] hover:text-brand-300">
                          {o.reference}
                        </Link>
                        <div className="text-[10px] text-white/25">{timeAgo(o.created_at)}</div>
                      </td>
                      <td className="table-td">
                        <div className="truncate">{o.name}</div>
                        <div className="truncate text-[11px] text-white/30">{o.email}</div>
                      </td>
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
            )}
          </div>
        </section>

        {/* top beats */}
        <section>
          <h2 className="display mb-4 text-lg text-white">BEST SELLERS</h2>
          <div className="card divide-y divide-white/[.05]">
            {top.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-white/40">No sales yet.</p>
            ) : (
              top.map((b, i) => (
                <div key={b.slug} className="flex items-center gap-3 p-4">
                  <span className="display w-5 text-center text-sm text-white/25">{i + 1}</span>
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                    {b.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/beats/${b.slug}`}
                      className="block truncate text-[13px] font-bold text-white hover:text-brand-300"
                    >
                      {b.title}
                    </Link>
                    <div className="text-[11px] text-white/35">
                      {b.sold} sold · {b.genre}
                    </div>
                  </div>
                  <span className="shrink-0 text-[13px] font-bold text-brand-300">
                    {formatMoney(b.rev, symbol)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
