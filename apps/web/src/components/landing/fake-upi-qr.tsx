'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface FakeUpiQrProps {
  amount?: number | string;
  invoiceNumber?: string;
  payeeName?: string;
  upiId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onPaymentSuccess?: () => void;
}

export function FakeUpiQr({
  amount = '28,450.00',
  invoiceNumber = 'INV-2026-0842',
  payeeName = 'Acme Corporation Pvt Ltd',
  upiId = 'billpilot.acme@icici',
  size = 'md',
  className = '',
  onPaymentSuccess,
}: FakeUpiQrProps) {
  const [isPaid, setIsPaid] = React.useState(false);
  const [simulating, setSimulating] = React.useState(false);

  const handleSimulatePayment = () => {
    if (isPaid || simulating) return;
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setIsPaid(true);
      if (onPaymentSuccess) onPaymentSuccess();
    }, 900);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaid(false);
  };

  return (
    <div
      onClick={handleSimulatePayment}
      className={`group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer text-center select-none ${className}`}
      title="Click to simulate real-time UPI scan & settlement"
    >
      {/* Top Header Pill */}
      <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
            Instant UPI Pay
          </span>
        </div>
        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
          Zero Fee
        </span>
      </div>

      {/* QR Box Container */}
      <div className="relative mx-auto flex items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200/80">
        {/* Crisp SVG QR Code Pattern */}
        <svg
          viewBox="0 0 160 160"
          className={`mx-auto transition-all ${isPaid ? 'opacity-20 blur-[1px]' : 'opacity-95'} ${size === 'sm' ? 'w-24 h-24' : size === 'lg' ? 'w-44 h-44' : 'w-32 h-32'}`}
        >
          {/* Background */}
          <rect width="160" height="160" fill="#FFFFFF" rx="6" />

          {/* Top-Left Position Detection Marker */}
          <rect x="12" y="12" width="40" height="40" fill="#0F172A" rx="4" />
          <rect x="18" y="18" width="28" height="28" fill="#FFFFFF" rx="2" />
          <rect x="24" y="24" width="16" height="16" fill="#0066FF" rx="2" />

          {/* Top-Right Position Detection Marker */}
          <rect x="108" y="12" width="40" height="40" fill="#0F172A" rx="4" />
          <rect x="114" y="18" width="28" height="28" fill="#FFFFFF" rx="2" />
          <rect x="120" y="24" width="16" height="16" fill="#0066FF" rx="2" />

          {/* Bottom-Left Position Detection Marker */}
          <rect x="12" y="108" width="40" height="40" fill="#0F172A" rx="4" />
          <rect x="18" y="114" width="28" height="28" fill="#FFFFFF" rx="2" />
          <rect x="24" y="120" width="16" height="16" fill="#0066FF" rx="2" />

          {/* Authentic QR Alignment & Timing Strips */}
          <g fill="#0F172A">
            {/* Horizontal & Vertical Timing */}
            <rect x="58" y="26" width="6" height="6" />
            <rect x="70" y="26" width="6" height="6" />
            <rect x="82" y="26" width="6" height="6" />
            <rect x="94" y="26" width="6" height="6" />

            <rect x="26" y="58" width="6" height="6" />
            <rect x="26" y="70" width="6" height="6" />
            <rect x="26" y="82" width="6" height="6" />
            <rect x="26" y="94" width="6" height="6" />

            {/* Simulated Data Matrix Clusters */}
            <rect x="58" y="40" width="10" height="6" />
            <rect x="74" y="40" width="8" height="6" />
            <rect x="88" y="40" width="14" height="6" />

            <rect x="40" y="58" width="12" height="12" />
            <rect x="58" y="58" width="6" height="12" />
            <rect x="70" y="58" width="16" height="6" />
            <rect x="92" y="58" width="8" height="12" />
            <rect x="106" y="58" width="14" height="6" />
            <rect x="126" y="58" width="18" height="6" />

            <rect x="40" y="76" width="14" height="6" />
            <rect x="60" y="76" width="8" height="8" />
            <rect x="94" y="76" width="12" height="12" />
            <rect x="112" y="76" width="8" height="6" />
            <rect x="126" y="76" width="14" height="12" />

            <rect x="40" y="90" width="6" height="12" />
            <rect x="52" y="90" width="12" height="6" />
            <rect x="70" y="90" width="6" height="12" />
            <rect x="112" y="90" width="14" height="8" />
            <rect x="132" y="90" width="12" height="6" />

            {/* Bottom clusters */}
            <rect x="58" y="108" width="12" height="8" />
            <rect x="76" y="108" width="8" height="14" />
            <rect x="90" y="108" width="12" height="8" />
            <rect x="108" y="108" width="16" height="8" />
            <rect x="130" y="108" width="14" height="12" />

            <rect x="58" y="122" width="14" height="10" />
            <rect x="78" y="128" width="16" height="16" />
            <rect x="100" y="122" width="8" height="8" />
            <rect x="114" y="122" width="10" height="14" />
            <rect x="130" y="128" width="18" height="10" />

            <rect x="58" y="138" width="14" height="6" />
            <rect x="100" y="136" width="8" height="8" />
          </g>

          {/* Center Brand Badge (UPI Central Shield) */}
          <rect x="64" y="64" width="32" height="32" rx="6" fill="#0066FF" />
          <rect x="66" y="66" width="28" height="28" rx="4" fill="#FFFFFF" />
          <text
            x="80"
            y="84"
            fontFamily="Arial, sans-serif"
            fontSize="10"
            fontWeight="bold"
            fill="#0066FF"
            textAnchor="middle"
          >
            UPI
          </text>
        </svg>

        {/* Paid Overlay Animation */}
        {isPaid && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-emerald-600/95 text-white p-2 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-8 w-8 text-white drop-shadow-sm animate-bounce" />
            <span className="text-[11px] font-black tracking-wide uppercase mt-1">PAID IN 1.2s</span>
            <span className="text-[9px] font-mono text-emerald-100">UTR: 4920194821</span>
            <button
              onClick={handleReset}
              className="mt-2 text-[9px] font-bold underline text-white hover:text-emerald-200 cursor-pointer"
            >
              Reset QR
            </button>
          </div>
        )}

        {/* Simulating Overlay */}
        {simulating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-blue-600/90 text-white p-2">
            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold mt-1.5">Verifying UPI...</span>
          </div>
        )}
      </div>

      {/* Payee Details */}
      <div className="mt-2 text-[11px]">
        <p className="font-extrabold text-[#0F172A] truncate">₹{amount}</p>
        <p className="text-[10px] text-slate-500 font-mono truncate">{upiId}</p>
      </div>

      {/* Supported UPI Logos Strip */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400">
        <span className="px-1 py-0.5 rounded bg-slate-100 text-purple-700">PhonePe</span>
        <span className="px-1 py-0.5 rounded bg-slate-100 text-blue-600">GPay</span>
        <span className="px-1 py-0.5 rounded bg-slate-100 text-sky-600">Paytm</span>
        <span className="px-1 py-0.5 rounded bg-slate-100 text-slate-800">CRED</span>
      </div>

      <div className="mt-1 text-[9px] font-medium text-blue-600 group-hover:underline">
        {isPaid ? '✓ Transaction Settled' : '⚡ Tap QR to test instant pay'}
      </div>
    </div>
  );
}
