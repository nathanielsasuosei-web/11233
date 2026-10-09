import { NextResponse } from 'next/server';
import { z } from 'zod';
import { all, get, getSetting, run } from '@/lib/db';
import { readSession } from '@/lib/auth';
import { initializeTransaction, paystackMode } from '@/lib/paystack';
import { LICENSES, randomToken, reference as makeRef, type LicenseId } from '@/lib/utils';

const Schema = z.object({
  items: z
    .array(z.object({ beatId: z.number().int().positive(), license: z.string() }))
    .min(1, 'Your cart is empty'),
  method: z.enum(['mobile_money', 'bank', 'card']).default('mobile_money'),
  phone: z.string().optional().default(''),
});

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: 'Please log in (or create an account) to buy beats.', needAuth: true }, { status: 401 });
  }

  const body = Schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message || 'Invalid cart' }, { status: 400 });
  }

  const { items, method, phone } = body.data;

  // Prices are always recalculated from the database — never trusted from the client.
  const ids = items.map((i) => i.beatId);
  const beats = all<any>(
    `SELECT id, slug, title, status, price_basic, price_premium, price_exclusive, price_buyout
     FROM beats WHERE id IN (${ids.map(() => '?').join(',')})`,
    ids,
  );

  const priced: { beat: any; license: string; price: number }[] = [];
  for (const item of items) {
    const beat = beats.find((b) => b.id === item.beatId);
    if (!beat) return NextResponse.json({ error: 'One of the beats is no longer available' }, { status: 400 });
    if (beat.status === 'sold') {
      return NextResponse.json({ error: `"${beat.title}" has been sold exclusively` }, { status: 409 });
    }
    const key = ({
      basic: 'price_basic',
      premium: 'price_premium',
      exclusive: 'price_exclusive',
      buyout: 'price_buyout',
    } as Record<string, string>)[item.license];
    if (!key) return NextResponse.json({ error: 'Unknown licence type' }, { status: 400 });
    const price = Number(beat[key] ?? 0);
    if (!price) return NextResponse.json({ error: `"${beat.title}" is not available with that licence` }, { status: 400 });
    priced.push({ beat, license: item.license, price });
  }

  const total = priced.reduce((s, p) => s + p.price, 0);
  const currency = getSetting('currency') || 'GHS';
  const ref = makeRef();
  const userId = Number(session.sub);

  const res = run(
    `INSERT INTO orders (reference, user_id, subtotal, total, currency, status, method, provider, pay_email, pay_phone)
     VALUES (?,?,?,?,?, 'pending', ?, ?, ?, ?)`,
    [
      ref,
      userId,
      total,
      total,
      currency,
      method === 'mobile_money' ? 'Mobile Money' : method === 'bank' ? 'Bank Transfer' : 'Card',
      'paystack',
      session.email,
      phone,
    ],
  );
  const orderId = res.lastInsertRowid;

  for (const p of priced) {
    run(
      `INSERT INTO order_items (order_id, beat_id, beat_title, license, price, download_token, download_limit)
       VALUES (?,?,?,?,?,?,5)`,
      [
        orderId,
        p.beat.id,
        p.beat.title,
        LICENSES[p.license as LicenseId]?.name || p.license,
        p.price,
        randomToken(28),
      ],
    );
  }

  // remember the public origin so emailed links work even from webhooks
  try {
    const origin = new URL(req.url).origin;
    if (!getSetting('site_url') && !origin.includes('localhost')) {
      run(`INSERT INTO settings (key, value) VALUES ('site_url', ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [origin]);
    }
  } catch {
    /* ignore */
  }

  try {
    const init = await initializeTransaction({
      email: session.email,
      amount: total,
      currency,
      reference: ref,
      callbackUrl: `${new URL(req.url).origin}/checkout/verify?reference=${ref}`,
      metadata: { order_id: orderId, user_id: userId, method },
      channels: method === 'mobile_money' ? ['mobile_money'] : method === 'bank' ? ['bank'] : ['card'],
    });

    return NextResponse.json({
      ok: true,
      reference: ref,
      authorization_url: init.authorization_url,
      demo: paystackMode() === 'demo',
    });
  } catch (err: any) {
    run("UPDATE orders SET status = 'failed' WHERE id = ?", [orderId]);
    return NextResponse.json({ error: err?.message || 'Could not start payment' }, { status: 502 });
  }
}
