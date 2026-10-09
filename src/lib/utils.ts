export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/** Amounts are stored as minor units (pesewas/cents). */
export function formatMoney(minor: number, symbol = 'GH₵') {
  const value = (minor || 0) / 100;
  return (
    (symbol || 'GH₵') +
    value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function toMinor(major: number | string) {
  const n = typeof major === 'string' ? parseFloat(major.replace(/[^0-9.]/g, '')) : major;
  return Math.max(0, Math.round((isFinite(n) ? n : 0) * 100));
}

export function timeAgo(iso: string) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('T') ? '' : 'Z'));
  const diff = Date.now() - d.getTime();
  if (isNaN(diff)) return iso;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const LICENSES = {
  basic: {
    id: 'basic',
    name: 'Basic Lease (MP3)',
    blurb: 'Non-exclusive MP3 lease. Great for demos, freestyles & mixtapes.',
    details: [
      'MP3 audio file, untagged',
      'Up to 5,000 audio streams',
      '1 music video',
      'Non-exclusive — beat stays on sale',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium Lease (WAV)',
    blurb: 'Non-exclusive WAV + tracked-out stems for commercial release.',
    details: [
      'WAV + MP3, untagged',
      'Tracked-out stems',
      'Up to 50,000 audio streams',
      '2 music videos + radio',
    ],
  },
  exclusive: {
    id: 'exclusive',
    name: 'Exclusive Rights',
    blurb: 'Full ownership. Beat is removed from the store after purchase.',
    details: [
      'WAV + MP3 + full stems',
      'Unlimited streams & sales',
      'Unlimited music videos',
      'Beat removed from catalogue',
    ],
  },
  buyout: {
    id: 'buyout',
    name: 'Buyout / Sync',
    blurb: 'Everything in Exclusive plus sync licensing for film, TV & ads.',
    details: [
      'Everything in Exclusive Rights',
      'Film, TV & advert synchronisation',
      'Publishing split negotiable',
      'Signed licence agreement',
    ],
  },
} as const;

export type LicenseId = keyof typeof LICENSES;

export function priceFor(beat: Record<string, any>, license: string) {
  const map: Record<string, string> = {
    basic: 'price_basic',
    premium: 'price_premium',
    exclusive: 'price_exclusive',
    buyout: 'price_buyout',
  };
  return Number(beat?.[map[license] ?? 'price_basic'] ?? 0);
}

export function randomToken(bytes = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  for (const b of buf) out += chars[b % chars.length];
  return out;
}

export function reference() {
  const t = Date.now().toString(36).toUpperCase();
  return `BV-${t}-${randomToken(5).toUpperCase()}`;
}

export function youtubeId(url: string) {
  if (!url) return '';
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/,
  );
  return m ? m[1] : '';
}
