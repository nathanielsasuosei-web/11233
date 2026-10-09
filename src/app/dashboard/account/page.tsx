import AccountClient from './AccountClient';
import { requireArtist } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account settings — Beatvault' };

export default async function AccountPage() {
  const user = await requireArtist();
  if (!user) redirect('/login?next=/dashboard/account');
  return (
    <div>
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
          <span className="h-[2px] w-7 bg-brand-500" />
          Settings
        </div>
        <h1 className="display text-[clamp(1.9rem,4.6vw,3rem)] text-white">
          AC<span className="bg-gradient-to-r from-brand-400 to-brand-700 bg-clip-text text-transparent">COUNT</span>
        </h1>
        <p className="mt-3 text-sm text-white/45">
          Update the details we deliver your beats to.
        </p>
      </div>

      <AccountClient
        user={{
          name: user.name,
          artist_name: user.artist_name || '',
          email: user.email,
          phone: user.phone || '',
          country: user.country || '',
        }}
      />
    </div>
  );
}
