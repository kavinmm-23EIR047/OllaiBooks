import { CustomersPage } from '@/modules/customers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Directory - ollaiBooks AI',
};

export default function Page() {
  return <CustomersPage />;
}
