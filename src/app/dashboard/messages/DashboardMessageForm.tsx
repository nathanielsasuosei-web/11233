'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function DashboardMessageForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send');
      setSubject('');
      setBody('');
      toast('Message sent — replies come by email');
    } catch (err: any) {
      toast(err.message || 'Could not send message', 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h2 className="display text-lg text-white">Send a message</h2>
      <div>
        <label className="label">Subject</label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="input"
          placeholder="Stems for my last order"
        />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea
          required
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="input resize-y"
          placeholder="What do you need?"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] text-white/30">Sending as {email}</span>
        <button type="submit" disabled={busy} className="btn-red !px-6 text-xs">
          {busy ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  );
}
