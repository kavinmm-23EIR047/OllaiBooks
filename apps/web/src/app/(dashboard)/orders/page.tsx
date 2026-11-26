import { OrdersPage } from '@/modules/orders';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders Inbox - ollaiBooks AI',
};

export default function Page() {
  return <OrdersPage />;
}
