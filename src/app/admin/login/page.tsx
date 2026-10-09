import AdminLoginForm from './AdminLoginForm';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Producer login — Beatvault' };

export default async function AdminLoginPage() {
  if (await requireAdmin()) redirect('/admin');
  return (
    <div className="relative flex min-h-[calc(100svh-68px)] items-center justify-center overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-40" />
      <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-brand-700/20 blur-[120px]" />
      <div className="absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-brand-800/20 blur-[110px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,transparent_30%,rgba(8,8,10,.92)_100%)]" />

      <div className="container-x relative flex justify-center py-16">
        <AdminLoginForm />
      </div>
    </div>
  );
}
