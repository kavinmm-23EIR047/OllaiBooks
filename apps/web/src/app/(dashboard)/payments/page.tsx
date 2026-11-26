import { PaymentsPage } from '@/modules/payments';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments & Reconciliation - ollaiBooks AI',
};

export default function Page() {
  return <PaymentsPage />;
}
