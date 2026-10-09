import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { setSetting, getSettings, DEFAULT_SETTINGS } from '@/lib/db';

const ALLOWED = new Set([...Object.keys(DEFAULT_SETTINGS), 'site_url']);

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED.has(k)) setSetting(k, String(v));
  }
  return NextResponse.json({ ok: true, settings: getSettings() });
}
