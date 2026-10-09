import { Suspense } from 'react';
import AuthShell from '@/components/AuthShell';
import RegisterForm from '@/components/RegisterForm';
import { redirect } from 'next/navigation';
import { requireArtist } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create account — Project 1' };

export default async function RegisterPage() {
  if (await requireArtist()) redirect('/dashboard');
  return (
    <Suspense fallback={null}>
      <AuthShell
        title="JOIN THE"
        accent="VAULT"
        sub="Create a free artist account to buy beats, keep every licence and download link in one place, and message the producer directly."
      >
        <RegisterForm />
      </AuthShell>
    </Suspense>
  );
}
