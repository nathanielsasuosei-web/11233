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
        sub="Enquiries from the contact form and artist accounts. Replies are emailed straight back to the sender."
      />
      <MessagesManager messages={messages} />
    </div>
  );
}
