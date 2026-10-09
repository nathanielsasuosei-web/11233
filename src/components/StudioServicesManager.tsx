'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useMoney } from './SettingsProvider';
import { useToast } from './Toast';

export type StudioServiceRow = {
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

const BLANK: StudioServiceRow = {
  id: 0,
  slug: '',
  title: '',
  blurb: '',
  includes: '',
  icon: 'recording',
  price_per_hour: 10000,
  min_hours: 1,
  max_hours: 4,
  published: 1,
  sort: 0,
};

/** Rates and rules for bookable sessions — what artists see and pay a deposit on. */
export default function StudioServicesManager({ services }: { services: StudioServiceRow[] }) {
  const [editing, setEditing] = useState<StudioServiceRow | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const toast = useToast();
  const money = useMoney();
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(editing.id || -1);
    try {
      const res = await fetch('/api/admin/studio-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editing,
          // price travels in major units in the form, like every other money field
          price_per_hour: Number(editing.price_per_hour) / 100,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not save');
      toast(editing.id ? 'Service updated' : 'Service created');
      setEditing(null);
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast(err.message || 'Could not save', 'err');
    } finally {
      setBusy(null);
    }
  }

  async function toggle(s: StudioServiceRow) {
    setBusy(s.id);
    try {
      await fetch('/api/admin/studio-services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, published: s.published ? 0 : 1 }),
      });
      startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  async function remove(s: StudioServiceRow) {
    if (!confirm(`Hide "${s.title}" from the booking page? Past bookings keep their record.`)) return;
    setBusy(s.id);
    try {
      const res = await fetch(`/api/admin/studio-services?id=${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not hide');
      toast('Service hidden');
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast(err.message || 'Could not hide', 'err');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => setEditing({ ...BLANK })} className="btn-red !px-6 text-xs">
          + New service
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-white/[.07]">
            <tr>
              <th className="table-th">Service</th>
              <th className="table-th">Rate / hour</th>
              <th className="table-th">Length</th>
              <th className="table-th">Deposit</th>
              <th className="table-th">State</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.05]">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-white/[.02]">
                <td className="table-td">
                  <div className="font-bold text-white">{s.title}</div>
                  <div className="mt-0.5 max-w-sm truncate text-[11px] text-white/35">{s.blurb}</div>
                </td>
                <td className="table-td font-bold text-white">{money(s.price_per_hour)}</td>
                <td className="table-td">
                  {s.min_hours}–{s.max_hours}h
                </td>
                <td className="table-td text-[12px] text-brand-300">
                  from {money(Math.round((s.price_per_hour * s.min_hours) / 2))}
                </td>
                <td className="table-td">
                  <span
                    className={`chip ${
                      s.published
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-white/50'
                    }`}
                  >
                    {s.published ? 'bookable' : 'hidden'}
                  </span>
                </td>
                <td className="table-td text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing({ ...s, price_per_hour: s.price_per_hour })}
                      className="btn-ghost !px-3 !py-1.5 text-[11px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggle(s)}
                      disabled={busy === s.id}
                      className="btn-dark !px-3 !py-1.5 text-[11px]"
                    >
                      {s.published ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      onClick={() => remove(s)}
                      disabled={busy === s.id}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!services.length && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-white/40">
                  No services yet — add Recording, Mixing or Mastering to open the calendar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
          <form
            onSubmit={save}
            className="mx-auto my-4 w-full max-w-xl animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-ink-850"
          >
            <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-4">
              <h2 className="display text-lg text-white">
                {editing.id ? 'EDIT SERVICE' : 'NEW BOOKABLE SERVICE'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div>
                <label className="label">Title</label>
                <input
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="input"
                  placeholder="Recording"
                />
              </div>
              <div>
                <label className="label">Short description</label>
                <textarea
                  rows={2}
                  value={editing.blurb}
                  onChange={(e) => setEditing({ ...editing, blurb: e.target.value })}
                  className="input resize-y"
                  placeholder="Vocal tracking with an engineer on the board."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Rate / hour</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-white/35">
                      GH₵
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={Number(editing.price_per_hour) / 100}
                      onChange={(e) =>
                        setEditing({ ...editing, price_per_hour: Math.round(Number(e.target.value) * 100) })
                      }
                      className="input !pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Min hours</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={editing.min_hours}
                    onChange={(e) => setEditing({ ...editing, min_hours: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Max hours</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={editing.max_hours}
                    onChange={(e) => setEditing({ ...editing, max_hours: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Icon</label>
                  <select
                    value={editing.icon}
                    onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                    className="input appearance-none"
                  >
                    {['recording', 'mixing', 'mastering'].map((i) => (
                      <option key={i} value={i} className="bg-ink-800">
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Sort order</label>
                  <input
                    type="number"
                    min="0"
                    value={editing.sort}
                    onChange={(e) => setEditing({ ...editing, sort: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">What is included (one per line)</label>
                <textarea
                  rows={3}
                  value={(editing.includes || '').split('|').join('\n')}
                  onChange={(e) =>
                    setEditing({ ...editing, includes: e.target.value.split('\n').join('|') })
                  }
                  className="input resize-y"
                  placeholder={'Raw mix down\nStems on request'}
                />
              </div>
              <label className="flex items-center gap-2.5 text-[12px] text-white/60">
                <input
                  type="checkbox"
                  checked={Boolean(editing.published)}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked ? 1 : 0 })}
                  className="h-4 w-4 accent-brand-500"
                />
                Show on the booking page
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/[.07] px-6 py-4">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost !px-5 text-xs">
                Cancel
              </button>
              <button type="submit" disabled={busy !== null} className="btn-red !px-6 text-xs">
                {busy ? 'Saving…' : 'Save service'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
