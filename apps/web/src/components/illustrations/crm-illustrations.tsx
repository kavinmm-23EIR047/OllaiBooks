/** ollaiBooks CRM illustrations — original inline SVGs in brand blue + silver gray (render offline). */

type P = { className?: string };

export function CrmLeadsIllustration({ className = 'w-44 h-auto' }: P) {
  return (
    <svg viewBox="0 0 220 150" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="obLeadBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EEF0F4" /><stop offset="1" stopColor="#E0EFFF" /></linearGradient>
        <linearGradient id="obLeadMag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#389EFF" /><stop offset="1" stopColor="#0052CC" /></linearGradient>
      </defs>
      <ellipse cx="110" cy="140" rx="86" ry="7" fill="#0A214B" opacity=".07" />
      <rect x="14" y="12" width="192" height="118" rx="24" fill="url(#obLeadBg)" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${36 + i * 8} ${38 + i * 26})`}>
          <rect width="112" height="20" rx="10" fill="#fff" stroke="#CDD2DA" strokeWidth="1.5" />
          <circle cx="11" cy="10" r="6" fill={['#0066FF', '#A7AEBA', '#389EFF'][i]} />
          <rect x="23" y="7" width={[56, 40, 64][i]} height="6" rx="3" fill="#CDD2DA" />
        </g>
      ))}
      <g transform="translate(140 52)">
        <circle cx="24" cy="24" r="20" fill="#fff" stroke="url(#obLeadMag)" strokeWidth="6" />
        <path d="m38 38 16 16" stroke="#0A214B" strokeWidth="8" strokeLinecap="round" />
        <path d="m16 24 6 6 11-12" stroke="#0066FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx="186" cy="30" r="8" fill="#fde68a" stroke="#0A214B" strokeWidth="2" />
      <path d="M186 26v8M182 30h8" stroke="#0A214B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CrmPipelineIllustration({ className = 'w-52 h-auto' }: P) {
  const cols = [{ x: 22, h: 3, c: '#A7AEBA' }, { x: 78, h: 2, c: '#389EFF' }, { x: 134, h: 1, c: '#0066FF' }];
  return (
    <svg viewBox="0 0 220 150" className={className} fill="none" aria-hidden="true">
      <ellipse cx="110" cy="140" rx="90" ry="7" fill="#0A214B" opacity=".07" />
      {cols.map((col, ci) => (
        <g key={ci}>
          <rect x={col.x} y="18" width="50" height="112" rx="10" fill="#EEF0F4" stroke="#E2E5EB" strokeWidth="1.5" />
          <rect x={col.x} y="18" width="50" height="6" rx="3" fill={col.c} />
          {Array.from({ length: col.h }).map((_, i) => (
            <g key={i} transform={`translate(${col.x + 6} ${32 + i * 30})`}>
              <rect width="38" height="24" rx="5" fill="#fff" stroke="#CDD2DA" strokeWidth="1.2" />
              <rect x="5" y="6" width="22" height="4" rx="2" fill="#CDD2DA" />
              <rect x="5" y="14" width="14" height="4" rx="2" fill={col.c} />
            </g>
          ))}
        </g>
      ))}
      <path d="M60 66c16-14 32-14 46-2" stroke="#0066FF" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="m102 58 5 6-7 2" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(176 40)">
        <circle cx="16" cy="16" r="16" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />
        <path d="M10 16h12M16 10v12" stroke="#16a34a" strokeWidth="0" />
        <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="800" fill="#16a34a" fontFamily="Arial">₹</text>
      </g>
    </svg>
  );
}

export function CrmTasksIllustration({ className = 'w-44 h-auto' }: P) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="none" aria-hidden="true">
      <ellipse cx="100" cy="132" rx="76" ry="6" fill="#0A214B" opacity=".07" />
      <rect x="40" y="14" width="96" height="110" rx="12" fill="#fff" stroke="#0A214B" strokeWidth="2.5" />
      <rect x="40" y="14" width="96" height="24" rx="12" fill="#0066FF" />
      <rect x="40" y="28" width="96" height="10" fill="#0066FF" />
      <circle cx="64" cy="14" r="4" fill="#fff" stroke="#0A214B" strokeWidth="2" />
      <circle cx="112" cy="14" r="4" fill="#fff" stroke="#0A214B" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(52 ${50 + i * 22})`}>
          <rect width="12" height="12" rx="3" fill={i === 0 ? '#16a34a' : '#fff'} stroke={i === 0 ? '#16a34a' : '#A7AEBA'} strokeWidth="2" />
          {i === 0 && <path d="m3 6 2.5 2.5L9.5 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="20" y="3" width={[48, 56, 38][i]} height="6" rx="3" fill="#CDD2DA" />
        </g>
      ))}
      <g transform="translate(130 70)">
        <circle cx="24" cy="24" r="22" fill="#EEF0F4" stroke="#0A214B" strokeWidth="2.5" />
        <path d="M24 12v12l8 6" stroke="#0066FF" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
