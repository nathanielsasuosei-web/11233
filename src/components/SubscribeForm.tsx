'use client';

import { useState } from 'react';
import { useToast } from './Toast';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not subscribe');
      setDone(true);
      toast('Thanks — we have your email.');
    } catch (err: any) {
      toast(err.message || 'Could not subscribe', 'err');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-[13px] text-brand-300">
        Thanks — we&apos;ll be in touch when there is something to share.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 flex max-w-sm gap-2">
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="input !py-2.5 text-[13px]"
      />
      <button type="submit" disabled={busy} className="btn-red shrink-0 !px-5 !py-2.5 text-xs">
        {busy ? '…' : 'Notify me'}
      </button>
    </form>
  );
}
