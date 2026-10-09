import { redirect } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import { requireAdmin } from '@/lib/auth';
import { get } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/admin/login');

  const unread = get<{ c: number }>("SELECT COUNT(*) c FROM messages WHERE status = 'unread'");
  const pending = get<{ c: number }>("SELECT COUNT(*) c FROM orders WHERE status = 'pending'");

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="flex gap-10">
        <AdminNav
          name={admin!.name}
          badges={{ messages: unread?.c || 0, orders: pending?.c || 0 }}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
