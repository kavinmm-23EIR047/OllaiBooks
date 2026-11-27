import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LeadsPage } from '@/modules/crm';

export const metadata: Metadata = { title: 'Leads - ollaiBooks CRM' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LeadsPage />
    </Suspense>
  );
}
