import AdminHeader from '@/components/AdminHeader';
import OutboxClient from '@/components/OutboxClient';
import { all } from '@/lib/db';
import { smtpConfigured } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email outbox — Producer dashboard' };

export default function AdminOutboxPage() {
  const emails = all<any>('SELECT * FROM email_log ORDER BY id DESC LIMIT 100');
  return (
    <div>
      <AdminHeader
        eyebrow="Delivery"
        title="EMAIL"
        accent="OUTBOX"
        sub="Every email the store has composed — beat deliveries, receipts, replies and notices. Click a row to preview it."
      />
      <OutboxClient emails={emails} smtp={smtpConfigured()} />
    </div>
  );
}
