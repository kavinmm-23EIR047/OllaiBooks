import { SubscriptionsPage } from '@/modules/subscriptions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscriptions & Usage - ollaiBooks AI',
};

export default function Page() {
  return <SubscriptionsPage />;
}
