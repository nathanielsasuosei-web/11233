'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { useToast } from './Toast';
import { AuthSubmitButton, shake } from './AuthMotion';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const router = useRouter();
  const next = useSearchParams().get('next');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed');
      setSuccess(true);
      toast('Welcome back 👋');
      // Let the success animation play before navigating away.
      setTimeout(() => {
        router.push(next || '/dashboard');
        router.refresh();
      }, 900);
    } catch (err: any) {
      shake(cardRef.current);
      toast(err.message || 'Login failed', 'err');
    } finally {
      setBusy(false);
    }
  }

  function fill() {
    setEmail('artist@example.com');
    setPassword('artist123');
  }

  return (
    <div ref={cardRef} className={`card auth-stagger p-7 ${success ? 'auth-success' : ''}`}>
      <h2 className="display text-2xl text-white">LOG IN</h2>
      <p className="mt-2 text-[13px] text-white/45">
        Access your purchases, downloads and messages.
      </p>

      <form onSubmit={submit} className="auth-fields mt-7 space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
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
            autoComplete="current-password"
          />
        </div>

        <AuthSubmitButton
          busy={busy}
          success={success}
          idleLabel="Log in"
          loadingLabel="Logging in…"
          successLabel="Logged in"
        />
      </form>

      <button
        onClick={fill}
        className="mt-3 w-full rounded-xl border border-dashed border-white/10 py-2.5 text-[11px] font-semibold text-white/35 transition hover:border-brand-500/40 hover:text-brand-300"
      >
        Fill in the demo account
      </button>

      <p className="mt-6 text-center text-[13px] text-white/40">
        New here?{' '}
        <Link href="/register" className="font-bold text-brand-300 hover:underline">
          Create a free artist account
        </Link>
      </p>
    </div>
  );
}
