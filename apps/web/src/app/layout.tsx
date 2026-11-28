import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ServiceWorkerRegister } from '@/components/layout/service-worker-register';
import './globals.css';

// Fonts are bundled locally (variable weight files) so builds never depend on
// fetching from Google Fonts, which fails intermittently on CI runners.
const manrope = localFont({
  src: './fonts/manrope-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-manrope',
  display: 'swap',
});

const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
});

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
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${manrope.className} antialiased font-sans bg-[#F1F5F9] text-[#0F172A]`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
