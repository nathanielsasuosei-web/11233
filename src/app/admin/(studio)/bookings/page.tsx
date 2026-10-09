import AdminHeader from '@/components/AdminHeader';
import BookingsManager from '@/components/BookingsManager';
import StudioServicesManager from '@/components/StudioServicesManager';
import { all, get, getSetting } from '@/lib/db';
import { bookingTotals, countOpenHolds, listBookings, releaseStaleHolds } from '@/lib/studio';
import { formatMoney } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio bookings — Producer dashboard' };

export default function AdminBookingsPage() {
  releaseStaleHolds();

  const symbol = getSetting('currency_symbol') || 'GH₵';
  const bookings = listBookings();
  const services = all<any>('SELECT * FROM studio_services ORDER BY sort ASC, id ASC');
  const totals = bookingTotals();
  const today = get<{ c: number; h: number }>(
    `SELECT COUNT(*) c, COALESCE(SUM(hours),0) h FROM bookings
     WHERE session_date = date('now') AND status IN ('pending','deposit_paid','confirmed')`,
  );

  const stats = [
    { k: 'Sessions today', v: `${today?.c || 0}`, sub: `${today?.h || 0}h on the clock`, icon: '📅' },
    { k: 'Deposits collected', v: formatMoney(totals.paid, symbol), sub: 'half of every booked session', icon: '💰' },
    { k: 'Balance to collect', v: formatMoney(totals.due, symbol), sub: 'due at the studio', icon: '🧾' },
    { k: 'Slots on hold', v: String(countOpenHolds()), sub: 'unpaid — released if time runs out', icon: '⏳' },
  ];

  return (
    <div>
      <AdminHeader
        eyebrow="Studio"
        title="BOOKINGS"
        accent="& RATES"
        sub="Artists pay a deposit to lock a slot and settle the balance at the studio. Record cash or Mobile Money deposits here, then mark the session complete."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="card flex items-start gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-500/20 bg-brand-950/40 text-base">
              {s.icon}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[9px] font-bold uppercase tracking-[.14em] text-white/35">
                {s.k}
              </div>
              <div className="display mt-0.5 truncate text-2xl text-white">{s.v}</div>
              <div className="truncate text-[10px] text-white/30">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <BookingsManager
        bookings={bookings.map((b) => ({
          ...b,
          price: Number(b.price || 0),
          deposit: Number(b.deposit || 0),
          balance: Number(b.balance || 0),
          hours: Number(b.hours || 1),
          cancel_reason: b.cancel_reason || '',
          artist_name: (b as any).artist_name ?? null,
          service_slug: (b as any).service_slug ?? null,
        }))}
      />

      <div className="mt-14">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
              <span className="h-[2px] w-7 bg-brand-500" />
              Rates
            </div>
            <h2 className="display text-2xl text-white">
              BOOKABLE <span className="text-brand-500">SERVICES</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/45">
              Hourly rate, minimum and maximum length, and what the artist gets. Anything priced
              above zero shows up on /studio with the deposit calculated automatically.
            </p>
          </div>
        </div>
        <StudioServicesManager services={services} />
      </div>
    </div>
  );
}
