import type { Metadata } from 'next';
import { ServiceWorkerRegister } from '@/components/layout/service-worker-register';
import './globals.css';

export const metadata: Metadata = {
  title: 'ollaiBooks - Billing, Orders & AI',
  description: 'Offline billing, online orders, and AI tools for small businesses.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'ollaiBooks POS', statusBarStyle: 'default' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-sans bg-[#F7F8FA] text-[#222222]">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
