import AdminHeader from '@/components/AdminHeader';
import OutboxClient from '@/components/OutboxClient';
import { all } from '@/lib/db';
import { smtpConfigured } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Email outbox — Producer dashboard' };

export default function AdminOutboxPage() {
  const emails = all<any>('SELECT * FROM email_log ORDER BY id DESC LIMIT 100');
  const whatsappLogs = all<any>('SELECT * FROM whatsapp_log ORDER BY id DESC LIMIT 100');
  return (
    <div>
      <AdminHeader
        eyebrow="Delivery"
        title="OUTBOX"
        accent="& WHATSAPP LOG"
        sub="Every WhatsApp alert and email the store has composed — beat deliveries, bookings, receipts, replies and notices."
      />
      <OutboxClient emails={emails} whatsappLogs={whatsappLogs} smtp={smtpConfigured()} />
    </div>
  );
}
