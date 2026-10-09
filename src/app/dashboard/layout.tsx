import { redirect } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import { requireArtist } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireArtist();
  if (!user) redirect('/login?next=/dashboard');

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="flex gap-10">
        <DashboardNav name={user.artist_name || user.name} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
