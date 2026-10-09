'use client';

import { useState } from 'react';
import { timeAgo } from '@/lib/utils';

export type EmailRow = {
  id: number;
  to_email: string;
  subject: string;
  body: string;
  kind: string;
  status: string;
  error: string;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  beat_delivery: 'Beat delivery',
  order_receipt: 'Order receipt',
  welcome: 'Welcome',
  contact: 'Contact form',
  message_reply: 'Message reply',
  admin_notice: 'Admin notice',
  general: 'General',
};

export default function OutboxClient({ emails, smtp }: { emails: EmailRow[]; smtp: boolean }) {
  const [open, setOpen] = useState<EmailRow | null>(null);

  return (
    <>
      {!smtp && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[.07] p-4">
          <span className="text-lg">ℹ️</span>
          <p className="text-[12px] leading-relaxed text-amber-200/80">
            <b className="text-amber-200">Outbox mode.</b> SMTP is not configured, so every message
            the app sends is composed and stored here instead of being delivered. Add SMTP
            credentials in Settings → Email to start sending for real.
          </p>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-white/[.07]">
            <tr>
              <th className="table-th">To</th>
              <th className="table-th">Subject</th>
              <th className="table-th">Type</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.05]">
            {emails.map((e) => (
              <tr
                key={e.id}
                onClick={() => setOpen(e)}
                className="cursor-pointer hover:bg-white/[.02]"
              >
                <td className="table-td truncate">{e.to_email}</td>
                <td className="table-td max-w-[280px] truncate">{e.subject}</td>
                <td className="table-td text-[12px] text-white/50">
                  {KIND_LABEL[e.kind] || e.kind}
                </td>
                <td className="table-td">
                  <span
                    className={`chip ${
                      e.status === 'sent'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : e.status === 'failed'
                          ? 'border-red-500/30 bg-red-500/10 text-red-300'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {e.status === 'outbox' ? 'stored' : e.status}
                  </span>
                </td>
                <td className="table-td text-right text-[11px] text-white/30">
                  {timeAgo(e.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {emails.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-white/40">
            No emails yet. They appear here the moment the site sends one.
          </p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl animate-fade-up overflow-hidden rounded-3xl border border-white/10 bg-ink-850">
            <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-4">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-white">{open.subject}</div>
                <div className="text-[11px] text-white/35">to {open.to_email}</div>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto bg-white p-4">
              <iframe
                title="Email preview"
                srcDoc={open.body}
                className="h-[52vh] w-full rounded-xl border-0 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
