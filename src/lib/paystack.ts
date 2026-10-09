/**
 * Paystack checkout (mobile money, bank transfer, card).
 *
 * With PAYSTACK_SECRET_KEY set, this talks to the real API.
 * Without keys it runs in DEMO mode: the buyer is sent through a simulated
 * checkout screen so the full purchase → email → download flow can be tested.
 */
import { getSetting } from './db';

export const PAYSTACK_BASE = 'https://api.paystack.co';

export function paystackMode(): 'live' | 'demo' {
  return getSetting('paystack_secret_key') || process.env.PAYSTACK_SECRET_KEY ? 'live' : 'demo';
}

export function publicKey() {
  return getSetting('paystack_public_key') || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
}

function secretKey() {
  return getSetting('paystack_secret_key') || process.env.PAYSTACK_SECRET_KEY || '';
}

export type InitResult = {
  authorization_url: string;
  reference: string;
  access_code?: string;
  demo: boolean;
};

export async function initializeTransaction(opts: {
  email: string;
  amount: number; // minor units
  currency?: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}): Promise<InitResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  if (paystackMode() === 'demo') {
    return {
      authorization_url: `${siteUrl}/checkout/simulate?reference=${encodeURIComponent(opts.reference)}`,
      reference: opts.reference,
      demo: true,
    };
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amount,
      currency: opts.currency || getSetting('currency') || 'GHS',
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      channels: opts.channels ?? ['mobile_money', 'bank', 'card', 'ussd', 'qr'],
      metadata: { ...(opts.metadata || {}), custom_fields: [] },
    }),
  });

  const json = (await res.json()) as any;
  if (!json?.status) {
    throw new Error(json?.message || 'Could not start Paystack transaction');
  }
  return {
    authorization_url: json.data.authorization_url,
    access_code: json.data.access_code,
    reference: json.data.reference,
    demo: false,
  };
}

export type VerifyResult = {
  success: boolean;
  status: string;
  amount?: number;
  channel?: string;
  method?: string;
  paidAt?: string;
  customerEmail?: string;
  raw?: unknown;
};

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  if (paystackMode() === 'demo') {
    return { success: true, status: 'success', method: 'Simulated payment', channel: 'demo' };
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: 'no-store',
  });
  const json = (await res.json()) as any;
  if (!json?.status) {
    return { success: false, status: json?.data?.status || 'failed', raw: json };
  }
  const d = json.data;
  return {
    success: d.status === 'success',
    status: d.status,
    amount: Number(d.amount),
    channel: d.channel,
    method: labelMethod(d.channel),
    paidAt: d.paid_at || d.transaction_date,
    customerEmail: d.customer?.email,
    raw: json,
  };
}

export function labelMethod(channel?: string) {
  const c = (channel || '').toLowerCase();
  if (c === 'mobile_money' || c === 'momo') return 'Mobile Money';
  if (c === 'bank' || c === 'bank_transfer') return 'Bank Transfer';
  if (c === 'card') return 'Card';
  if (c === 'ussd') return 'USSD';
  if (c === 'qr') return 'QR Code';
  if (c === 'demo') return 'Simulated Payment';
  return channel ? channel.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Online';
}
