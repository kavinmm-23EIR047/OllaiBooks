import type { Metadata } from 'next';
import { Manrope, Inter } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/layout/service-worker-register';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
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
