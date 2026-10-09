import { Suspense } from 'react';
import AdminHeader from '@/components/AdminHeader';
import BeatsManager from '@/components/BeatsManager';
import { listBeats } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Beats — Producer dashboard' };

export default function AdminBeatsPage() {
  const beats = listBeats({ includeUnpublished: true, sort: 'new' });

  return (
    <div>
      <AdminHeader
        eyebrow="Catalogue"
        title="BEATS"
        accent="MANAGER"
        sub="Upload audio, covers and previews, set licence pricing, and control what appears in the store."
      />
      <Suspense fallback={<div className="card p-8 text-sm text-white/40">Loading…</div>}>
        <BeatsManager beats={beats} />
      </Suspense>
    </div>
  );
}
