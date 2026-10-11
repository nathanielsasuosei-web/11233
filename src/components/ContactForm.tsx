'use client';

import { useState } from 'react';
import { useToast } from './Toast';

const SUBJECTS = [
  'Custom beat enquiry',
  'Recording session',
  'Mixing',
  'Mastering',
  'Licensing question',
  'Problem with an order',
  'Something else',
];

export default function ContactForm({
  name,
  email,
  phone = '',
  initialSubject,
}: {
  name: string;
  email: string;
  phone?: string;
  initialSubject?: string;
}) {
  const [form, setForm] = useState({
    name,
    email,
    phone,
    subject: initialSubject && SUBJECTS.includes(initialSubject) ? initialSubject : SUBJECTS[0],
    body: '',
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const toast = useToast();

  async function sendMessage(openWhatsApp = false) {
    if (!form.name.trim() || !form.email.trim() || form.body.trim().length < 10) {
      toast('Please fill in your name, email and message (at least 10 characters)', 'err');
      return;
    }
    const waWin = openWhatsApp ? window.open('about:blank', '_blank') : null;
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send');
      setWhatsappUrl(json.whatsapp_url || '');
      if (openWhatsApp && json.whatsapp_url) {
        if (waWin) {
          waWin.location.href = json.whatsapp_url;
        } else {
          window.open(json.whatsapp_url, '_blank', 'noopener,noreferrer');
        }
      } else {
        waWin?.close();
      }
      setDone(true);
      toast('Message delivered to studio inbox & WhatsApp');
    } catch (err: any) {
      waWin?.close();
      toast(err.message || 'Could not send message', 'err');
    } finally {
      setSending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(false);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-brand-500/25 bg-brand-950/50 text-2xl">
          ✉️
        </div>
        <h3 className="display text-xl text-white">Message received</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/45">
          Thanks {form.name.split(' ')[0]} — your message is in the studio inbox on the website.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-xs font-extrabold uppercase tracking-[.1em] text-black transition hover:bg-emerald-400"
            >
              <span>💬</span>
              Send straight to Producer&apos;s WhatsApp
            </a>
          )}
          <button onClick={() => setDone(false)} className="btn-ghost !px-6 text-xs">
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Your name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder="Ama Serwaa"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Phone / WhatsApp number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input"
            placeholder="055 000 0000"
            inputMode="tel"
          />
        </div>
      </div>

      <div>
        <label className="label">Subject</label>
        <select
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="input appearance-none"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s} className="bg-ink-800">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Message</label>
        <textarea
          required
          rows={6}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="input resize-y"
          placeholder="Tell me about the record — references, tempo, mood, deadlines…"
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <button type="submit" disabled={sending} className="btn-red w-full !py-4 text-sm">
          {sending ? 'Sending…' : 'Send on Website'}
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => sendMessage(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-5 py-4 text-xs font-extrabold uppercase tracking-[.12em] text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/25 hover:text-white disabled:opacity-40"
        >
          <span>💬</span>
          Send &amp; Open WhatsApp
        </button>
      </div>
      <p className="text-center text-[11px] text-white/30">
        Goes straight to the producer&apos;s website inbox and WhatsApp.
      </p>
    </form>
  );
}
