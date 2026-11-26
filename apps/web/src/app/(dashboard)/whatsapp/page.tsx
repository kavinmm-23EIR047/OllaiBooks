import { WhatsAppPage } from '@/modules/whatsapp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WhatsApp AI - ollaiBooks AI',
};

export default function Page() {
  return <WhatsAppPage />;
}
