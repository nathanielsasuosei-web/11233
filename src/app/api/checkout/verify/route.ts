import { NextResponse } from 'next/server';
import { completeOrder } from '@/lib/complete';
import { absoluteUrl } from '@/lib/fulfill';
import { getOrderByRef } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const reference = new URL(req.url).searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  const result = await completeOrder(reference, (p) => absoluteUrl(req, p));

  const order = getOrderByRef(reference);
  return NextResponse.json({
    ...result,
    order: order
      ? { reference: order.reference, status: order.status, total: order.total, items: order.items.length }
      : null,
  });
}
