import { SettingsPage } from '@/modules/settings';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings & GST - ollaiBooks AI',
};

export default function Page() {
  return <SettingsPage />;
}
