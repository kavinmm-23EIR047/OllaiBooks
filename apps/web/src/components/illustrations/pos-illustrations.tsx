/**
 * ollaiBooks POS illustrations — hand-built inline SVGs (no network, so they
 * render perfectly when the counter is offline).
 */

type P = { className?: string };

/** Shop counter that keeps billing while the cloud is disconnected. */
export function OfflineCounterIllustration({ className = 'w-40 h-auto' }: P) {
  return (
    <svg viewBox="0 0 220 150" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="obOffSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="obOffAwn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="138" rx="92" ry="8" fill="#0f172a" opacity=".07" />
      <rect x="10" y="10" width="200" height="120" rx="22" fill="url(#obOffSky)" opacity=".55" />
      {/* cloud with slash */}
      <g transform="translate(138 18)">
        <path d="M14 34h40a14 14 0 0 0 0-28 20 20 0 0 0-38 4A12 12 0 0 0 14 34Z" fill="#fff" stroke="#94a3b8" strokeWidth="2.5" />
        <path d="M8 4 62 44" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* shop */}
      <rect x="36" y="58" width="100" height="72" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M30 58h112l-8-22H38Z" fill="url(#obOffAwn)" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M58 36v22M86 36v22M114 36v22" stroke="#0f172a" strokeWidth="2" opacity=".35" />
      <rect x="48" y="74" width="40" height="30" rx="4" fill="#dbeafe" stroke="#0f172a" strokeWidth="2" />
      <path d="M54 96h28M54 88h18" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <rect x="98" y="80" width="26" height="50" rx="3" fill="#fde68a" stroke="#0f172a" strokeWidth="2" />
      <circle cx="118" cy="106" r="2.5" fill="#0f172a" />
      {/* receipt coming out */}
      <g transform="translate(150 70)">
        <path d="M0 0h40v52l-5-4-5 4-5-4-5 4-5-4-5 4-5-4-5 4Z" fill="#fff" stroke="#0f172a" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M8 12h24M8 20h16M8 28h24" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 38h24" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* shield */}
      <g transform="translate(16 92)">
        <path d="M16 0 30 6v12c0 9-6 16-14 19C8 34 2 27 2 18V6Z" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="m10 18 4 4 8-9" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Two devices with arrows to a cloud — used for sync status. */
export function SyncCloudIllustration({ className = 'w-36 h-auto' }: P) {
  return (
    <svg viewBox="0 0 200 130" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="obSyncCloud" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="122" rx="80" ry="6" fill="#0f172a" opacity=".06" />
      <path d="M68 52h66a20 20 0 0 0 0-40 30 30 0 0 0-56 6 18 18 0 0 0-10 34Z" fill="url(#obSyncCloud)" />
      <path d="m88 34 8 8 16-16" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="70" width="58" height="40" rx="6" fill="#fff" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M14 114h70" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 84h28M30 94h18" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      <rect x="138" y="66" width="34" height="50" rx="7" fill="#fff" stroke="#0f172a" strokeWidth="2.5" />
      <path d="M146 80h18M146 90h12" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 64c4-6 10-10 18-12" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="4 5" strokeLinecap="round" />
      <path d="M152 60c-3-5-8-8-14-9" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="4 5" strokeLinecap="round" />
    </svg>
  );
}

/** Friendly empty basket for an empty cart. */
export function EmptyCartIllustration({ className = 'w-28 h-auto' }: P) {
  return (
    <svg viewBox="0 0 160 120" className={className} fill="none" aria-hidden="true">
      <ellipse cx="80" cy="110" rx="56" ry="6" fill="#0f172a" opacity=".06" />
      <circle cx="80" cy="56" r="46" fill="#eff6ff" />
      <path d="M40 46h80l-9 40a6 6 0 0 1-6 5H55a6 6 0 0 1-6-5Z" fill="#fff" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M56 46 70 22M104 46 90 22" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M62 60v18M80 60v18M98 60v18" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
      <circle cx="122" cy="26" r="10" fill="#fde68a" stroke="#0f172a" strokeWidth="2" />
      <path d="M122 21v10M117 26h10" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Clipboard + shield for the audit trail. */
export function AuditShieldIllustration({ className = 'w-24 h-auto' }: P) {
  return (
    <svg viewBox="0 0 140 120" className={className} fill="none" aria-hidden="true">
      <circle cx="70" cy="60" r="50" fill="#f0fdf4" />
      <rect x="34" y="20" width="56" height="78" rx="7" fill="#fff" stroke="#0f172a" strokeWidth="2.5" />
      <rect x="50" y="14" width="24" height="12" rx="4" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.2" />
      <path d="M44 42h36M44 54h28M44 66h32M44 78h20" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(78 54)">
        <path d="M18 0 34 7v13c0 10-7 18-16 21C9 38 2 30 2 20V7Z" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="m11 20 5 5 9-10" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Upload-your-logo placeholder. */
export function LogoUploadIllustration({ className = 'w-14 h-14' }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" strokeDasharray="5 4" />
      <path d="M20 42 28 32l6 7 5-5 7 8Z" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="40" cy="22" r="5" fill="#fde68a" stroke="#2563eb" strokeWidth="2" />
    </svg>
  );
}
