'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { timeAgo } from '@/lib/utils';

export type AdminMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: string;
  admin_reply: string;
  replied_at: string | null;
  created_at: string;
};

export default function MessagesManager({ messages }: { messages: AdminMessage[] }) {
  const [active, setActive] = useState<AdminMessage | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('unread');
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const shown = messages.filter((m) =>
    filter === 'all' ? true : filter === 'unread' ? m.status === 'unread' : m.status === 'read',
  );

  async function send(id: number) {
    if (reply.trim().length < 2) {
      toast('Write a reply first', 'err');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send');
      toast('Reply sent and emailed');
      setReply('');
      setActive(null);
      startTransition(() => router.refresh());
    } catch (err: any) {
      toast(err.message || 'Could not send', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this message?')) return;
    await fetch(`/api/admin/messages/${id}/reply`, { method: 'DELETE' });
    setActive(null);
    toast('Message deleted');
    startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="mb-6 flex gap-2">
        {[
          ['unread', 'Unread'],
          ['read', 'Answered'],
          ['all', 'All'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[.1em] transition ${
              filter === id
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-white/10 bg-white/[.03] text-white/50 hover:text-white'
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-60">
              {id === 'all'
                ? messages.length
                : messages.filter((m) => m.status === id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <ul className="space-y-3">
          {shown.length === 0 && (
            <li className="card px-6 py-12 text-center text-sm text-white/40">
              Nothing in this folder.
            </li>
          )}
          {shown.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => {
                  setActive(m);
                  setReply(m.admin_reply || '');
                }}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active?.id === m.id
                    ? 'border-brand-500/50 bg-brand-500/[.06]'
                    : 'border-white/[.07] bg-ink-850/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-bold text-white">{m.subject}</span>
                  <span className="shrink-0 text-[10px] text-white/25">{timeAgo(m.created_at)}</span>
                </div>
                <div className="mt-1 truncate text-[12px] text-white/40">
                  {m.name} · {m.email}
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-white/45">
                  {m.body}
                </p>
                {m.admin_reply && (
                  <span className="chip mt-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    Replied
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {!active ? (
            <div className="card grid place-items-center px-6 py-16 text-center">
              <div className="mb-3 text-4xl">✉️</div>
              <p className="text-sm text-white/45">Select a message to read and reply.</p>
            </div>
          ) : (
            <div className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="display text-lg text-white">{active.subject}</h2>
                  <p className="mt-1 text-[12px] text-white/40">
                    {active.name} ·{' '}
                    <a href={`mailto:${active.email}`} className="text-brand-300 hover:underline">
                      {active.email}
                    </a>{' '}
                    · {timeAgo(active.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => remove(active.id)}
                  className="shrink-0 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>

              <div className="mt-5 whitespace-pre-wrap rounded-2xl border border-white/[.07] bg-white/[.02] p-4 text-[13px] leading-relaxed text-white/60">
                {active.body}
              </div>

              {active.admin_reply && (
                <div className="mt-4 rounded-2xl border-l-2 border-brand-500 bg-brand-950/25 p-4">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-brand-300">
                    Your reply · {timeAgo(active.replied_at || '')}
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/75">
                    {active.admin_reply}
                  </p>
                </div>
              )}

              <div className="mt-5">
                <label className="label">
                  {active.admin_reply ? 'Update your reply' : 'Reply (emailed to the artist)'}
                </label>
                <textarea
                  rows={5}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="input resize-y"
                  placeholder="Write your reply…"
                />
                <button
                  onClick={() => send(active.id)}
                  disabled={busy}
                  className="btn-red mt-3 w-full !py-3 text-xs"
                >
                  {busy ? 'Sending…' : 'Send reply by email'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
