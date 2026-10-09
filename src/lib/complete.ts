import { all, get, run } from './db';
import { verifyTransaction } from './paystack';
import { fulfillOrder } from './fulfill';

export type CompleteResult = {
  ok: boolean;
  status: string;
  reference: string;
  error?: string;
};

/**
 * Verifies a payment with the provider (or accepts it in demo mode), marks the
 * order paid, retires exclusively-sold beats, and emails the files.
 * Idempotent: calling it twice will not send the delivery email twice.
 */
export async function completeOrder(
  reference: string,
  base: (p: string) => string,
  opts: { force?: boolean; channel?: string } = {},
): Promise<CompleteResult> {
  const order = get<any>('SELECT * FROM orders WHERE reference = ?', [reference]);
  if (!order) return { ok: false, status: 'not_found', reference, error: 'Order not found' };

  if (order.status === 'paid') {
    return { ok: true, status: 'paid', reference };
  }

  let method = order.method;
  let channel = opts.channel || order.channel;
  let success = Boolean(opts.force);

  if (!opts.force) {
    const v = await verifyTransaction(reference);
    success = v.success;
    channel = v.channel || channel;
    method = v.method || method;
  }

  if (!success) {
    run("UPDATE orders SET status = 'failed' WHERE id = ?", [order.id]);
    return { ok: false, status: 'failed', reference, error: 'Payment not completed' };
  }

  const paidAt = new Date().toISOString();
  run(
    `UPDATE orders SET status = 'paid', paid_at = ?, method = ?, channel = ?, provider_ref = ?
     WHERE id = ?`,
    [paidAt, method, channel, channel, order.id],
  );

  const items = all<any>('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

  for (const it of items) {
    run('UPDATE beats SET sales = sales + 1 WHERE id = ?', [it.beat_id]);
    // Exclusive / buyout purchases retire the beat from the store.
    if (/exclusive|buyout/i.test(it.license)) {
      run("UPDATE beats SET status = 'sold', featured = 0 WHERE id = ?", [it.beat_id]);
    }
  }

  await fulfillOrder(order.id, base);

  return { ok: true, status: 'paid', reference };
}
