'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { Card } from '@/components/ui/card';
import { Sliders, Save, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { AiSymbol } from '@/components/ui/ai-symbol';

export function SettingsPage() {
  const [profile, setProfile] = React.useState<any>({
    legalName: 'akwebflairtechnologies',
    gstin: '33AAAAA0000A1Z5',
    email: 'akwebflairtechnologies@gmail.com',
    phone: '9876543210',
    streetAddress: '104 Tech Hub, Anna Salai',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    postalCode: '641001',
  });
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    ApiClient.get<any>('/business-profile')
      .then((value) => {
        if (value && Object.keys(value).length > 0) {
          setProfile((prev: any) => ({ ...prev, ...value }));
        }
      })
      .catch((reason) => setError(reason.message));
  }, []);

  // Autonomous Agent Listeners for Settings & GST Configuration
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSettingsEvent = async (e: any) => {
      const gstinVal = e?.detail?.gstin || '33AAAAA0000A1Z5';
      setProfile((prev: any) => ({ ...prev, gstin: gstinVal }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    };

    window.addEventListener('billpilot:update-settings', handleSettingsEvent);

    const params = new URLSearchParams(window.location.search);
    if (params.get('autoUpdate') === 'true') {
      const gstin = params.get('gstin');
      if (gstin) {
        setProfile((prev: any) => ({ ...prev, gstin }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    }

    return () => {
      window.removeEventListener('billpilot:update-settings', handleSettingsEvent);
    };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSaved(false);
    try {
      const { invoiceNextNumber, taxRate, id, tenantId, createdAt, updatedAt, ...payload } = profile;
      const res = await ApiClient.request('/business-profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setProfile((prev: any) => ({ ...prev, ...res }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Settings & GST Configuration"
        description="Set business identity and tax information."
        primaryAction={{
          label: saved ? 'Saved Successfully!' : 'Save Settings',
          onClick: () => {
            const formEl = document.getElementById('settings-form') as HTMLFormElement;
            if (formEl) formEl.requestSubmit();
          },
          icon: <Save className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="dashboard" />

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </p>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>GST compliance profile and tax information saved successfully!</span>
        </div>
      )}

      <Card className="p-6 max-w-3xl rounded-[4px] border border-[#CBD5E1] bg-white shadow-xs">
        <form id="settings-form" className="space-y-4" onSubmit={save}>
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
            <div className="h-8 w-8 rounded-[4px] bg-[#EAF2FE] text-[#0066FF] flex items-center justify-center font-bold">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-[#0F172A]">Business Profile & Tax Configuration</h4>
              <p className="text-[12px] text-[#64748B]">Used on all issued GST tax invoices and PDF exports</p>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Legal Business Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ak Webflair Technologies Pvt Ltd"
              value={profile.legalName || ''}
              onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">GSTIN Number</label>
              <input
                type="text"
                placeholder="33AAAAA0000A1Z5"
                value={profile.gstin || ''}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Invoice Prefix</label>
              <input
                type="text"
                placeholder="INV-2026-"
                value={profile.invoicePrefix || 'INV-2026-'}
                onChange={(e) => setProfile({ ...profile, invoicePrefix: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Billing Email</label>
              <input
                type="email"
                placeholder="billing@yourdomain.com"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Support Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Street Address</label>
            <input
              type="text"
              placeholder="104 Tech Hub, Anna Salai"
              value={profile.streetAddress || ''}
              onChange={(e) => setProfile({ ...profile, streetAddress: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">City</label>
              <input
                type="text"
                placeholder="Coimbatore"
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">State</label>
              <input
                type="text"
                placeholder="Tamil Nadu"
                value={profile.state || ''}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Postal Code</label>
              <input
                type="text"
                placeholder="641001"
                value={profile.postalCode || ''}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-[4px] bg-[#0066FF] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0052CC] active:scale-[0.98] transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save Configuration
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
