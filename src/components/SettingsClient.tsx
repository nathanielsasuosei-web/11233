'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const FIELDS: { section: string; key: string; label: string; placeholder?: string; help?: string; type?: string }[] = [
  { section: 'Studio', key: 'studio_name', label: 'Studio / brand name', placeholder: 'PROJECT 1' },
  { section: 'Studio', key: 'producer_name', label: 'Producer name', placeholder: 'Nathaniel Sasuosei' },
  { section: 'Studio', key: 'tagline', label: 'Tagline', placeholder: 'Beats and studio work from Accra' },
  { section: 'Studio', key: 'support_email', label: 'Public support email', placeholder: 'hello@beatvault.gh' },

  { section: 'Homepage', key: 'hero_headline', label: 'Hero headline (line 1)', placeholder: 'SOUND THAT' },
  { section: 'Homepage', key: 'hero_headline_accent', label: 'Hero headline (line 2)', placeholder: 'MOVES CROWDS' },
  { section: 'Homepage', key: 'hero_sub', label: 'Hero paragraph', placeholder: 'Buy exclusive Afrobeat…', type: 'textarea' },

  { section: 'Currency', key: 'currency', label: 'Currency code', placeholder: 'GHS' },
  { section: 'Currency', key: 'currency_symbol', label: 'Currency symbol', placeholder: 'GH₵' },

  { section: 'payments', key: 'paystack_public_key', label: 'Paystack public key', placeholder: 'pk_live_…', help: 'Leave blank to stay in demo checkout mode.' },
  { section: 'payments', key: 'paystack_secret_key', label: 'Paystack secret key', placeholder: 'sk_live_…', help: 'Stored in the database. You can also set PAYSTACK_SECRET_KEY in .env.' },
  { section: 'payments', key: 'momo_number', label: 'Your Mobile Money number', placeholder: '055 000 0000' },
  { section: 'payments', key: 'bank_name', label: 'Bank name', placeholder: 'GCB Bank' },
  { section: 'payments', key: 'bank_account_name', label: 'Account name', placeholder: 'Nathaniel Sasuosei' },
  { section: 'payments', key: 'bank_account_number', label: 'Account number', placeholder: '0000000000' },

  { section: 'email', key: 'email_from', label: 'From address', placeholder: 'Project 1 <orders@beatvault.gh>' },

  { section: 'studio', key: 'studio_bookable', label: 'Online booking', placeholder: '1', help: '1 = artists can book and pay a deposit. 0 = booking form is closed.' },
  { section: 'studio', key: 'studio_deposit_percent', label: 'Deposit to lock a slot (%)', placeholder: '50', help: 'Artists pay this share now and the balance at the studio. 50 = half.' },
  { section: 'studio', key: 'studio_open_hour', label: 'First session hour (24h)', placeholder: '10' },
  { section: 'studio', key: 'studio_close_hour', label: 'Last session hour (24h)', placeholder: '18' },
  { section: 'studio', key: 'studio_open_days', label: 'Open days', placeholder: '1-6', help: 'Monday = 1, Sunday = 0. Use 0-6 for every day.' },
  { section: 'studio', key: 'studio_address', label: 'Studio address', placeholder: 'Osu, Accra' },
  { section: 'studio', key: 'studio_phone', label: 'Studio phone', placeholder: '+233 55 000 0000' },
  { section: 'studio', key: 'studio_policy', label: 'Booking policy', placeholder: 'Arrive 10 minutes early…', type: 'textarea' },
];

const SECTIONS = [
  { id: 'Studio', title: 'Studio identity', sub: 'Name, tagline and public contact details.' },
  { id: 'Homepage', title: 'Homepage copy', sub: 'The animated hero pulls its headline and paragraph from here.' },
  { id: 'Currency', title: 'Currency', sub: 'How prices are displayed and charged.' },
  { id: 'payments', title: 'Payments & payouts', sub: 'Connect Paystack to take real Mobile Money and bank payments.' },
  { id: 'email', title: 'Email', sub: 'Sender identity for delivery emails.' },
  { id: 'studio', title: 'Studio bookings', sub: 'Deposit share, opening hours and the policy shown on every booking.' },
];

export default function SettingsClient({
  settings,
  smtp,
  storage,
  paystack,
}: {
  settings: Record<string, string>;
  smtp: boolean;
  storage: string;
  paystack: string;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    FIELDS.forEach((f) => (initial[f.key] = settings[f.key] ?? ''));
    return initial;
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not save');
      toast('Settings saved');
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Could not save', 'err');
    } finally {
      setBusy(false);
    }
  }

  const statusPill = (ok: boolean, on: string, off: string) => (
    <span
      className={`chip ${
        ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      }`}
    >
      {ok ? on : off}
    </span>
  );

  return (
    <form onSubmit={save} className="space-y-6">
      {SECTIONS.map((sec) => (
        <section key={sec.id} id={sec.id.toLowerCase()} className="card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="display text-lg text-white">{sec.title.toUpperCase()}</h2>
              <p className="mt-1 text-[12px] text-white/40">{sec.sub}</p>
            </div>
            {sec.id === 'payments' && statusPill(paystack === 'live', 'Live payments', 'Demo mode')}
            {sec.id === 'email' && statusPill(smtp, 'SMTP connected', 'Outbox mode')}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.filter((f) => f.section === sec.id).map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="label">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="input resize-y"
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="input"
                    placeholder={f.placeholder}
                  />
                )}
                {f.help && <p className="mt-1.5 text-[11px] text-white/30">{f.help}</p>}
              </div>
            ))}
          </div>

          {sec.id === 'payments' && (
            <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.02] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                Webhook URL (paste into your Paystack dashboard)
              </div>
              <code className="mt-1.5 block break-all text-[12px] text-brand-300">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/paystack/webhook
              </code>
            </div>
          )}

          {sec.id === 'email' && (
            <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.02] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                SMTP credentials (set in .env, not stored in the browser)
              </div>
              <ul className="mt-2 space-y-1 text-[12px] text-white/45">
                <li>
                  <code className="text-white/70">SMTP_HOST</code> ·{' '}
                  <code className="text-white/70">SMTP_PORT</code> ·{' '}
                  <code className="text-white/70">SMTP_USER</code> ·{' '}
                  <code className="text-white/70">SMTP_PASS</code>
                </li>
                <li>
                  Current status:{' '}
                  <b className={smtp ? 'text-emerald-300' : 'text-amber-300'}>
                    {smtp ? 'connected — emails are delivered' : 'not connected — emails stored in the outbox'}
                  </b>
                </li>
              </ul>
            </div>
          )}

          {sec.id === 'Studio' && (
            <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.02] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                File storage
              </div>
              <p className="mt-1.5 text-[12px] text-white/45">
                Currently using <b className="text-white/70">{storage}</b>. Set{' '}
                <code className="text-white/70">S3_BUCKET</code>,{' '}
                <code className="text-white/70">S3_ACCESS_KEY_ID</code>,{' '}
                <code className="text-white/70">S3_SECRET_ACCESS_KEY</code> and{' '}
                <code className="text-white/70">S3_ENDPOINT</code> in .env to switch uploads to
                S3-compatible storage.
              </p>
            </div>
          )}
        </section>
      ))}

      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn-red !px-8 !py-3.5 text-sm">
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
