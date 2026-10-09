import AdminHeader from '@/components/AdminHeader';
import SettingsClient from '@/components/SettingsClient';
import { getSettings } from '@/lib/db';
import { smtpConfigured } from '@/lib/mailer';
import { paystackMode } from '@/lib/paystack';
import { storageMode } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings — Producer dashboard' };

export default function AdminSettingsPage() {
  return (
    <div>
      <AdminHeader
        eyebrow="Configuration"
        title="SET"
        accent="TINGS"
        sub="Brand, homepage copy, pricing currency, payment keys and delivery email."
      />
      <SettingsClient
        settings={getSettings()}
        smtp={smtpConfigured()}
        storage={storageMode()}
        paystack={paystackMode()}
      />
    </div>
  );
}
