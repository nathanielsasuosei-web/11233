import { Suspense } from 'react';
import AuthShell from '@/components/AuthShell';
import LoginForm from '@/components/LoginForm';
import { redirect } from 'next/navigation';
import { requireArtist } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Log in — Beatvault' };

export default async function LoginPage() {
  if (await requireArtist()) redirect('/dashboard');
  return (
    <Suspense fallback={null}>
      <AuthShell
        title="WELCOME"
        accent="BACK"
        sub="Log in to reach your library — every beat you have bought, with fresh download links and the messages you have sent."
      >
        <LoginForm />
      </AuthShell>
    </Suspense>
  );
}
