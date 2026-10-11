import AdminHeader from '@/components/AdminHeader';
import MessagesManager from '@/components/MessagesManager';
import { all } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Messages — Producer dashboard' };

export default function AdminMessagesPage() {
  const messages = all<any>('SELECT * FROM messages ORDER BY id DESC');
  return (
    <div>
      <AdminHeader
        eyebrow="Inbox"
        title="MES"
        accent="SAGES"
        sub="Studio bookings, beat orders, and artist enquiries received on the website — reply by email or jump straight to WhatsApp."
      />
      <MessagesManager messages={messages} />
    </div>
  );
}
