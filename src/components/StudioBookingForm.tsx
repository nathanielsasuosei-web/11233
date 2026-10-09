'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

export type BookableService = {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  includes: string;
  price_per_hour: number;
  min_hours: number;
  max_hours: number;
};

type Slot = { time: number; free: boolean };

const METHODS = [
  { id: 'mobile_money', label: 'MTN Mobile Money', icon: '📱' },
  { id: 'telecel', label: 'Telecel Cash', icon: '📶' },
  { id: 'at', label: 'AirtelTigo Money', icon: '📳' },
  { id: 'card', label: 'Debit / Credit Card', icon: '💳' },
] as const;

function prettyTime(mins: number) {
  const h = Math.floor(mins / 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${base}:${String(mins % 60).padStart(2, '0')} ${suffix}`;
}

function to24(t: number) {
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export default function StudioBookingForm({
  services,
  depositPercent,
  today,
  defaultService,
  person,
  policy,
  hours: hoursLabel,
}: {
  services: BookableService[];
  depositPercent: number;
  today: string;
  defaultService?: string;
  person: { name: string; email: string; phone: string };
  policy: string;
  hours: string;
}) {
  const money = useMoney();
  const toast = useToast();

  const [serviceId, setServiceId] = useState<number>(() => {
    const hit = services.find((s) => s.slug === defaultService) || services[0];
    return hit ? hit.id : 0;
  });
  const service = services.find((s) => s.id === serviceId) || services[0];

  const [hours, setHours] = useState<number>(service?.min_hours || 1);
  const [date, setDate] = useState<string>(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsClosed, setSlotsClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [form, setForm] = useState(person);
  const [method, setMethod] = useState<string>('mobile_money');
  const [payPhone, setPayPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!service) return;
    setHours((h) => Math.min(Math.max(h, service.min_hours), service.max_hours));
  }, [service]);

  const load = useCallback(async () => {
    if (!service || !date) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/studio/slots?service=${service.id}&date=${date}&hours=${hours}`,
        { cache: 'no-store' },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load the calendar');
      setSlotsClosed(Boolean(json.closed));
      setSlots((json.slots || []).map((s: any) => ({
        time: Number(String(s.time).split(':')[0]) * 60 + Number(String(s.time).split(':')[1] || 0),
        free: Boolean(s.free),
      })));
    } catch (err: any) {
      toast(err.message || 'Could not load the calendar', 'err');
      setSlots([]);
      setSlotsClosed(false);
    } finally {
      setLoadingSlots(false);
    }
  }, [service, date, hours, toast]);

  useEffect(() => {
    setStart(null);
    load();
  }, [load]);

  const price = (service?.price_per_hour || 0) * hours;
  const deposit = Math.round((price * depositPercent) / 100);
  const balance = price - deposit;
  const hourOptions = useMemo(() => {
    if (!service) return [];
    const out: number[] = [];
    for (let h = service.min_hours; h <= service.max_hours; h++) out.push(h);
    return out;
  }, [service]);

  async function submit(holdOnly = false) {
    if (!service) return;
    if (!date) return toast('Pick a date', 'err');
    if (start == null) return toast('Pick a start time', 'err');
    if (form.name.trim().length < 2) return toast('Tell us who is coming in', 'err');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast('Enter a valid email address', 'err');
    if (form.phone.replace(/\D/g, '').length < 9) return toast('Enter a phone number we can call', 'err');
    if (method !== 'card' && payPhone.replace(/\D/g, '').length < 9) {
      return toast('Enter the number that will pay the deposit', 'err');
    }

    setBusy(true);
    try {
      const res = await fetch('/api/studio/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          hours,
          date,
          start: to24(start as number),
          name: form.name,
          email: form.email,
          phone: form.phone,
          notes,
          method: method === 'card' ? 'card' : 'mobile_money',
          payPhone: payPhone ? `${METHODS.find((m) => m.id === method)?.label} · ${payPhone}` : '',
          holdOnly,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || 'Could not create the booking', 'err');
        load();
        return;
      }
      if (holdOnly) {
        window.location.href = json.authorization_url || `/studio/confirm?reference=${json.reference}`;
        return;
      }
      window.location.href = json.authorization_url || `/studio/confirm?reference=${json.reference}`;
    } catch {
      toast('Network error — please try again', 'err');
    } finally {
      setBusy(false);
    }
  }

  if (!services.length) {
    return (
      <div className="card p-8 text-center">
        <h3 className="display text-lg text-white">No sessions on the calendar yet</h3>
        <p className="mt-2 text-sm text-white/45">
          The studio has not published any bookable services.{' '}
          <Link href="/contact" className="text-brand-300 hover:underline">
            Send a message
          </Link>{' '}
          and we will sort it out.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
      <div className="space-y-5">
        {/* 1 · service */}
        <section className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg">1 · SERVICE</h2>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  s.id === serviceId
                    ? 'border-brand-500/60 bg-brand-500/[.08] shadow-[0_0_40px_-20px_rgba(255,45,58,.9)]'
                    : 'border-white/[.08] bg-white/[.02] hover:border-white/20'
                }`}
              >
                <div className="text-[13px] font-bold text-white">{s.title}</div>
                <div className="mt-1 text-[11px] font-semibold text-brand-300">
                  {money(s.price_per_hour)}/hr
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[.14em] text-white/35">
                  {s.min_hours === s.max_hours
                    ? `${s.min_hours} hr`
                    : `${s.min_hours}–${s.max_hours} hrs`}{' '}
                  · {depositPercent}% deposit
                </div>
              </button>
            ))}
          </div>
          {service?.blurb && (
            <p className="mt-4 animate-fade-up text-[12px] leading-relaxed text-white/45">
              {service.blurb}
            </p>
          )}
        </section>

        {/* 2 · date & duration */}
        <section className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg">2 · DATE &amp; DURATION</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="studio-date">
                Date
              </label>
              <input
                id="studio-date"
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Duration</label>
              <div className="flex flex-wrap gap-1.5">
                {hourOptions.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHours(h)}
                    className={`min-w-[54px] rounded-xl border px-3 py-2.5 text-[12px] font-bold transition ${
                      hours === h
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-white/10 bg-white/[.03] text-white/55 hover:text-white'
                    }`}
                  >
                    {h} hr{h === 1 ? '' : 's'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3 · time */}
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display text-lg">3 · START TIME</h2>
            <span className="text-[11px] uppercase tracking-[.14em] text-white/35">{hoursLabel}</span>
          </div>
          {slotsClosed ? (
            <p className="rounded-xl border border-amber-500/25 bg-amber-500/[.06] p-4 text-[12px] text-amber-100/80">
              The studio is closed on that day. Pick another date.
            </p>
          ) : loadingSlots ? (
            <p className="p-2 text-[12px] text-white/35">Checking the calendar…</p>
          ) : !slots.length ? (
            <p className="p-2 text-[12px] text-white/35">
              No free start times for a {hours}-hour session on {date}.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => (
                <button
                  key={s.time}
                  disabled={!s.free}
                  onClick={() => setStart(s.time)}
                  className={`rounded-xl border px-2 py-2.5 text-[12px] font-bold transition ${
                    start === s.time
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : s.free
                        ? 'border-white/10 bg-white/[.03] text-white/70 hover:border-brand-500/50 hover:text-white'
                        : 'cursor-not-allowed border-white/[.05] bg-white/[.01] text-white/20 line-through'
                  }`}
                >
                  {prettyTime(s.time)}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-white/30">
            Crossed-out times are already held by another artist.
          </p>
        </section>

        {/* 4 · notes */}
        <section className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg">4 · NOTES FOR THE ENGINEER</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="How many songs, reference tracks, whether you want stems…"
            className="input resize-y"
          />
        </section>

        {/* 5 · details */}
        <section className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg">5 · YOUR DETAILS</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <input value={form.name} onChange={set('name')} className="input" placeholder="Ama Serwaa" />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                value={form.email}
                onChange={set('email')}
                className="input"
                placeholder="you@email.com"
                type="email"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Phone</label>
              <input
                value={form.phone}
                onChange={set('phone')}
                className="input"
                placeholder="055 000 0000"
                inputMode="tel"
              />
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/35">
            Your confirmation and receipt go to this address.
          </p>

          <div className="mt-5">
            <div className="label">Pay deposit with</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[12px] font-bold transition ${
                    method === m.id
                      ? 'border-brand-500/60 bg-brand-500/[.08] text-white'
                      : 'border-white/[.08] bg-white/[.02] text-white/55 hover:text-white'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
            {method !== 'card' && (
              <div className="mt-3 animate-fade-up">
                <label className="label">Mobile money number</label>
                <input
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  className="input"
                  placeholder="055 000 0000"
                  inputMode="tel"
                />
                <p className="mt-2 text-[11px] text-white/35">
                  You will get a prompt on this number. Approve it with your PIN.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* summary rail */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5 sm:p-6">
          <h2 className="display mb-4 text-lg">SUMMARY</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-white/45">{service?.title || 'Session'}</dt>
              <dd className="font-semibold text-white">
                {hours} × {money(service?.price_per_hour || 0)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/45">Session total</dt>
              <dd className="font-bold text-white">{money(price)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/[.07] pt-2.5">
              <dt className="text-white/45">
                Deposit to lock slot
                <span className="ml-1 text-[10px] uppercase tracking-[.14em] text-brand-300">
                  {depositPercent}%
                </span>
              </dt>
              <dd className="font-bold text-brand-300">{money(deposit)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/45">Balance at the studio</dt>
              <dd className="font-semibold text-white">{money(balance)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-white/[.07] pt-4">
            <span className="text-[11px] font-bold uppercase tracking-[.16em] text-white/40">
              Pay now
            </span>
            <span className="display text-3xl text-white">{money(deposit)}</span>
          </div>

          <button
            onClick={() => submit(false)}
            disabled={busy || start == null}
            className="btn-red mt-5 w-full !py-4 text-sm disabled:opacity-50"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Starting payment…
              </>
            ) : start == null ? (
              'Choose a start time to continue'
            ) : (
              <>Pay deposit →</>
            )}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={busy || start == null}
            className="mt-2.5 w-full rounded-xl border border-white/10 bg-white/[.02] px-4 py-3 text-[11px] font-bold uppercase tracking-[.14em] text-white/50 transition hover:border-white/25 hover:text-white disabled:opacity-40"
          >
            Hold my slot, pay at the studio
          </button>

          <p className="mt-4 text-[10px] uppercase tracking-[.14em] text-white/25">
            🔒 Secured by Paystack · we never see your PIN
          </p>

          <div className="mt-5 rounded-xl border border-white/[.07] bg-white/[.02] p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/40">
              Booking policy
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">{policy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
