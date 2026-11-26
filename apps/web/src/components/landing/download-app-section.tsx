'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Apple, MonitorDown, Smartphone, Laptop, ArrowRight, Clock3 } from 'lucide-react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const platforms = [
  {
    name: 'Android',
    detail: 'Download the standalone APK or install directly from Chrome.',
    icon: Smartphone,
    downloadUrl: process.env.NEXT_PUBLIC_ANDROID_APK_URL || '',
    downloadLabel: 'Download APK',
  },
  {
    name: 'iPhone & iPad',
    detail: 'Open in Safari, tap Share, then Add to Home Screen.',
    icon: Apple,
    downloadUrl: process.env.NEXT_PUBLIC_IOS_APP_URL || '',
    downloadLabel: 'App Store / Safari',
  },
  {
    name: 'Windows',
    detail: 'Download the Windows .EXE installer or install via Edge/Chrome.',
    icon: MonitorDown,
    downloadUrl: process.env.NEXT_PUBLIC_WINDOWS_EXE_URL || '',
    downloadLabel: 'Download .EXE',
  },
  {
    name: 'Mac',
    detail: 'Download the macOS .DMG installer or Safari Add to Dock.',
    icon: Laptop,
    downloadUrl: process.env.NEXT_PUBLIC_MAC_DMG_URL || '',
    downloadLabel: 'Download .DMG',
  },
];

export function DownloadAppSection() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState('');

  useEffect(() => {
    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstallStatus('ollaiBooks is installed on this device.');
    };
    window.addEventListener('beforeinstallprompt', handleInstallAvailable);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallStatus(choice.outcome === 'accepted' ? 'ollaiBooks is installing.' : 'You can install ollaiBooks later from your browser menu.');
    setInstallPrompt(null);
  };

  return (
    <section id="download-app" className="border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/60 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            <Clock3 className="h-3.5 w-3.5" /> Offline-first POS app
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Take ollaiBooks to the Counter
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Install ollaiBooks on your counter tablet, phone, or computer. It keeps billing and saving receipts smoothly even if your internet goes down.
          </p>
          {installPrompt && (
            <button type="button" onClick={install} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Install ollaiBooks App
            </button>
          )}
          <p aria-live="polite" className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {installStatus || 'Open this page online once over HTTPS, then install it from your browser. Bills stay on each device.'}
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map(({ name, detail, icon: Icon, downloadUrl, downloadLabel }) => (
            <article key={name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950 flex flex-col">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{name}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex-1">{detail}</p>
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  {downloadLabel}
                </a>
              ) : (
                <Link href="/offline-pos" className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  Open Offline POS
                </Link>
              )}
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <p className="text-xs text-slate-500 dark:text-slate-400">Bills are stored separately on each device. Export a backup to move sales between devices or into Excel.</p>
          <Link href="/offline-pos" className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 dark:text-rose-300">
            Start billing <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
