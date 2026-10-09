import AdminHeader from '@/components/AdminHeader';
import { all, get } from '@/lib/db';
import { formatMoney, timeAgo } from '@/lib/utils';
import { getSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Artists — Producer dashboard' };

export default function AdminArtistsPage() {
  const symbol = getSetting('currency_symbol') || 'GH₵';
  const users = all<any>(
    `SELECT u.*,
       (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status='paid') orders_paid,
       (SELECT COALESCE(SUM(o.total),0) FROM orders o WHERE o.user_id = u.id AND o.status='paid') spent
     FROM users u ORDER BY u.id DESC`,
  );
  const subs = get<{ c: number }>('SELECT COUNT(*) c FROM subscribers');

  return (
    <div>
      <AdminHeader
        eyebrow="Customers"
        title="ARTISTS"
        accent="& SUBSCRIBERS"
        sub={`${users.length} registered artist${users.length === 1 ? '' : 's'}, ${subs?.c || 0} newsletter subscriber${subs?.c === 1 ? '' : 's'}.`}
      />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-white/[.07]">
            <tr>
              <th className="table-th">Artist</th>
              <th className="table-th">Contact</th>
              <th className="table-th">Location</th>
              <th className="table-th">Orders</th>
              <th className="table-th text-right">Lifetime spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.05]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[.02]">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-[11px] font-black text-white">
                      {(u.artist_name || u.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <div className="text-[13px] font-bold text-white">
                        {u.artist_name || u.name}
                      </div>
                      <div className="text-[11px] text-white/30">joined {timeAgo(u.created_at)}</div>
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  <a href={`mailto:${u.email}`} className="block truncate hover:text-brand-300">
                    {u.email}
                  </a>
                  {u.phone && <div className="text-[11px] text-white/30">{u.phone}</div>}
                </td>
                <td className="table-td">{u.country || '—'}</td>
                <td className="table-td">{u.orders_paid}</td>
                <td className="table-td text-right font-bold text-white">
                  {formatMoney(u.spent, symbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-white/40">No artists yet.</p>
        )}
      </div>
    </div>
  );
}
