/**
 * Studio bookings: services, the pay-half deposit model, and slot maths.
 *
 * The rule the whole file is built around: an artist locks a slot by paying a
 * deposit (default 50% — "pay half now"), and the balance is settled at the
 * studio before the session starts. Money is stored in minor units (pesewas).
 */
import { all, get, getSetting, run } from './db';
import { randomToken } from './utils';

export type StudioService = {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  includes: string;
  icon: string;
  price_per_hour: number;
  min_hours: number;
  max_hours: number;
  published: number;
  sort: number;
};

export type Booking = {
  id: number;
  reference: string;
  user_id: number | null;
  service_id: number | null;
  service_title: string;
  hours: number;
  session_date: string;
  start_time: string;
  end_time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  price: number;
  deposit: number;
  balance: number;
  deposit_percent: number;
  status: string;
  method: string;
  channel: string;
  pay_email: string;
  pay_phone: string;
  paid_at: string | null;
  closed_at?: string | null;
  cancel_reason?: string;
  created_at: string;
};

/** Statuses that still hold a slot on the calendar. */
const HELD = ['pending', 'deposit_paid', 'confirmed'];
export const BOOKING_PAID = 'deposit_paid';

export function bookingEnabled() {
  return getSetting('studio_bookable') !== '0';
}

/** Share of the session the artist pays now to lock the slot. */
export function depositPercent() {
  const raw = Number(getSetting('studio_deposit_percent'));
  const pct = isFinite(raw) ? raw : 50;
  return Math.min(100, Math.max(0, Math.round(pct || 50)));
}

export function splitPrice(price: number, percent = depositPercent()) {
  const deposit = Math.round((Math.max(0, price) * percent) / 100);
  return { deposit, balance: Math.max(0, price) - deposit };
}

export function listStudioServices(onlyPublished = true): StudioService[] {
  return all<StudioService>(
    `SELECT * FROM studio_services ${onlyPublished ? 'WHERE published = 1' : ''}
     ORDER BY sort ASC, id ASC`,
  );
}

export function getStudioService(idOrSlug: number | string) {
  return typeof idOrSlug === 'number'
    ? get<StudioService>('SELECT * FROM studio_services WHERE id = ?', [idOrSlug])
    : get<StudioService>('SELECT * FROM studio_services WHERE slug = ?', [idOrSlug]);
}

/* ------------------------------------------------------------------ */
/* Calendar maths                                                      */
/* ------------------------------------------------------------------ */

export const toMinutes = (hhmm: string) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (isFinite(h) ? h : 0) * 60 + (isFinite(m) ? m : 0);
};

export const toHHMM = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

export function openHour() {
  const n = Number(getSetting('studio_open_hour'));
  return Math.min(23, Math.max(0, isFinite(n) ? n : 10));
}

export function closeHour() {
  const n = Number(getSetting('studio_close_hour'));
  return Math.min(24, Math.max(1, isFinite(n) ? n : 18));
}

/** '1-6' or '1,2,3' — weekday numbers, Monday = 1, Sunday = 0. */
export function openWeekdays(): number[] {
  const raw = (getSetting('studio_open_days') || '0-6').trim();
  const out = new Set<number>();
  for (const part of raw.split(',')) {
    const m = part.trim().match(/^(\d)\s*-\s*(\d)$/);
    if (m) {
      const from = Number(m[1]);
      const to = Number(m[2]);
      if (from <= to) for (let d = from; d <= to; d++) out.add(d);
      else {
        for (let d = from; d <= 6; d++) out.add(d);
        for (let d = 0; d <= to; d++) out.add(d);
      }
      continue;
    }
    const single = Number(part.trim());
    if (single >= 0 && single <= 6) out.add(single);
  }
  return [...out].sort();
}

/** Sunday = 0 … Saturday = 6, the same numbering `studio_open_days` uses. */
export function weekdayOf(dateISO: string) {
  const d = new Date(`${dateISO}T12:00:00Z`);
  return isNaN(d.getTime()) ? -1 : d.getUTCDay();
}

export const isClosedDay = (dateISO: string) => !openWeekdays().includes(weekdayOf(dateISO));

/** Hourly start times the studio can offer on a date, irrespective of bookings. */
export function startSlots(): string[] {
  const from = openHour();
  const to = closeHour();
  const out: string[] = [];
  for (let h = from; h < to; h++) out.push(toHHMM(h * 60));
  return out;
}

/** Windows already held by a live booking on that date (overlap, not just same start). */
export function takenRanges(dateISO: string, ignoreReference?: string) {
  const rows = all<{ start_time: string; end_time: string }>(
    `SELECT start_time, end_time FROM bookings
     WHERE session_date = ? AND status IN (${HELD.map(() => '?').join(',')})
       ${ignoreReference ? 'AND reference != ?' : ''}`,
    [dateISO, ...HELD, ...(ignoreReference ? [ignoreReference] : [])],
  );
  return rows.map((r) => [toMinutes(r.start_time), toMinutes(r.end_time)] as const);
}

export function slotBusy(dateISO: string, startHHMM: string, hours: number, ignoreReference?: string) {
  const start = toMinutes(startHHMM);
  const end = start + Math.max(1, hours) * 60;
  return takenRanges(dateISO, ignoreReference).some(([s, e]) => start < e && end > s);
}

/** Which of the day's hourly starts are still free for an N-hour session. */
export function availability(dateISO: string, hours: number) {
  if (isClosedDay(dateISO)) return { closed: true, slots: [] as { time: string; free: boolean }[] };
  const taken = takenRanges(dateISO);
  const slots = startSlots().map((time) => {
    const start = toMinutes(time);
    const end = start + Math.max(1, hours) * 60;
    return { time, free: end <= closeHour() * 60 && !taken.some(([s, e]) => start < e && end > s) };
  });
  return { closed: false, slots };
}

export function earliestBookableDate() {
  // Today is still on the table; the slot list hides anything already gone.
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

function nowHM() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** True when a same-day slot has already started (or is too close to make it in time). */
export function slotInPast(dateISO: string, startHHMM: string, leadMinutes = 120) {
  const today = earliestBookableDate();
  if (dateISO < today) return true;
  if (dateISO !== today) return false;
  return toMinutes(startHHMM) <= nowHM() + leadMinutes;
}

/* ------------------------------------------------------------------ */
/* Booking rows                                                        */
/* ------------------------------------------------------------------ */

export function bookingReference() {
  return `BK-${Date.now().toString(36).toUpperCase()}-${randomToken(5).toUpperCase()}`;
}

/**
 * Creates a booking in `pending` — held for a short window so two artists
 * cannot grab the same slot while one of them is still paying.
 */
export function createBooking(input: {
  service: StudioService;
  hours: number;
  date: string;
  start: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  userId: number | null;
  method: string;
  payPhone: string;
}) {
  const price = Math.max(0, Number(input.service.price_per_hour) * input.hours);
  const { deposit, balance } = splitPrice(price);
  const ref = bookingReference();

  const res = run(
    `INSERT INTO bookings (reference, user_id, service_id, service_title, hours, session_date, start_time, end_time,
       name, email, phone, notes, price, deposit, balance, deposit_percent, status, method, pay_email, pay_phone)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      ref,
      input.userId,
      input.service.id,
      input.service.title,
      input.hours,
      input.date,
      input.start,
      toHHMM(toMinutes(input.start) + input.hours * 60),
      input.name,
      input.email.toLowerCase().trim(),
      input.phone,
      input.notes,
      price,
      deposit,
      balance,
      depositPercent(),
      'pending',
      input.method,
      input.email.toLowerCase().trim(),
      input.payPhone,
    ],
  );

  return { id: Number(res.lastInsertRowid), reference: ref, price, deposit, balance };
}

export function getBookingByRef(ref: string) {
  return get<Booking>('SELECT * FROM bookings WHERE reference = ?', [ref]);
}

export function getBookingById(id: number) {
  return get<Booking>('SELECT * FROM bookings WHERE id = ?', [id]);
}

export function listBookingsForUser(userId: number, email?: string) {
  return all<Booking & { service_slug: string }>(
    `SELECT b.*, s.slug as service_slug FROM bookings b
     LEFT JOIN studio_services s ON s.id = b.service_id
     WHERE b.user_id = ? ${email ? 'OR lower(b.email) = lower(?)' : ''}
     ORDER BY b.session_date DESC, b.start_time DESC, b.id DESC`,
    email ? [userId, email] : [userId],
  );
}

export function listBookingsForEmail(email: string) {
  return all<Booking>(
    `SELECT b.*, s.slug as service_slug FROM bookings b
     LEFT JOIN studio_services s ON s.id = b.service_id
     WHERE lower(b.email) = lower(?)
     ORDER BY b.session_date DESC, b.start_time DESC, b.id DESC`,
    [email],
  );
}

export function listBookings(filter: { status?: string; date?: string } = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.status && filter.status !== 'all') {
    where.push('b.status = ?');
    params.push(filter.status);
  }
  if (filter.date) {
    where.push('b.session_date = ?');
    params.push(filter.date);
  }
  return all<Booking & { service_slug: string; artist_name: string | null }>(
    `SELECT b.*, s.slug as service_slug, u.artist_name FROM bookings b
     LEFT JOIN studio_services s ON s.id = b.service_id
     LEFT JOIN users u ON u.id = b.user_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY b.session_date DESC, b.start_time DESC, b.id DESC`,
    params,
  );
}

export function markBookingPaid(id: number, opts: { method?: string; channel?: string } = {}) {
  run(
    `UPDATE bookings SET status = ?, paid_at = ?, method = COALESCE(NULLIF(?, ''), method), channel = ?
     WHERE id = ?`,
    [BOOKING_PAID, new Date().toISOString(), opts.method || '', opts.channel || 'demo', id],
  );
}

export function setBookingStatus(id: number, status: string, reason = '') {
  run("UPDATE bookings SET status = ?, closed_at = datetime('now'), cancel_reason = ? WHERE id = ?", [
    status,
    reason,
    id,
  ]);
}

/** Releases expired unpaid holds so a slot is not blocked forever. */
export function releaseStaleHolds(minutes = 45) {
  const res = run(
    `UPDATE bookings
     SET status = 'expired', closed_at = datetime('now'), cancel_reason = 'Deposit was not paid in time'
     WHERE status = 'pending' AND created_at < datetime('now', ?)`,
    [`-${Math.max(5, minutes)} minutes`],
  );
  return res.changes;
}

export function bookingStats() {
  const open = get<{ c: number }>(`SELECT COUNT(*) c FROM bookings WHERE status IN ('pending','deposit_paid','confirmed')`);
  const unpaid = get<{ c: number }>("SELECT COUNT(*) c FROM bookings WHERE status = 'pending'");
  const today = get<{ c: number; d: number }>(
    `SELECT COUNT(*) c, COALESCE(SUM(balance),0) d FROM bookings
     WHERE session_date = date('now') AND status IN ('deposit_paid','confirmed')`,
  );
  const outstanding = get<{ s: number }>(
    `SELECT COALESCE(SUM(balance),0) s FROM bookings WHERE status IN ('deposit_paid','confirmed')`,
  );
  const collected = get<{ s: number }>(
    "SELECT COALESCE(SUM(deposit),0) s FROM bookings WHERE status IN ('deposit_paid','confirmed','completed')",
  );
  return {
    open: open?.c || 0,
    unpaid: unpaid?.c || 0,
    today: today?.c || 0,
    dueToday: today?.d || 0,
    outstanding: outstanding?.s || 0,
    collected: collected?.s || 0,
  };
}

export function servicePriceSummary(s: StudioService) {
  const { deposit } = splitPrice(s.price_per_hour * s.min_hours);
  return {
    from: s.price_per_hour * s.min_hours,
    depositFrom: deposit,
    hours:
      s.min_hours === s.max_hours
        ? `${s.min_hours} hr${s.min_hours === 1 ? '' : 's'}`
        : `${s.min_hours}–${s.max_hours} hrs`,
  };
}

export function openingHoursLabel() {
  const days = openWeekdays();
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysLabel =
    days.length === 7
      ? 'Every day'
      : days.length === 6 && !days.includes(0)
        ? 'Mon – Sat'
        : days.length === 5 && days[0] === 1 && days[4] === 5
          ? 'Mon – Fri'
          : days.map((d) => names[d].slice(0, 3)).join(', ') || 'Not set';
  return `${daysLabel} · ${fmtHour(openHour())} – ${fmtHour(closeHour())}`;
}

export function fmtHour(h: number) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${base}:00 ${suffix}`;
}

export function getBookingByReference(reference: string) {
  return getBookingByRef(reference);
}

/** Admin view: bookings in a date window, newest day first. */
export function listUpcomingBookings(daysAhead = 60) {
  return all<Booking & { service_slug: string; artist_name: string | null }>(
    `SELECT b.*, s.slug AS service_slug, u.artist_name
     FROM bookings b
     LEFT JOIN studio_services s ON s.id = b.service_id
     LEFT JOIN users u ON u.id = b.user_id
     WHERE b.session_date BETWEEN date('now') AND date('now', ?)
       AND b.status IN ('pending','deposit_paid','confirmed')
     ORDER BY b.session_date ASC, b.start_time ASC`,
    [`${Math.max(1, daysAhead)} days`],
  );
}

export function countOpenHolds() {
  return get<{ c: number }>("SELECT COUNT(*) c FROM bookings WHERE status = 'pending'")?.c || 0;
}

/** Money summary for the studio, counting paid deposits and unpaid balances. */
export function bookingTotals() {
  const row = get<{ paid: number; due: number; sessions: number }>(
    `SELECT COALESCE(SUM(CASE WHEN status IN ('deposit_paid','confirmed','completed') THEN deposit ELSE 0 END),0) AS paid,
            COALESCE(SUM(CASE WHEN status IN ('deposit_paid','confirmed') THEN balance ELSE 0 END),0) AS due,
            COUNT(*) AS sessions
     FROM bookings`,
  );
  return { paid: row?.paid || 0, due: row?.due || 0, sessions: row?.sessions || 0 };
}

export function isSlotTaken(date: string, start: string, hours: number, ignoreReference?: string) {
  return slotBusy(date, start, hours, ignoreReference);
}

export function updateBooking(id: number, patch: Partial<Booking>) {
  const keys = Object.keys(patch).filter((k) =>
    [
      'service_id',
      'hours',
      'session_date',
      'start_time',
      'end_time',
      'name',
      'email',
      'phone',
      'notes',
      'price',
      'deposit',
      'balance',
      'status',
      'method',
      'cancel_reason',
    ].includes(k),
  );
  if (!keys.length) return 0;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const params = keys.map((k) => {
    const v = (patch as Record<string, unknown>)[k];
    if (k === 'hours' || k === 'price' || k === 'deposit' || k === 'balance') return Number(v || 0);
    if (k === 'service_id') return v == null ? null : Number(v);
    return String(v ?? '');
  });
  return run(`UPDATE bookings SET ${sets} WHERE id = ?`, [...params, id]).changes;
}

export function deleteBooking(id: number) {
  return run('DELETE FROM bookings WHERE id = ?', [id]).changes;
}

export function recalcBookingMoney(b: Booking) {
  const price = Number(b.price || 0);
  const { deposit, balance } = splitPrice(price, b.deposit_percent || depositPercent());
  return { price, deposit, balance };
}
