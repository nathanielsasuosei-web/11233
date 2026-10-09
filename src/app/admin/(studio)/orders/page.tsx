import AdminHeader from '@/components/AdminHeader';
import OrdersManager from '@/components/OrdersManager';
import { ordersWithItems } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders — Producer dashboard' };

export default function AdminOrdersPage() {
  const orders = ordersWithItems();
  return (
    <div>
      <AdminHeader
        eyebrow="Sales"
        title="ORDERS"
        accent="& PAYMENTS"
        sub="Every checkout, what was bought, and whether the delivery email went out. Resend files or mark an order paid at any time."
      />
      <OrdersManager orders={orders} />
    </div>
  );
}
