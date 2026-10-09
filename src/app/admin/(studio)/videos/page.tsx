import AdminHeader from '@/components/AdminHeader';
import VideosManager from '@/components/VideosManager';
import { all, listBeats } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Videos — Producer dashboard' };

export default function AdminVideosPage() {
  const videos = all<any>(
    `SELECT v.*, b.title as beat_title FROM videos v
     LEFT JOIN beats b ON b.id = v.beat_id ORDER BY v.id DESC`,
  );
  const beats = listBeats({ includeUnpublished: true }).map((b) => ({ id: b.id, title: b.title }));

  return (
    <div>
      <AdminHeader
        eyebrow="Studio feed"
        title="VIDEOS"
        accent="MANAGER"
        sub="Add beat breakdowns, studio sessions and live sets. Paste a YouTube link or upload a file."
      />
      <VideosManager videos={videos} beats={beats} />
    </div>
  );
}
