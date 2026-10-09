import { requireArtist } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { all } from '@/lib/db';
import { timeAgo } from '@/lib/utils';
import DashboardMessageForm from './DashboardMessageForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Messages — Beatvault' };

export default async function MessagesPage() {
  const user = await requireArtist();
  if (!user) redirect('/login?next=/dashboard/messages');
  const messages = all<any>(
    'SELECT * FROM messages WHERE user_id = ? OR email = ? ORDER BY id DESC',
    [Number(user.id), user.email],
  );

  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
          <span className="h-[2px] w-7 bg-brand-500" />
          Studio inbox
        </div>
        <h1 className="display text-[clamp(1.9rem,4.6vw,3rem)] text-white">
          MES<span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">SAGES</span>
        </h1>
        <p className="mt-3 text-sm text-white/45">
          Questions, custom orders and replies from the producer. Replies land in your email too.
        </p>
      </div>

      <div className="space-y-6">
        <DashboardMessageForm name={user.name} email={user.email} />

        <section>
          <h2 className="display mb-4 text-lg text-white">
            YOUR <span className="text-brand-500">THREADS</span>
          </h2>

          {messages.length === 0 ? (
            <div className="card grid place-items-center px-6 py-12 text-center">
              <div className="mb-3 text-3xl">✉️</div>
              <p className="text-sm text-white/45">No messages yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[14px] font-bold text-white">{m.subject}</div>
                    <div className="flex items-center gap-2">
                      {m.admin_reply ? (
                        <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                          Replied
                        </span>
                      ) : (
                        <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-300">
                          Awaiting reply
                        </span>
                      )}
                      <span className="text-[11px] text-white/30">{timeAgo(m.created_at)}</span>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-white/55">
                    {m.body}
                  </p>

                  {m.admin_reply && (
                    <div className="mt-4 rounded-2xl border-l-2 border-brand-500 bg-brand-950/25 p-4">
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-brand-300">
                        Producer&apos;s reply
                      </div>
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/75">
                        {m.admin_reply}
                      </p>
                      <div className="mt-2 text-[10px] text-white/25">{timeAgo(m.replied_at)}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
