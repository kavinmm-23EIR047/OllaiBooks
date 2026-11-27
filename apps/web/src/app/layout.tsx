import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/layout/service-worker-register';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${plusJakarta.className} antialiased font-sans bg-[#F5F7FB] text-[#0F172A]`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
