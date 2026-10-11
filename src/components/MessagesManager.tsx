'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/components/SettingsProvider';
import { useToast } from '@/components/Toast';
import { buildWhatsAppUrl, timeAgo } from '@/lib/utils';

export type AdminMessage = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
  kind?: string;
  reference?: string;
  whatsapp_url?: string;
  status: string;
  admin_reply: string;
  replied_at: string | null;
  created_at: string;
};

const KIND_BADGE: Record<string, { label: string; tone: string }> = {
  booking: {
    label: '🎙️ Booking',
    tone: 'border-brand-500/35 bg-brand-500/15 text-brand-200',
  },
  order: {
    label: '🧾 Beat Order',
    tone: 'border-amber-500/35 bg-amber-500/15 text-amber-200',
  },
  enquiry: {
    label: '✉️ Enquiry',
    tone: 'border-white/15 bg-white/5 text-white/60',
  },
};

export default function MessagesManager({ messages }: { messages: AdminMessage[] }) {
  const [active, setActive] = useState<AdminMessage | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('unread');
  const { settings } = useSettings();
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const countryCode = settings.whatsapp_country_code || '233';
  const producerPhone =
    settings.whatsapp_number || settings.studio_phone || settings.momo_number || '055 000 0000';

  const shown = messages.filter((m) => {
    const kind = m.kind || 'enquiry';
    if (filter === 'all') return true;
    if (filter === 'unread') return m.status === 'unread';
    if (filter === 'read') return m.status === 'read';
    if (filter === 'booking') return kind === 'booking';
    if (filter === 'order') return kind === 'order';
    if (filter === 'enquiry') return kind === 'enquiry';
    return true;
  });

  function artistWhatsAppHref(m: AdminMessage, customReply?: string) {
    if (!m.phone) return '';
    const text =
      customReply && customReply.trim()
        ? customReply.trim()
        : m.kind === 'booking'
          ? `Hi ${m.name.split(' ')[0]}, this is ${settings.producer_name || 'the studio'} regarding your studio booking (${m.reference || m.subject}).`
          : m.kind === 'order'
            ? `Hi ${m.name.split(' ')[0]}, this is ${settings.producer_name || 'the producer'} regarding your beat order (${m.reference || m.subject}).`
            : `Hi ${m.name.split(' ')[0]}, thanks for your message ("${m.subject}") on ${settings.studio_name || 'Project 1'}.`;
    return buildWhatsAppUrl(m.phone, text, countryCode);
  }

  function producerWhatsAppHref(m: AdminMessage) {
    if (m.whatsapp_url) return m.whatsapp_url;
    return buildWhatsAppUrl(producerPhone, `${m.subject}\n\n${m.body}`, countryCode);
  }

  async function send(id: number, alsoOpenWhatsApp = false) {
    if (reply.trim().length < 2) {
      toast('Write a reply first', 'err');
      return;
    }
    const waHref = active && alsoOpenWhatsApp ? artistWhatsAppHref(active, reply) : '';
    const waWin = waHref ? window.open('about:blank', '_blank') : null;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send');
      if (waHref) {
        if (waWin) waWin.location.href = waHref;
        else window.open(waHref, '_blank', 'noopener,noreferrer');
      } else {
        waWin?.close();
      }
      toast(alsoOpenWhatsApp ? 'Reply saved & opened on WhatsApp' : 'Reply sent and emailed');
      setReply('');
      setActive(null);
      startTransition(() => router.refresh());
    } catch (err: any) {
      waWin?.close();
      toast(err.message || 'Could not send', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function markRead(m: AdminMessage) {
    setBusy(true);
    try {
      await fetch(`/api/admin/messages/${m.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read' }),
      });
      toast('Marked as read');
      setActive((prev) => (prev && prev.id === m.id ? { ...prev, status: 'read' } : prev));
      startTransition(() => router.refresh());
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

  const tabs: [string, string, number][] = [
    ['unread', 'Unread', messages.filter((m) => m.status === 'unread').length],
    ['booking', 'Bookings', messages.filter((m) => (m.kind || 'enquiry') === 'booking').length],
    ['order', 'Beat Orders', messages.filter((m) => (m.kind || 'enquiry') === 'order').length],
    ['enquiry', 'Enquiries', messages.filter((m) => (m.kind || 'enquiry') === 'enquiry').length],
    ['read', 'Answered', messages.filter((m) => m.status === 'read').length],
    ['all', 'All', messages.length],
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(([id, label, count]) => (
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
            <span className="ml-1.5 opacity-60">{count}</span>
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
          {shown.map((m) => {
            const kind = m.kind || 'enquiry';
            const badge = KIND_BADGE[kind] || KIND_BADGE.enquiry;
            return (
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
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`chip text-[9px] ${badge.tone}`}>{badge.label}</span>
                      {m.reference && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60">
                          {m.reference}
                        </span>
                      )}
                      {m.status === 'unread' && (
                        <span className="h-2 w-2 rounded-full bg-brand-500" title="Unread" />
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-white/25">{timeAgo(m.created_at)}</span>
                  </div>
                  <div className="truncate text-[13px] font-bold text-white">{m.subject}</div>
                  <div className="mt-1 truncate text-[12px] text-white/40">
                    {m.name} · {m.email}
                    {m.phone ? ` · ${m.phone}` : ''}
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
            );
          })}
        </ul>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {!active ? (
            <div className="card grid place-items-center px-6 py-16 text-center">
              <div className="mb-3 text-4xl">✉️</div>
              <p className="text-sm text-white/45">
                Select a booking, order or enquiry message to read, reply, or open on WhatsApp.
              </p>
            </div>
          ) : (
            <div className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`chip text-[9px] ${
                        (KIND_BADGE[active.kind || 'enquiry'] || KIND_BADGE.enquiry).tone
                      }`}
                    >
                      {(KIND_BADGE[active.kind || 'enquiry'] || KIND_BADGE.enquiry).label}
                    </span>
                    {active.reference && (
                      <span className="font-mono text-[11px] text-white/55">{active.reference}</span>
                    )}
                  </div>
                  <h2 className="display text-lg text-white">{active.subject}</h2>
                  <p className="mt-1 text-[12px] text-white/40">
                    {active.name} ·{' '}
                    <a href={`mailto:${active.email}`} className="text-brand-300 hover:underline">
                      {active.email}
                    </a>
                    {active.phone ? ` · ${active.phone}` : ''} · {timeAgo(active.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {active.status === 'unread' && (
                    <button
                      onClick={() => markRead(active)}
                      disabled={busy}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/65 transition hover:text-white"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => remove(active.id)}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Quick action links for Booking / Order + WhatsApp */}
              <div className="mt-4 flex flex-wrap gap-2">
                {active.phone && artistWhatsAppHref(active) && (
                  <a
                    href={artistWhatsAppHref(active)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-500/25 hover:text-white"
                  >
                    <span>💬</span>
                    WhatsApp {active.name.split(' ')[0]}
                  </a>
                )}
                {producerWhatsAppHref(active) && (
                  <a
                    href={producerWhatsAppHref(active)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[.08] px-3.5 py-1.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    <span>📲</span>
                    Send to my WhatsApp
                  </a>
                )}
                {active.kind === 'booking' && (
                  <>
                    <Link href="/admin/bookings" className="btn-ghost !px-3.5 !py-1.5 text-[11px]">
                      Manage in Studio Bookings →
                    </Link>
                    {active.reference && (
                      <Link
                        href={`/studio/booking/${active.reference}`}
                        target="_blank"
                        className="btn-ghost !px-3.5 !py-1.5 text-[11px]"
                      >
                        Booking receipt ↗
                      </Link>
                    )}
                  </>
                )}
                {active.kind === 'order' && (
                  <Link href="/admin/orders" className="btn-ghost !px-3.5 !py-1.5 text-[11px]">
                    Manage in Orders →
                  </Link>
                )}
              </div>

              <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/[.07] bg-white/[.02] p-4 text-[13px] leading-relaxed text-white/60">
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
                  {active.admin_reply ? 'Update your reply' : 'Reply (website inbox, email & WhatsApp)'}
                </label>
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="input resize-y"
                  placeholder="Write your reply…"
                />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => send(active.id, false)}
                    disabled={busy}
                    className="btn-red w-full !py-3 text-xs"
                  >
                    {busy ? 'Sending…' : 'Send reply by email & website'}
                  </button>
                  {active.phone ? (
                    <button
                      onClick={() => send(active.id, true)}
                      disabled={busy}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-extrabold uppercase tracking-[.1em] text-emerald-200 transition hover:bg-emerald-500/25 hover:text-white disabled:opacity-40"
                    >
                      <span>💬</span>
                      Reply &amp; Open WhatsApp
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
