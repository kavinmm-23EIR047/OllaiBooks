'use client';

import * as React from 'react';
import { ApiClient } from '@/lib/api-client';
import { WorkspaceHeader } from '@/components/workspace/header';
import { Button } from '@/components/ui/button';
import { PhoneCall, Settings2, Megaphone, ShieldCheck, RefreshCw, Play, Eye, Trash2, Save, Mic2 } from 'lucide-react';

type Tab = 'calls' | 'campaigns' | 'settings' | 'privacy';
const panel = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const field = 'mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50';

export function VoiceAgentPage() {
  const [tab, setTab] = React.useState<Tab>('calls');
  const [calls, setCalls] = React.useState<any[]>([]);
  const [config, setConfig] = React.useState<any>({ isEnabled: false, language: 'en-IN', voiceId: 'default', greeting: '', callingWindowStart: '09:00', callingWindowEnd: '19:00', maxAttempts: 3 });
  const [consents, setConsents] = React.useState<any[]>([]);
  const [dnc, setDnc] = React.useState<any[]>([]);
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [metrics, setMetrics] = React.useState<any>({ callsMade: 0, answeredRate: 0, promisesToPay: 0, disputes: 0, amountRecoveredInr: '0.00' });
  const [invoiceIds, setInvoiceIds] = React.useState('');
  const [testNumber, setTestNumber] = React.useState('');
  const [testAuthorized, setTestAuthorized] = React.useState(false);
  const [campaignName, setCampaignName] = React.useState('Cake shop payment reminders');
  const [preview, setPreview] = React.useState<any>(null);
  const [selectedCall, setSelectedCall] = React.useState<any>(null);
  const [dncPhone, setDncPhone] = React.useState('');
  const [consentCustomerId, setConsentCustomerId] = React.useState('');
  const [consentPhone, setConsentPhone] = React.useState('');
  const [consentSource, setConsentSource] = React.useState('Written customer opt-in');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setError('');
    try {
      const [callData, settingData, consentData, dncData, campaignData, metricData] = await Promise.all([
        ApiClient.get<any>('/voice-agent/calls'), ApiClient.get<any>('/voice-agent/config'),
        ApiClient.get<any>('/voice-agent/consents'), ApiClient.get<any>('/voice-agent/do-not-call'), ApiClient.get<any>('/voice-agent/campaigns'), ApiClient.get<any>('/voice-agent/metrics'),
      ]);
      setCalls(Array.isArray(callData) ? callData : callData?.items || []);
      if (settingData?.settings) {
        const { timezone: _timezone, ...editableSettings } = settingData.settings;
        setConfig(editableSettings);
      }
      setConsents(Array.isArray(consentData) ? consentData : []);
      setDnc(Array.isArray(dncData) ? dncData : []);
      setCampaigns(Array.isArray(campaignData) ? campaignData : []);
      setMetrics(metricData);
    } catch (reason: any) { setError(reason?.message || 'Could not load voice agent data'); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<any>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(success); await load(); }
    catch (reason: any) { setError(reason?.message || 'Request failed'); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto w-full max-w-[1440px] space-y-5 px-3 pb-8 sm:px-5 lg:px-8">
    <WorkspaceHeader title="AI Voice Agent" description="Consent-based bill reminders and invoice enquiries for your workspace." badge="LiveKit voice worker" primaryAction={{ label: 'Refresh', icon: <RefreshCw className="h-4 w-4" />, onClick: () => void load() }} />
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <Metric label="Calls made · 90 days" value={metrics.callsMade ?? 0} icon={<PhoneCall />} />
      <Metric label="Answered rate" value={`${metrics.answeredRate ?? 0}%`} icon={<Mic2 />} />
      <Metric label="Promises to pay" value={metrics.promisesToPay ?? 0} icon={<ShieldCheck />} />
      <Metric label="Disputes" value={metrics.disputes ?? 0} icon={<Megaphone />} />
      <Metric label="Recovered · 90 days" value={`₹${Number(metrics.amountRecoveredInr || 0).toLocaleString('en-IN')}`} icon={<ShieldCheck />} />
    </div>

    <nav aria-label="Voice agent sections" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
      {([['calls', 'Call log', PhoneCall], ['campaigns', 'Campaigns', Megaphone], ['settings', 'Agent settings', Settings2], ['privacy', 'Consent & DNC', ShieldCheck]] as const).map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white'}`}><Icon className="h-4 w-4" />{label}</button>)}
    </nav>

    {tab === 'calls' && <section className={`${panel} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6"><div><h2 className="font-semibold text-slate-900">Call history</h2><p className="mt-1 text-xs text-slate-500">Full call audio and transcript links are only shown to workspace members.</p></div><span className="text-xs text-slate-500">{calls.length} records</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Customer</th><th className="px-4 py-3">Purpose / invoice</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Outcome</th><th className="px-4 py-3">Duration</th><th className="px-5 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{calls.map((call) => <tr key={call.id} className="hover:bg-slate-50/70"><td className="px-5 py-3"><div className="font-medium text-slate-800">{call.customer?.name || 'Customer'}</div><div className="text-xs text-slate-500">{call.toNumber}</div></td><td className="px-4 py-3"><div>{call.purpose?.replaceAll('_', ' ')}</div><div className="text-xs text-slate-500">{call.invoice?.invoiceNumber || '—'}</div></td><td className="px-4 py-3"><Status value={call.status} /></td><td className="px-4 py-3 text-slate-600">{call.outcome?.replaceAll('_', ' ') || '—'}</td><td className="px-4 py-3 tabular-nums">{call.durationSeconds ? `${call.durationSeconds}s` : '—'}</td><td className="px-5 py-3 text-right"><button onClick={() => setSelectedCall(call)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"><Eye className="h-3.5 w-3.5" />View</button></td></tr>)}</tbody></table></div>
      {!calls.length && <div className="p-10 text-center text-sm text-slate-500">No call records yet. Configure the agent and create a consented campaign.</div>}
    </section>}

    {tab === 'campaigns' && <div className="space-y-4">
      <section className={`${panel} max-w-3xl p-4 sm:p-6`}>
        <h2 className="font-semibold text-slate-900">Test the voice agent</h2>
        <p className="mt-1 text-sm text-slate-500">Places one real call to the number you enter. The agent will identify itself as a test, speak, and ask you to reply. No invoice or payment actions are available in test mode. Carrier call charges may apply.</p>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); void run(async () => { const result = await ApiClient.post<any>('/voice-agent/test-call', { toNumber: testNumber, confirmAuthorizedTestNumber: true }); setNotice(`Test call queued (${result.id})`); }, 'Test call queued'); }}>
          <label className="block text-sm font-medium">Your test phone number<input className={field} type="tel" value={testNumber} onChange={(e) => setTestNumber(e.target.value)} placeholder="+919600000000" required /></label>
          <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1 accent-blue-600" checked={testAuthorized} onChange={(e) => setTestAuthorized(e.target.checked)} required /><span>I own this number or have permission to call it, and I understand this places a real call that may incur carrier charges.</span></label>
          <Button disabled={busy || !testAuthorized || !config.isEnabled}><PhoneCall className="mr-2 h-4 w-4" />Call me now (test)</Button>
          {!config.isEnabled && <p className="text-xs text-amber-800">Enable the voice agent in Agent settings before testing.</p>}
        </form>
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
      <section className={`${panel} p-4 sm:p-6`}><h2 className="font-semibold text-slate-900">Create reminder campaign</h2><p className="mt-1 text-sm text-slate-500">Enter invoice IDs. The preview explains any consent, DNC or schedule exclusions before queuing.</p>
        <label className="mt-4 block text-sm font-medium">Campaign name<input className={field} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} maxLength={100} /></label>
        <label className="mt-4 block text-sm font-medium">Invoice IDs <textarea className={`${field} min-h-28 font-mono text-xs`} placeholder="Paste invoice UUIDs separated by commas or lines" value={invoiceIds} onChange={(e) => setInvoiceIds(e.target.value)} /></label>
        <div className="mt-4 flex flex-wrap gap-2"><Button disabled={busy} variant="outline" onClick={() => void run(async () => { const ids = parseIds(invoiceIds); setPreview(await ApiClient.post('/voice-agent/campaigns/preview', { name: campaignName, invoiceIds: ids })); }, 'Preview updated')}>Preview eligibility</Button><Button disabled={busy || !preview?.eligibleCount} onClick={() => void run(async () => { await ApiClient.post('/voice-agent/campaigns', { name: campaignName, invoiceIds: parseIds(invoiceIds) }); setPreview(null); }, 'Campaign queued') }><Play className="mr-2 h-4 w-4" />Queue eligible calls</Button></div>
        {preview && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm"><p className="font-medium">{preview.eligibleCount} eligible · {preview.excludedCount} excluded</p><p className="mt-1 text-xs text-slate-500">Schedule: {new Date(preview.scheduledAt).toLocaleString()}</p><ul className="mt-2 space-y-1 text-xs">{preview.excluded?.map((x: any) => <li key={`${x.invoiceId}:${x.reason}`} className="text-amber-800">{x.invoiceReference || x.invoiceId.slice(0, 8)} — {x.reason}</li>)}</ul></div>}
      </section>
      <section className={`${panel} overflow-hidden`}><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Recent campaigns</h2></div><div className="divide-y divide-slate-100">{campaigns.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"><div><p className="font-medium text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item._count?.calls ?? 0} calls · {new Date(item.createdAt).toLocaleString()}</p></div><Status value={item.status} /></div>)}{!campaigns.length && <p className="p-8 text-center text-sm text-slate-500">No campaigns created.</p>}</div></section>
      </div>
    </div>}

    {tab === 'settings' && <section className={`${panel} max-w-3xl p-4 sm:p-6`}><div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Settings2 className="h-5 w-5" /></div><div><h2 className="font-semibold text-slate-900">Agent settings</h2><p className="mt-1 text-sm text-slate-500">Calls are restricted to 9:00 AM–7:00 PM by default, in your workspace timezone.</p></div></div>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const { timezone: _timezone, ...editableSettings } = config; void run(() => ApiClient.request('/voice-agent/config', { method: 'PATCH', body: JSON.stringify(editableSettings) }), 'Agent settings saved'); }}>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={Boolean(config.isEnabled)} onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })} />Enable outbound voice reminders</label>
        <label className="text-sm font-medium">Language<select className={field} value={config.language} onChange={(e) => setConfig({ ...config, language: e.target.value })}>{['en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'ml-IN', 'kn-IN'].map((lang) => <option key={lang}>{lang}</option>)}</select></label>
        <label className="text-sm font-medium">Voice profile<input className={field} value={config.voiceId} maxLength={80} onChange={(e) => setConfig({ ...config, voiceId: e.target.value })} /></label>
        <label className="text-sm font-medium">Calling starts<input type="time" className={field} value={config.callingWindowStart} onChange={(e) => setConfig({ ...config, callingWindowStart: e.target.value })} /></label>
        <label className="text-sm font-medium">Calling ends<input type="time" className={field} value={config.callingWindowEnd} onChange={(e) => setConfig({ ...config, callingWindowEnd: e.target.value })} /></label>
        <label className="text-sm font-medium">Maximum attempts<input type="number" className={field} min={1} max={5} value={config.maxAttempts} onChange={(e) => setConfig({ ...config, maxAttempts: Number(e.target.value) })} /></label>
        <label className="text-sm font-medium sm:col-span-2">Opening greeting<textarea className={`${field} min-h-24`} maxLength={500} value={config.greeting} onChange={(e) => setConfig({ ...config, greeting: e.target.value })} placeholder="Short, polite greeting. AI disclosure is added by the worker." /></label>
        <div className="sm:col-span-2"><Button disabled={busy}><Save className="mr-2 h-4 w-4" />Save settings</Button></div>
      </form>
      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Saving enabled settings requires a configured worker, HMAC secret, LiveKit project, outbound trunk, speech services, and model credentials. The app does not place calls until those are valid.</p>
    </section>}

    {tab === 'privacy' && <div className="grid gap-4 xl:grid-cols-2"><section className={`${panel} overflow-hidden`}><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Voice calling consent</h2><p className="mt-1 text-xs text-slate-500">Only active consent records are eligible for calls.</p></div><form className="grid gap-2 p-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void run(async () => { await ApiClient.post('/voice-agent/consents', { customerId: consentCustomerId, phone: consentPhone, source: consentSource, granted: true }); setConsentCustomerId(''); setConsentPhone(''); }, 'Voice calling consent recorded'); }}><input className={field + ' mt-0'} value={consentCustomerId} onChange={(e) => setConsentCustomerId(e.target.value)} placeholder="Customer ID (UUID)" required /><input className={field + ' mt-0'} value={consentPhone} onChange={(e) => setConsentPhone(e.target.value)} placeholder="Phone as +91…" required /><input className={`${field} mt-0 sm:col-span-2`} value={consentSource} onChange={(e) => setConsentSource(e.target.value)} placeholder="Consent source / evidence reference" required /><Button disabled={busy} className="sm:col-span-2">Record confirmed consent</Button></form><p className="px-4 pb-3 text-xs text-amber-800">Only record consent after the customer has opted in. Use the customer profile UUID and matching number on file.</p><div className="max-h-[22rem] overflow-auto divide-y divide-slate-100">{consents.map((item) => <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm" key={item.id}><span>{item.customer?.name || 'Customer'}<small className="block text-xs text-slate-500">{item.phone}</small></span><div className="flex items-center gap-2"><Status value={item.revokedAt ? 'REVOKED' : 'GRANTED'} />{!item.revokedAt && <button className="rounded-lg px-2 py-1 text-xs text-red-700 hover:bg-red-50" onClick={() => void run(() => ApiClient.post('/voice-agent/consents', { customerId: item.customerId, phone: item.phone, source: 'Revoked in voice agent settings', granted: false }), 'Voice calling consent revoked')}>Revoke</button>}</div></div>)}{!consents.length && <p className="p-8 text-center text-sm text-slate-500">No consent records.</p>}</div></section>
      <section className={`${panel} overflow-hidden`}><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Do-not-call list</h2><p className="mt-1 text-xs text-slate-500">Numbers added here are excluded before every call.</p></div><form className="flex gap-2 p-4" onSubmit={(e) => { e.preventDefault(); void run(async () => { await ApiClient.post('/voice-agent/do-not-call', { phone: dncPhone, reason: 'Added by workspace user' }); setDncPhone(''); }, 'Number added to do-not-call list'); }}><input className={field + ' mt-0 min-w-0'} value={dncPhone} onChange={(e) => setDncPhone(e.target.value)} placeholder="+919600000000" required /><Button disabled={busy}>Add</Button></form><div className="max-h-[22rem] overflow-auto divide-y divide-slate-100">{dnc.map((item) => <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm" key={item.id}><span>{item.phone}<small className="block text-xs text-slate-500">{item.reason || 'No reason provided'}</small></span><button aria-label="Remove from do-not-call list" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => void run(() => ApiClient.request(`/voice-agent/do-not-call/${item.id}`, { method: 'DELETE' }), 'Do-not-call entry removed')}><Trash2 className="h-4 w-4" /></button></div>)}{!dnc.length && <p className="p-8 text-center text-sm text-slate-500">No blocked numbers.</p>}</div></section></div>}

    {selectedCall && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Call details" onClick={() => setSelectedCall(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="font-semibold">Call details</h2><p className="text-xs text-slate-500">{selectedCall.customer?.name || 'Customer'} · {new Date(selectedCall.createdAt).toLocaleString()}</p></div><button className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setSelectedCall(null)}>Close</button></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><Status value={selectedCall.status} /><span className="rounded-full bg-slate-100 px-2.5 py-1">{selectedCall.outcome || 'No outcome'}</span>{selectedCall.skipReason && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">{selectedCall.skipReason}</span>}</div>{selectedCall.recordingUrl && <a className="mt-4 inline-block text-sm font-medium text-blue-700 underline" href={selectedCall.recordingUrl} target="_blank" rel="noreferrer">Open recording</a>}<pre className="mt-4 max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-700">{selectedCall.transcript || selectedCall.summary || 'No transcript was stored for this call.'}</pre></div></div>}
  </div>;
}

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) { return <div className={`${panel} min-w-0 p-4 sm:p-5`}><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500 sm:text-sm">{label}</span><span className="text-blue-600">{icon}</span></div><div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</div></div>; }
function Status({ value }: { value?: string }) { const state = value || 'UNKNOWN'; const color = ['COMPLETED', 'GRANTED', 'WILL_PAY', 'PAID_ALREADY'].includes(state) ? 'bg-emerald-50 text-emerald-700' : ['FAILED', 'SKIPPED', 'DISPUTED', 'REVOKED', 'CANCELED'].includes(state) ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'; return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${color}`}>{state.replaceAll('_', ' ')}</span>; }
function parseIds(value: string) { return Array.from(new Set(value.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean))); }
