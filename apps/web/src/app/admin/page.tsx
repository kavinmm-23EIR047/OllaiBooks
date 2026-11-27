import type { Metadata } from 'next';
import { AdminConsole } from '@/modules/admin/admin-console';

export const metadata: Metadata = { title: 'Admin Console - ollaiBooks', robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminConsole />;
}
