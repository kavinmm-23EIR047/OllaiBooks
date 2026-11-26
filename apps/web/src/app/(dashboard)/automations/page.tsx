import { AutomationsPage } from '@/modules/automations';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Automations Engine - ollaiBooks AI',
};

export default function Page() {
  return <AutomationsPage />;
}
