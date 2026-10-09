import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const id = Number(ctx.params.id);
  if (id) run('UPDATE beats SET plays = plays + 1 WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}
