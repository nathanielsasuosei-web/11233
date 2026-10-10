import AdminLoginForm from './AdminLoginForm';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Producer login — Project 1' };

export default async function AdminLoginPage() {
  if (await requireAdmin()) redirect('/admin');
  return (
    <div className="flex min-h-[calc(100svh-68px)] items-center justify-center border-b border-white/[.10] bg-ink-900">
      <div className="container-x flex justify-center py-16">
        <AdminLoginForm />
      </div>
    </div>
  );
}
