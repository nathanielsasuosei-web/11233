'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function AccountClient({
  user,
}: {
  user: { name: string; artist_name: string; email: string; phone: string; country: string };
}) {
  const [form, setForm] = useState(user);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, password: password || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not save');
      setPassword('');
      toast('Account updated');
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Could not save', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast('Logged out');
    router.push('/');
    router.refresh();
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={save} className="card max-w-2xl space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input required value={form.name} onChange={set('name')} className="input" />
        </div>
        <div>
          <label className="label">Artist / stage name</label>
          <input value={form.artist_name} onChange={set('artist_name')} className="input" />
        </div>
      </div>

      <div>
        <label className="label">Email (where beats are delivered)</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={set('email')}
          className="input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Phone</label>
          <input value={form.phone} onChange={set('phone')} className="input" />
        </div>
        <div>
          <label className="label">Country</label>
          <input value={form.country} onChange={set('country')} className="input" />
        </div>
      </div>

      <div className="border-t border-white/[.07] pt-5">
        <label className="label">New password (leave blank to keep current)</label>
        <input
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="btn-red !px-7 text-sm">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={logout} className="btn-ghost !px-7 text-sm">
          Log out
        </button>
      </div>
    </form>
  );
}
