import * as React from 'react';

/**
 * Clean, Sharp Vector Illustrations for OneBill Portals
 * Designed with Solid OneBill Blue (#0066FF) and sharp crisp geometry.
 * ZERO gradients, flat clean aesthetics.
 */

export function BillingIllustration({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background Document Card */}
      <rect x="45" y="10" width="110" height="90" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
      
      {/* Invoice Top Blue Accent Bar */}
      <rect x="45" y="10" width="110" height="12" rx="2" fill="#0066FF" />
      <rect x="55" y="14" width="30" height="4" rx="1" fill="#FFFFFF" />

      {/* Invoice Number & Date */}
      <rect x="55" y="30" width="40" height="5" rx="1" fill="#0F172A" />
      <rect x="115" y="30" width="30" height="4" rx="1" fill="#94A3B8" />
      <line x1="55" y1="40" x2="145" y2="40" stroke="#E2E8F0" strokeWidth="1" />

      {/* Line Items */}
      <rect x="55" y="47" width="50" height="4" rx="1" fill="#475569" />
      <rect x="125" y="47" width="20" height="4" rx="1" fill="#0F172A" />

      <rect x="55" y="56" width="40" height="4" rx="1" fill="#64748B" />
      <rect x="125" y="56" width="20" height="4" rx="1" fill="#0F172A" />

      {/* Subtotal line */}
      <line x1="55" y1="67" x2="145" y2="67" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="115" y="73" width="30" height="6" rx="1" fill="#0066FF" />

      {/* Sharp Paid Seal */}
      <rect x="55" y="75" width="36" height="15" rx="2" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
      <text x="61" y="86" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">PAID</text>
    </svg>
  );
}

export function CrmIllustration({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* CRM Board Container */}
      <rect x="25" y="12" width="150" height="86" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      
      {/* 3 Pipeline Columns */}
      <rect x="33" y="20" width="40" height="70" rx="2" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="80" y="20" width="40" height="70" rx="2" fill="#EEF6FF" stroke="#BAE0FF" strokeWidth="1" />
      <rect x="127" y="20" width="40" height="70" rx="2" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />

      {/* Pipeline Headers */}
      <rect x="37" y="24" width="20" height="4" rx="1" fill="#64748B" />
      <rect x="84" y="24" width="22" height="4" rx="1" fill="#0066FF" />
      <rect x="131" y="24" width="20" height="4" rx="1" fill="#64748B" />

      {/* Deal Cards */}
      <rect x="37" y="33" width="32" height="18" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="40" y="38" width="16" height="3" rx="1" fill="#0F172A" />

      <rect x="84" y="33" width="32" height="22" rx="2" fill="#FFFFFF" stroke="#0066FF" strokeWidth="1.5" />
      <rect x="88" y="38" width="22" height="4" rx="1" fill="#0066FF" />
      <rect x="88" y="45" width="14" height="3" rx="1" fill="#059669" />

      <rect x="131" y="33" width="32" height="18" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="135" y="38" width="18" height="3" rx="1" fill="#0F172A" />

      {/* Stage Flow Indicator */}
      <circle cx="74" cy="42" r="3" fill="#0066FF" />
      <circle cx="121" cy="42" r="3" fill="#059669" />
    </svg>
  );
}

export function OrdersIllustration({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Connecting Flow Line */}
      <line x1="35" y1="55" x2="165" y2="55" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />

      {/* Online Store Node */}
      <rect x="25" y="35" width="40" height="40" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="33" y="44" width="24" height="6" rx="1" fill="#475569" />
      <rect x="37" y="54" width="16" height="4" rx="1" fill="#94A3B8" />

      {/* Central Sync Core */}
      <rect x="80" y="30" width="40" height="50" rx="3" fill="#0066FF" stroke="#0052CC" strokeWidth="1.5" />
      <rect x="88" y="40" width="24" height="6" rx="1" fill="#FFFFFF" />
      <rect x="91" y="50" width="18" height="4" rx="1" fill="#BAE0FF" />
      <rect x="91" y="58" width="12" height="4" rx="1" fill="#BAE0FF" />

      {/* Invoiced Result Node */}
      <rect x="135" y="35" width="40" height="40" rx="3" fill="#FFFFFF" stroke="#059669" strokeWidth="1.5" />
      <circle cx="155" cy="55" r="9" fill="#ECFDF5" />
      <path d="M 151 55 L 154 58 L 160 52" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AiTelephonyIllustration({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Base Panel */}
      <rect x="35" y="15" width="130" height="80" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Bot Icon */}
      <circle cx="60" cy="42" r="14" fill="#EEF6FF" stroke="#0066FF" strokeWidth="1.5" />
      <circle cx="56" cy="40" r="1.5" fill="#0066FF" />
      <circle cx="64" cy="40" r="1.5" fill="#0066FF" />
      <path d="M 57 46 Q 60 48 63 46" stroke="#0066FF" strokeWidth="1.2" strokeLinecap="round" />

      {/* Voice Wave Bars */}
      <line x1="88" y1="42" x2="88" y2="42" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="95" y1="34" x2="95" y2="50" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="102" y1="28" x2="102" y2="56" stroke="#0052CC" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="109" y1="36" x2="109" y2="48" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="116" y1="40" x2="116" y2="44" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Verified Call Pill */}
      <rect x="50" y="66" width="100" height="18" rx="2" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
      <text x="65" y="78" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">VERIFIED BY AI</text>
    </svg>
  );
}

export function ComplianceIllustration({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Chart Canvas */}
      <rect x="30" y="15" width="140" height="80" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Sharp Flat Bars */}
      <rect x="45" y="55" width="14" height="30" rx="1" fill="#BAE0FF" />
      <rect x="67" y="40" width="14" height="45" rx="1" fill="#0066FF" />
      <rect x="89" y="48" width="14" height="37" rx="1" fill="#0052CC" />
      <rect x="111" y="32" width="14" height="53" rx="1" fill="#059669" />

      {/* Trendline */}
      <path d="M 52 52 L 74 36 L 96 44 L 118 28" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="118" cy="28" r="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />

      {/* GST Badge */}
      <rect x="135" y="25" width="26" height="24" rx="2" fill="#EEF6FF" stroke="#0066FF" strokeWidth="1" />
      <text x="138" y="38" fill="#0066FF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">GSTR</text>
      <text x="139" y="45" fill="#0052CC" fontSize="6" fontWeight="bold" fontFamily="sans-serif">OK</text>
    </svg>
  );
}
