'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed');
      toast('Welcome back, producer 🎛️');
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Login failed', 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card w-full max-w-md p-8">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700">
          <span className="flex items-end gap-[2px]">
            <span className="eq-bar h-3 w-[2px] bg-white" />
            <span className="eq-bar h-5 w-[2px] bg-white" style={{ animationDelay: '140ms' }} />
            <span className="eq-bar h-3.5 w-[2px] bg-white" style={{ animationDelay: '280ms' }} />
          </span>
        </div>
        <h1 className="display text-2xl text-white">PRODUCER LOGIN</h1>
        <p className="mt-2 text-[13px] text-white/45">
          Manage beats, videos, orders and payouts.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="admin@beatvault.gh"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={busy} className="btn-red w-full !py-3.5 text-sm">
          {busy ? 'Logging in…' : 'Enter the studio'}
        </button>
      </form>

      <button
        onClick={() => {
          setEmail('admin@beatvault.gh');
          setPassword('admin123');
        }}
        className="mt-3 w-full rounded-xl border border-dashed border-white/10 py-2.5 text-[11px] font-semibold text-white/35 transition hover:border-brand-500/40 hover:text-brand-300"
      >
        Fill in the demo producer account
      </button>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-white/25">
        Looking for beats?{' '}
        <Link href="/beats" className="text-brand-300 hover:underline">
          Go to the store
        </Link>
      </p>
    </div>
  );
}
