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
        title="Make an"
        accent="account."
        sub="Your purchases, download links, studio bookings and messages stay together here. Creating an account is free."
      >
        <RegisterForm />
      </AuthShell>
    </Suspense>
  );
}
