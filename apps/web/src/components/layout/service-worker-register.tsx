'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
          return navigator.serviceWorker.ready.then((readyRegistration) => {
            const worker = readyRegistration.active || registration.active;
            if (!worker) return;
            const staticUrls = performance.getEntriesByType('resource')
              .map((entry) => entry.name)
              .filter((value) => {
                try {
                  const url = new URL(value);
                  return url.origin === window.location.origin && url.pathname.startsWith('/_next/static/');
                } catch {
                  return false;
                }
              });
            worker.postMessage({ type: 'CACHE_NEXT_STATIC', urls: staticUrls });
          });
        }).catch((error) => console.warn('Could not register the ollaiBooks offline worker.', error));
      } else {
        // In local development, unregister any stale service workers and purge Cache Storage
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        }).catch(() => undefined);

        if ('caches' in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key);
            }
          }).catch(() => undefined);
        }
      }
    }
  }, []);

  return null;
}
