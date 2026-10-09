'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useMoney } from '@/components/SettingsProvider';

export type AdminBeat = {
  id: number;
  slug: string;
  title: string;
  description: string;
  genre: string;
  mood: string;
  bpm: number;
  musical_key: string;
  tags: string;
  cover_url: string;
  audio_url: string;
  preview_url: string;
  video_url: string;
  price_basic: number;
  price_premium: number;
  price_exclusive: number;
  price_buyout: number;
  status: string;
  featured: number;
  plays: number;
  sales: number;
};

const BLANK: AdminBeat = {
  id: 0,
  slug: '',
  title: '',
  description: '',
  genre: 'Afrobeats',
  mood: '',
  bpm: 100,
  musical_key: '',
  tags: '',
  cover_url: '',
  audio_url: '',
  preview_url: '',
  video_url: '',
  price_basic: 5000,
  price_premium: 12000,
  price_exclusive: 40000,
  price_buyout: 120000,
  status: 'published',
  featured: 0,
  plays: 0,
  sales: 0,
};

const GENRES = [
  'Afrobeats',
  'Amapiano',
  'Drill',
  'Afro Drill',
  'Trap',
  'Highlife',
  'R&B',
  'Gospel',
  'Dancehall',
  'Pop',
];

export default function BeatsManager({ beats }: { beats: AdminBeat[] }) {
  const [editing, setEditing] = useState<AdminBeat | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const params = useSearchParams();
  const money = useMoney();

  useEffect(() => {
    if (params.get('new') === '1') setEditing({ ...BLANK });
  }, [params]);

  const filtered = beats.filter((b) =>
    !query
      ? true
      : `${b.title} ${b.genre} ${b.tags} ${b.mood}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(editing).forEach(([k, v]) => fd.append(k, String(v ?? '')));
      ['price_basic', 'price_premium', 'price_exclusive', 'price_buyout'].forEach((k) => {
        fd.set(k, String((Number(editing[k as keyof AdminBeat]) || 0) / 100));
      });
      fd.set('featured', editing.featured ? '1' : '0');

      const grab = (id: string, key: string) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el?.files?.[0]) fd.set(key, el.files[0]);
      };
      grab('beat-cover', 'cover');
      grab('beat-audio', 'audio');
      grab('beat-preview', 'preview');

      const res = await fetch('/api/admin/beats', {
        method: editing.id ? 'PUT' : 'POST',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not save');
      toast(editing.id ? 'Beat updated' : 'Beat published');
      setEditing(null);
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast(err.message || 'Could not save', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function remove(beat: AdminBeat) {
    if (!confirm(`Delete "${beat.title}"? Past orders keep their history.`)) return;
    const res = await fetch(`/api/admin/beats?id=${beat.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Beat deleted');
      startTransition(() => router.refresh());
    } else toast('Could not delete', 'err');
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search beats…"
          className="input max-w-xs"
        />
        <button onClick={() => setEditing({ ...BLANK })} className="btn-red !px-6 text-xs">
          + New beat
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-white/[.07]">
            <tr>
              <th className="table-th">Beat</th>
              <th className="table-th">Genre</th>
              <th className="table-th">BPM</th>
              <th className="table-th">From</th>
              <th className="table-th">Sales</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.05]">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-white/[.02]">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                      {b.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-800 to-ink-900 text-[8px] font-black text-white/50">
                          BV
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{b.title}</div>
                      <div className="text-[11px] text-white/30">
                        {b.audio_url ? 'file attached' : 'no file'} · {b.plays} plays
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-td">{b.genre}</td>
                <td className="table-td">{b.bpm}</td>
                <td className="table-td font-bold text-white">{money(b.price_basic)}</td>
                <td className="table-td">{b.sales}</td>
                <td className="table-td">
                  <span
                    className={`chip ${
                      b.status === 'published'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : b.status === 'sold'
                          ? 'border-brand-500/30 bg-brand-500/10 text-brand-300'
                          : 'border-white/10 bg-white/5 text-white/50'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="table-td text-right">
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/beats/${b.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-dark !px-3 !py-1.5 text-[11px]"
                    >
                      View
                    </a>
                    <button
                      onClick={() => setEditing({ ...b })}
                      className="btn-ghost !px-3 !py-1.5 text-[11px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(b)}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-white/40">No beats found.</p>
        )}
      </div>

      {editing && (
        <BeatEditor
          beat={editing}
          setBeat={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
          busy={busy}
        />
      )}
    </>
  );
}

function BeatEditor({
  beat,
  setBeat,
  onClose,
  onSave,
  busy,
}: {
  beat: AdminBeat;
  setBeat: (b: AdminBeat) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  busy: boolean;
}) {
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const set =
    (k: keyof AdminBeat) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setBeat({ ...beat, [k]: e.target.value });

  const moneyField = (k: keyof AdminBeat, label: string) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-white/35">
          GH₵
        </span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={Number(beat[k]) / 100}
          onChange={(e) => setBeat({ ...beat, [k]: Math.round(Number(e.target.value) * 100) })}
          className="input !pl-11"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <form
        onSubmit={onSave}
        className="mx-auto my-4 w-full max-w-3xl animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-ink-850"
      >
        <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-4">
          <div>
            <h2 className="display text-lg text-white">
              {beat.id ? 'EDIT BEAT' : 'UPLOAD A BEAT'}
            </h2>
            <p className="text-[11px] text-white/35">
              {beat.id ? beat.slug : 'Files upload to your configured storage'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(100svh-260px)] space-y-6 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input
                ref={firstField}
                required
                value={beat.title}
                onChange={set('title')}
                className="input"
                placeholder="Midnight In Accra"
              />
            </div>
            <div>
              <label className="label">Genre</label>
              <select value={beat.genre} onChange={set('genre')} className="input appearance-none">
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-ink-800">
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mood</label>
              <input value={beat.mood} onChange={set('mood')} className="input" placeholder="Smooth" />
            </div>
            <div>
              <label className="label">BPM</label>
              <input type="number" min={40} max={220} value={beat.bpm} onChange={set('bpm')} className="input" />
            </div>
            <div>
              <label className="label">Musical key</label>
              <input
                value={beat.musical_key}
                onChange={set('musical_key')}
                className="input"
                placeholder="F Minor"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tags (comma separated)</label>
              <input
                value={beat.tags}
                onChange={set('tags')}
                className="input"
                placeholder="afrobeats, log drum, romantic"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                rows={3}
                value={beat.description}
                onChange={set('description')}
                className="input resize-y"
              />
            </div>
          </div>

          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/40">
              Licence pricing
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {moneyField('price_basic', 'Basic lease (MP3)')}
              {moneyField('price_premium', 'Premium lease (WAV)')}
              {moneyField('price_exclusive', 'Exclusive rights')}
              {moneyField('price_buyout', 'Buyout / sync')}
            </div>
          </div>

          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/40">
              Media
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FileField
                id="beat-cover"
                label="Cover art"
                accept="image/*"
                current={beat.cover_url}
                hint="JPG / PNG / SVG"
              />
              <FileField
                id="beat-audio"
                label="Full audio (delivered)"
                accept="audio/*,.wav,.mp3,.zip"
                current={beat.audio_url}
                hint="MP3 / WAV / ZIP"
              />
              <FileField
                id="beat-preview"
                label="Preview (tagged)"
                accept="audio/*,.wav,.mp3"
                current={beat.preview_url}
                hint="Optional"
              />
            </div>
            <div className="mt-4">
              <label className="label">Video URL (YouTube or uploaded file)</label>
              <input
                value={beat.video_url}
                onChange={set('video_url')}
                className="input"
                placeholder="https://youtube.com/watch?v=…"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Status</label>
              <select value={beat.status} onChange={set('status')} className="input appearance-none">
                <option value="published" className="bg-ink-800">
                  Published
                </option>
                <option value="draft" className="bg-ink-800">
                  Draft (hidden)
                </option>
                <option value="sold" className="bg-ink-800">
                  Sold / retired
                </option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[.02] px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={!!beat.featured}
                  onChange={(e) => setBeat({ ...beat, featured: e.target.checked ? 1 : 0 })}
                  className="h-4 w-4 accent-[#ff2d3a]"
                />
                <span className="text-[13px] font-semibold text-white">
                  Feature on the homepage
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/[.07] px-6 py-4">
          <button type="button" onClick={onClose} className="btn-ghost !px-6 text-xs">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn-red !px-7 text-xs">
            {busy ? 'Saving…' : beat.id ? 'Save changes' : 'Publish beat'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FileField({
  id,
  label,
  accept,
  current,
  hint,
}: {
  id: string;
  label: string;
  accept: string;
  current: string;
  hint: string;
}) {
  const [preview, setPreview] = useState(current);
  const [name, setName] = useState('');

  return (
    <div>
      <label className="label">{label}</label>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[.02] px-3 py-5 text-center transition hover:border-brand-500/50 hover:bg-brand-500/[.04]"
      >
        {preview && id === 'beat-cover' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <span className="text-xl">⬆</span>
        )}
        <span className="truncate px-1 text-[11px] font-semibold text-white/70">
          {name || (current ? 'Replace file' : 'Choose file')}
        </span>
        <span className="text-[10px] text-white/30">{hint}</span>
        <input
          id={id}
          name={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setName(f.name);
            setPreview(URL.createObjectURL(f));
          }}
        />
      </label>
      {current && (
        <div className="mt-1.5 truncate text-[10px] text-white/25" title={current}>
          {current}
        </div>
      )}
    </div>
  );
}
