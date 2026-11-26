import { ReportsPage } from '@/modules/reports';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports & Audits - ollaiBooks AI',
  description: 'Financial ledger, sales summaries, and tax reports with automated verification.',
};

export default function Page() {
  return <ReportsPage />;
}
