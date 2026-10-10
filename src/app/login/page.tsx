import { Suspense } from 'react';
import AuthShell from '@/components/AuthShell';
import LoginForm from '@/components/LoginForm';
import { redirect } from 'next/navigation';
import { requireArtist } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Log in — Project 1' };

export default async function LoginPage() {
  if (await requireArtist()) redirect('/dashboard');
  return (
    <Suspense fallback={null}>
      <AuthShell
        title="Good to see you,"
        accent="again."
        sub="Sign in to find your purchases, download files, or pick up a conversation with the producer."
      >
        <LoginForm />
      </AuthShell>
    </Suspense>
  );
}
