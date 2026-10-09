'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { useToast } from './Toast';
import { AuthSubmitButton, shake } from './AuthMotion';

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: '',
    artist_name: '',
    email: '',
    phone: '',
    country: 'Ghana',
    password: '',
  });
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not create account');
      setSuccess(true);
      toast('Account created — welcome 🎧');
      // Let the success animation play before navigating away.
      setTimeout(() => {
        router.push(next || '/dashboard');
        router.refresh();
      }, 900);
    } catch (err: any) {
      shake(cardRef.current);
      toast(err.message || 'Could not create account', 'err');
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div ref={cardRef} className={`card auth-stagger p-7 ${success ? 'auth-success' : ''}`}>
      <h2 className="display text-2xl text-white">CREATE ACCOUNT</h2>
      <p className="mt-2 text-[13px] text-white/45">
        Free, and it takes about 30 seconds.
      </p>

      <form onSubmit={submit} className="auth-fields mt-7 space-y-4">
        <div>
          <label className="label">Full name</label>
          <input required value={form.name} onChange={set('name')} className="input" placeholder="Ama Serwaa" />
        </div>
        <div>
          <label className="label">Artist / stage name (optional)</label>
          <input value={form.artist_name} onChange={set('artist_name')} className="input" placeholder="Ama" />
        </div>
        <div>
          <label className="label">Email</label>
          <input required type="email" value={form.email} onChange={set('email')} className="input" placeholder="you@example.com" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Phone (optional)</label>
            <input value={form.phone} onChange={set('phone')} className="input" placeholder="055 000 0000" />
          </div>
          <div>
            <label className="label">Country</label>
            <input value={form.country} onChange={set('country')} className="input" placeholder="Ghana" />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={set('password')}
            className="input"
            placeholder="At least 6 characters"
          />
        </div>

        <AuthSubmitButton
          busy={busy}
          success={success}
          idleLabel="Create account"
          loadingLabel="Creating account…"
          successLabel="Account created"
        />
      </form>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-white/30">
        By creating an account you agree to receive order emails and delivery links.
      </p>

      <p className="mt-5 text-center text-[13px] text-white/40">
        Already have one?{' '}
        <Link href="/login" className="font-bold text-brand-300 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
