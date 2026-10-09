'use client';

import { useState } from 'react';
import { useToast } from './Toast';

const SUBJECTS = [
  'Custom beat enquiry',
  'Mixing & mastering',
  'Licensing question',
  'Problem with an order',
  'Something else',
];

export default function ContactForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [form, setForm] = useState({ name, email, subject: SUBJECTS[0], body: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send');
      setDone(true);
      toast('Message sent — I usually reply within 24 hours');
    } catch (err: any) {
      toast(err.message || 'Could not send message', 'err');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-brand-500/25 bg-brand-950/50 text-2xl">
          ✉️
        </div>
        <h3 className="display text-xl text-white">Message received</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/45">
          Thanks {form.name.split(' ')[0]} — your message is in the studio inbox. You&apos;ll get a
          reply by email, usually within 24 hours.
        </p>
        <button onClick={() => setDone(false)} className="btn-ghost mt-6 !px-6 text-xs">
          Send another message
        </button>
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

      <button type="submit" disabled={sending} className="btn-red w-full !py-4 text-sm">
        {sending ? 'Sending…' : 'Send message'}
      </button>
      <p className="text-center text-[11px] text-white/30">
        Prefer WhatsApp or a call? Details are on the left.
      </p>
    </form>
  );
}
