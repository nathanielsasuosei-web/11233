import { NextResponse } from 'next/server';
import { availability, closeHour, isClosedDay, openHour, openWeekdays, releaseStaleHolds } from '@/lib/studio';

export const dynamic = 'force-dynamic';

/** Free start times for a date + session length. Drives the slot picker. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const date = sp.get('date') || '';
  const hours = Math.max(1, Math.min(12, Number(sp.get('hours') || 1)));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Pick a date first' }, { status: 400 });
  }

  // Expired unpaid holds must never block a slot.
  releaseStaleHolds();

  const closed = isClosedDay(date);
  const { slots } = availability(date, hours);
  return NextResponse.json({
    closed,
    slots,
    openHour: openHour(),
    closeHour: closeHour(),
    openDays: openWeekdays(),
  });
}
