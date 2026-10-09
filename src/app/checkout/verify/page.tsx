import { redirect } from 'next/navigation';
import { completeOrder } from '@/lib/complete';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/** Where Paystack sends the browser after the buyer finishes paying. */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  const reference = searchParams.reference;
  if (!reference) redirect('/beats');

  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;

  const result = await completeOrder(reference, (p) => `${base}${p}`);

  if (result.ok) {
    redirect(`/checkout/success?reference=${encodeURIComponent(reference)}`);
  }
  redirect(`/checkout/failed?reference=${encodeURIComponent(reference)}`);
}
