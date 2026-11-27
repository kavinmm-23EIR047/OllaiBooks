import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ActivitiesPage } from '@/modules/crm';

export const metadata: Metadata = { title: 'Activities - ollaiBooks CRM' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ActivitiesPage />
    </Suspense>
  );
}
