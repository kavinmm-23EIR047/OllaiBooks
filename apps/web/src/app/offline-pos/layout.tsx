import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './offline-pos.css';

export const metadata: Metadata = {
  title: 'Offline POS & Invoicing Engine | ollaiBooks',
  description: 'Multi-tenant offline billing, stock tracking, Excel import/export, and instant receipts across Windows, Mac, Android, and iOS.',
};

export default function OfflinePosLayout({ children }: { children: ReactNode }) {
  return children;
}
