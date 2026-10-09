import CheckoutClient from '@/components/CheckoutClient';
import { requireArtist } from '@/lib/auth';
import { paystackMode } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Checkout — Beatvault' };

export default async function CheckoutPage() {
  const user = await requireArtist();

  return (
    <div className="container-x py-12 sm:py-16">
      <div className="mb-9">
        <div className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">
          <span className="h-[2px] w-7 bg-brand-500" />
          Secure checkout
        </div>
        <h1 className="display text-[clamp(2rem,5vw,3.4rem)] text-white">
          CHECK<span className="text-brand-500">OUT</span>
        </h1>
      </div>

      <CheckoutClient
        loggedIn={!!user}
        email={user?.email || ''}
        name={user?.artist_name || user?.name || ''}
        demo={paystackMode() === 'demo'}
      />
    </div>
  );
}
