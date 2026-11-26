import { InvoicesPage } from '@/modules/invoices';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoices & Billing - ollaiBooks AI',
};

export default function Page() {
  return <InvoicesPage />;
}
