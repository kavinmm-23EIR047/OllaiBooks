import { DashboardPage } from '@/modules/dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Overview - ollaiBooks AI',
};

export default function Page() {
  return <DashboardPage />;
}
