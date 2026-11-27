import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DealsPage } from '@/modules/crm';

export const metadata: Metadata = { title: 'Deals - ollaiBooks CRM' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DealsPage />
    </Suspense>
  );
}
