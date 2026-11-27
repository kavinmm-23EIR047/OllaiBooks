'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, HardDrive, Laptop, ShieldCheck, Smartphone, WifiOff } from 'lucide-react';
import { SUPPORT } from '@/lib/native-app';

type Downloads = { windows?: { name: string; url: string }; mac?: { name: string; url: string }; android?: { name: string; url: string } };

/**
 * Shown in a normal web browser wherever offline features are requested.
 * The browser stays online-only; offline billing lives in the installed app.
 */
export function DownloadAppGate({ reason = 'offline-billing' }: { reason?: 'offline-billing' | 'offline-login' }) {
  const [downloads, setDownloads] = React.useState<Downloads | null>(null);
  const [unavailable, setUnavailable] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/native-downloads')
      .then((r) => r.json())
      .then((d) => { setDownloads(d.downloads || {}); setUnavailable(Boolean(d.unavailable)); })
      .catch(() => setUnavailable(true));
  }, []);

  const card = (icon: React.ReactNode, title: string, sub: string, asset?: { name: string; url: string }) => (
    <a
      href={asset?.url || '#'}
      onClick={(e) => { if (!asset) e.preventDefault(); }}
      aria-disabled={!asset}
      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${asset ? 'border-silver-200 bg-white hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg' : 'cursor-not-allowed border-dashed border-silver-300 bg-silver-50 opacity-70'}`}
    >
      <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-navy-800 text-white">{icon}</span>
      <span className="min-w-0 flex-1">
        <b className="block text-[14px] text-slate-900">{title}</b>
        <span className="block truncate text-[12px] text-silver-600">{asset ? asset.name : sub}</span>
      </span>
      {asset && <Download className="h-5 w-5 text-blue-600" />}
    </a>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-silver-50 via-white to-blue-50 px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-silver-200 bg-white p-6 shadow-xl sm:p-8">
        <Link href="/login" className="mb-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-silver-600 hover:text-blue-700"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200"><WifiOff className="h-7 w-7" /></span>
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight text-slate-900">
              {reason === 'offline-login' ? 'You’re offline — use the ollaiBooks app' : 'Offline billing lives in the ollaiBooks app'}
            </h1>
            <p className="mt-1 text-[14px] leading-relaxed text-silver-700">
              The website works <b>online only</b>, after you sign in. To bill without internet, install the app once.
              It keeps your bills encrypted on your laptop or phone, saves every invoice as a PDF file, and syncs to your cloud workspace when you’re back online.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {card(<Laptop className="h-5 w-5" />, 'Windows', 'Coming soon', downloads?.windows)}
          {card(<Smartphone className="h-5 w-5" />, 'Android', 'Coming soon', downloads?.android)}
          {card(<Laptop className="h-5 w-5" />, 'macOS', 'Coming soon', downloads?.mac)}
        </div>
        {unavailable && <p className="mt-3 text-[12px] text-silver-600">Couldn’t load download links right now. Check your internet, or ask our team for the installer.</p>}

        <ul className="mt-6 grid gap-2 rounded-xl bg-silver-50 p-4 text-[13px] text-slate-700 sm:grid-cols-3">
          <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" /> Sign in online once, then bill offline for up to 7 days</li>
          <li className="flex items-start gap-2"><HardDrive className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" /> Invoices saved in Documents › ollaiBooks</li>
          <li className="flex items-start gap-2"><Download className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" /> Small installer, automatic update alerts</li>
        </ul>

        <p className="mt-5 text-center text-[12px] text-silver-600">
          Need help installing? Call <a href={SUPPORT.phoneHref} className="font-semibold text-blue-700">{SUPPORT.phone}</a> or <a href={SUPPORT.whatsapp} target="_blank" rel="noreferrer" className="font-semibold text-blue-700">WhatsApp us</a> · {SUPPORT.hours}
        </p>
      </section>
    </main>
  );
}
