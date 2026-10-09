'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { youtubeId } from '@/lib/utils';

export type AdminVideo = {
  id: number;
  title: string;
  description: string;
  source_type: string;
  video_url: string;
  thumbnail_url: string;
  beat_id: number | null;
  published: number;
  beat_title: string | null;
};

const BLANK = {
  title: '',
  description: '',
  source_type: 'youtube',
  video_url: '',
  beat_id: '',
  published: '1',
};

export default function VideosManager({
  videos,
  beats,
}: {
  videos: AdminVideo[];
  beats: { id: number; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      const file = (document.getElementById('video-file') as HTMLInputElement)?.files?.[0];
      if (file) fd.append('file', file);

      const res = await fetch('/api/admin/videos', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not save');
      toast('Video added');
      setOpen(false);
      setForm({ ...BLANK });
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast(err.message || 'Could not save', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function remove(v: AdminVideo) {
    if (!confirm(`Delete "${v.title}"?`)) return;
    const res = await fetch(`/api/admin/videos?id=${v.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Video deleted');
      startTransition(() => router.refresh());
    } else toast('Could not delete', 'err');
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button onClick={() => setOpen(true)} className="btn-red !px-6 text-xs">
          + Add video
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {videos.map((v) => {
          const yt = youtubeId(v.video_url);
          const thumb =
            v.thumbnail_url || (yt ? `https://i.ytimg.com/vi/${yt}/mqdefault.jpg` : '');
          return (
            <div key={v.id} className="card overflow-hidden">
              <div className="relative aspect-video bg-ink-900">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-full w-full object-cover opacity-80" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-900 to-ink-900 text-xs uppercase tracking-[.2em] text-white/30">
                    Video file
                  </div>
                )}
                <span className="chip absolute bottom-2 left-2 border-white/10 bg-black/70">
                  {v.source_type === 'youtube' ? 'YouTube' : 'Uploaded'}
                </span>
                {!v.published && (
                  <span className="chip absolute right-2 top-2 border-amber-500/30 bg-amber-500/20 text-amber-200">
                    Hidden
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-[14px] font-bold text-white">{v.title}</h3>
                {v.beat_title && (
                  <div className="mt-1 text-[11px] text-brand-300">Linked: {v.beat_title}</div>
                )}
                {v.description && (
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/35">
                    {v.description}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <a
                    href={v.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-dark !px-3 !py-1.5 text-[11px]"
                  >
                    Open
                  </a>
                  <button
                    onClick={() => remove(v)}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {videos.length === 0 && (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <div className="mb-3 text-4xl">🎬</div>
          <h3 className="display text-lg text-white">No videos yet</h3>
          <p className="mt-2 max-w-sm text-sm text-white/45">
            Paste a YouTube link or upload an MP4 to show studio sessions on the site.
          </p>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
          <form
            onSubmit={save}
            className="mx-auto my-6 w-full max-w-xl animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-ink-850"
          >
            <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-4">
              <h2 className="display text-lg text-white">ADD VIDEO</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Studio session — log drum breakdown"
                />
              </div>

              <div>
                <label className="label">Source</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'youtube', label: 'YouTube link', icon: '▶' },
                    { id: 'file', label: 'Upload file', icon: '⬆' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setForm({ ...form, source_type: s.id })}
                      className={`rounded-xl border p-3 text-[13px] font-semibold transition ${
                        form.source_type === s.id
                          ? 'border-brand-500/60 bg-brand-500/[.08] text-white'
                          : 'border-white/[.08] bg-white/[.02] text-white/50'
                      }`}
                    >
                      <span className="mr-2">{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.source_type === 'youtube' ? (
                <div>
                  <label className="label">YouTube URL</label>
                  <input
                    required
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    className="input"
                    placeholder="https://youtube.com/watch?v=…"
                  />
                </div>
              ) : (
                <div>
                  <label className="label">Video file (MP4 / WebM)</label>
                  <input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    required
                    className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-white"
                  />
                </div>
              )}

              <div>
                <label className="label">Link to a beat (optional)</label>
                <select
                  value={form.beat_id}
                  onChange={(e) => setForm({ ...form, beat_id: e.target.value })}
                  className="input appearance-none"
                >
                  <option value="" className="bg-ink-800">
                    None
                  </option>
                  {beats.map((b) => (
                    <option key={b.id} value={b.id} className="bg-ink-800">
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input resize-y"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[.02] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.published === '1'}
                  onChange={(e) => setForm({ ...form, published: e.target.checked ? '1' : '0' })}
                  className="h-4 w-4 accent-[#ff2d3a]"
                />
                <span className="text-[13px] font-semibold text-white">Show on the website</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/[.07] px-6 py-4">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost !px-6 text-xs">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-red !px-7 text-xs">
                {busy ? 'Saving…' : 'Add video'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
