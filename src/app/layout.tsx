import type { Metadata } from 'next';
import './globals.css';
import { getSettings } from '@/lib/db';
import { readAdmin, readSession } from '@/lib/auth';
import { SettingsProvider } from '@/components/SettingsProvider';
import { CartProvider } from '@/components/CartProvider';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Beatvault — Premium beats, delivered instantly',
  description:
    'Buy Afrobeat, Drill, Amapiano and Trap instrumentals. Pay with Mobile Money or bank transfer and get your files by email instantly.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  const artist = await readSession();
  const admin = await readAdmin();

  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-900 antialiased">
        <SettingsProvider settings={settings}>
          <ToastProvider>
            <CartProvider>
              <Navbar isArtist={!!artist} isAdmin={!!admin} />
              <main>{children}</main>
              <Footer settings={settings} />
              <CartDrawer />
            </CartProvider>
          </ToastProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
