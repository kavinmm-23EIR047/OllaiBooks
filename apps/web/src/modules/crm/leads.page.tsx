'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRightLeft, Flame, Mail, Phone, Plus, Target, Trash2 } from 'lucide-react';
import { crm, LEAD_SOURCES, LEAD_STATUSES, useCrm, type Lead, type LeadSource, type LeadStatus } from '@/lib/crm-store';
import { useNotify } from '@/components/ui/toast-provider';
import { CrmListView, type ListColumn } from '@/components/crm/crm-list-view';
import { RecordTimeline } from '@/components/crm/crm-timeline';
import { Avatar, Btn, EmptyState, Field, inputCls, inr, PageHeader, Pill, relativeTime, SidePanel, StatStrip, type PillTone } from '@/components/crm/crm-ui';
import { CrmLeadsIllustration } from '@/components/illustrations/crm-illustrations';

const STATUS_TONE: Record<LeadStatus, PillTone> = { new: 'blue', contacted: 'sky', qualified: 'indigo', unqualified: 'silver', converted: 'green' };
const RATING_TONE = { hot: 'red', warm: 'amber', cold: 'silver' } as const;

type Draft = { name: string; company: string; phone: string; email: string; city: string; source: LeadSource; status: LeadStatus; expectedValue: string; rating: 'hot' | 'warm' | 'cold'; notes: string };
const EMPTY: Draft = { name: '', company: '', phone: '', email: '', city: '', source: 'Walk-in', status: 'new', expectedValue: '', rating: 'warm', notes: '' };

function toDraft(l: Lead): Draft {
  return { name: l.name, company: l.company || '', phone: l.phone || '', email: l.email || '', city: l.city || '', source: l.source, status: l.status, expectedValue: l.expectedValue ? String(l.expectedValue) : '', rating: l.rating || 'warm', notes: l.notes || '' };
}

export function LeadsPage() {
  const { leads, activities, ready } = useCrm();
  const notify = useNotify();
  const router = useRouter();
  const params = useSearchParams();
  const [panel, setPanel] = React.useState<{ mode: 'create' } | { mode: 'view'; id: string } | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof Draft, string>>>({});

  React.useEffect(() => {
    if (params?.get('new')) { setDraft(EMPTY); setErrors({}); setPanel({ mode: 'create' }); }
    const open = params?.get('open');
    if (open) setPanel({ mode: 'view', id: open });
  }, [params]);

  const current = panel?.mode === 'view' ? leads.find((l) => l.id === panel.id) : undefined;
  React.useEffect(() => { if (current) setDraft(toDraft(current)); }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { setPanel(null); setErrors({}); if (params?.get('new') || params?.get('open')) router.replace('/leads'); };

  const validate = (d: Draft) => {
    const e: typeof errors = {};
    if (!d.name.trim()) e.name = 'Add the person’s name';
    if (d.phone && !/^[+\d][\d\s-]{6,15}$/.test(d.phone.trim())) e.phone = 'Check the phone number';
    if (d.email && !/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = 'Check the email address';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const payload = (d: Draft) => ({
    name: d.name.trim(), company: d.company.trim() || undefined, phone: d.phone.trim() || undefined, email: d.email.trim() || undefined,
    city: d.city.trim() || undefined, source: d.source, status: d.status, rating: d.rating, notes: d.notes.trim() || undefined,
    expectedValue: d.expectedValue ? Number(d.expectedValue) : undefined,
  });

  const save = () => {
    if (!validate(draft)) return;
    if (panel?.mode === 'create') {
      const lead = crm.createLead(payload(draft));
      notify('success', 'Lead added', `${lead.name} is in your pipeline${navigator.onLine ? '' : ' — saved offline, will sync later'}.`);
      setPanel({ mode: 'view', id: lead.id });
    } else if (current) {
      crm.update<Lead>(current.id, payload(draft));
      notify('success', 'Changes saved', navigator.onLine ? 'Syncing to your team now.' : 'Saved on this device; syncs when you’re back online.');
    }
  };

  const convert = (lead: Lead) => {
    const deal = crm.convertLead(lead.id);
    if (!deal) return;
    notify('success', `${lead.name} converted to a deal`, 'We also added a follow-up task to send the quotation tomorrow.', {
      action: { label: 'Open deal', onClick: () => router.push(`/deals?open=${deal.id}`) },
    });
  };

  const hot = leads.filter((l) => l.rating === 'hot' && l.status !== 'converted').length;
  const week = leads.filter((l) => Date.now() - new Date(l.createdAt).getTime() < 7 * 864e5).length;
  const converted = leads.filter((l) => l.status === 'converted').length;

  const columns: ListColumn<Lead>[] = [
    {
      key: 'name', label: 'Lead', sortValue: (l) => l.name.toLowerCase(),
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={l.name} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900 group-hover:text-blue-700">{l.name}</div>
            <div className="truncate text-[12px] text-silver-600">{l.company || l.city || '—'}</div>
          </div>
        </div>
      ),
    },
    { key: 'contact', label: 'Contact', hideOnMobile: true, render: (l) => <div className="text-[12px] leading-5"><div>{l.phone || '—'}</div><div className="text-silver-500">{l.email || ''}</div></div> },
    { key: 'source', label: 'Source', sortValue: (l) => l.source, render: (l) => <span className="text-silver-700">{l.source}</span> },
    { key: 'status', label: 'Status', sortValue: (l) => l.status, render: (l) => <Pill tone={STATUS_TONE[l.status]}>{LEAD_STATUSES.find((s) => s.id === l.status)?.label}</Pill> },
    { key: 'rating', label: 'Rating', hideOnMobile: true, render: (l) => (l.rating ? <Pill tone={RATING_TONE[l.rating]}>{l.rating === 'hot' && <Flame className="h-3 w-3" />}{l.rating}</Pill> : '—') },
    { key: 'value', label: 'Potential', sortValue: (l) => l.expectedValue || 0, className: 'text-right', render: (l) => (l.expectedValue ? <b>{inr(l.expectedValue)}</b> : <span className="text-silver-400">—</span>) },
    { key: 'updated', label: 'Updated', hideOnMobile: true, sortValue: (l) => l.updatedAt, render: (l) => <span className="text-[12px] text-silver-600">{relativeTime(l.updatedAt)}</span> },
  ];

  const form = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Name *" error={errors.name}><input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Priya Raman" autoFocus aria-invalid={Boolean(errors.name)} /></Field>
      <Field label="Company"><input className={inputCls} value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Business name (optional)" /></Field>
      <Field label="Mobile" error={errors.phone}><input className={inputCls} inputMode="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="98400 12345" /></Field>
      <Field label="Email" error={errors.email}><input className={inputCls} type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@example.com" /></Field>
      <Field label="City"><input className={inputCls} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="Chennai" /></Field>
      <Field label="Potential value (₹)"><input className={inputCls} type="number" min={0} value={draft.expectedValue} onChange={(e) => setDraft({ ...draft, expectedValue: e.target.value })} placeholder="25000" /></Field>
      <Field label="Source"><select className={inputCls} value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as LeadSource })}>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Status"><select className={inputCls} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as LeadStatus })}>{LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
      <Field label="How warm is this lead?" className="sm:col-span-2">
        <div className="flex gap-2">
          {(['hot', 'warm', 'cold'] as const).map((r) => (
            <button key={r} type="button" onClick={() => setDraft({ ...draft, rating: r })} className={`flex-1 rounded-md border px-3 py-2 text-[13px] font-semibold capitalize ${draft.rating === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-silver-300 bg-white text-silver-700 hover:bg-silver-50'}`}>{r}</button>
          ))}
        </div>
      </Field>
      <Field label="Notes" className="sm:col-span-2"><textarea className={`${inputCls} h-20 py-2`} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="What are they looking for?" /></Field>
    </div>
  );

  return (
    <div>
      <PageHeader
        icon={Target}
        title="Leads"
        subtitle="Every enquiry from your counter, website, WhatsApp and calls — in one place, even offline."
        actions={<Btn variant="primary" onClick={() => { setDraft(EMPTY); setErrors({}); setPanel({ mode: 'create' }); }}><Plus className="h-4 w-4" /> New lead</Btn>}
      />
      <StatStrip items={[
        { label: 'Open leads', value: leads.filter((l) => l.status !== 'converted' && l.status !== 'unqualified').length, hint: 'Waiting for your follow-up' },
        { label: 'Hot right now', value: hot, hint: 'Call these first', tone: 'amber' },
        { label: 'New this week', value: week, tone: 'silver' },
        { label: 'Converted', value: converted, hint: leads.length ? `${Math.round((converted / leads.length) * 100)}% conversion` : undefined, tone: 'green' },
      ]} />

      <CrmListView
        rows={leads}
        columns={columns}
        initialSort={{ key: 'updated', dir: 'desc' }}
        searchText={(l) => [l.name, l.company, l.phone, l.email, l.city].join(' ')}
        onRowClick={(l) => setPanel({ mode: 'view', id: l.id })}
        filters={[
          { key: 'status', label: 'Status', options: LEAD_STATUSES.map((s) => ({ value: s.id, label: s.label })), match: (l, v) => l.status === v },
          { key: 'source', label: 'Source', options: LEAD_SOURCES.map((s) => ({ value: s, label: s })), match: (l, v) => l.source === v },
          { key: 'rating', label: 'Rating', options: [{ value: 'hot', label: 'Hot' }, { value: 'warm', label: 'Warm' }, { value: 'cold', label: 'Cold' }], match: (l, v) => l.rating === v },
        ]}
        bulkActions={(sel, clear) => (
          <>
            <select className="h-8 rounded-md border border-blue-200 bg-white px-2 text-[12px]" defaultValue="" onChange={(e) => { const v = e.target.value as LeadStatus; if (!v) return; sel.forEach((l) => crm.update<Lead>(l.id, { status: v })); notify('success', `${sel.length} lead${sel.length === 1 ? '' : 's'} updated`); clear(); e.target.value = ''; }}>
              <option value="">Change status…</option>
              {LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <Btn variant="danger" className="h-8" onClick={() => { if (!window.confirm(`Delete ${sel.length} lead(s)?`)) return; sel.forEach((l) => crm.remove(l.id)); notify('info', `${sel.length} lead${sel.length === 1 ? '' : 's'} deleted`); clear(); }}><Trash2 className="h-3.5 w-3.5" /> Delete</Btn>
          </>
        )}
        emptyState={(
          <EmptyState
            art={<CrmLeadsIllustration className="w-44" />}
            title={ready && !leads.length ? 'Your first lead is one tap away' : 'No leads match'}
            body={ready && !leads.length ? 'Add walk-in enquiries, WhatsApp messages or calls here. They’re saved on this device and sync to your team automatically.' : 'Try clearing a filter or searching a different name.'}
            action={!leads.length ? <Btn variant="primary" onClick={() => { setDraft(EMPTY); setPanel({ mode: 'create' }); }}><Plus className="h-4 w-4" /> Add a lead</Btn> : undefined}
          />
        )}
      />

      <SidePanel
        open={Boolean(panel) && (panel?.mode === 'create' || Boolean(current))}
        onClose={close}
        width={640}
        title={panel?.mode === 'create' ? 'New lead' : current?.name}
        subtitle={current ? <span className="flex flex-wrap items-center gap-2"><Pill tone={STATUS_TONE[current.status]}>{LEAD_STATUSES.find((s) => s.id === current.status)?.label}</Pill>{current.source} · added {relativeTime(current.createdAt)}</span> : 'Saved on this device instantly — syncs when online'}
        footer={(
          <>
            {current && <Btn variant="danger" className="mr-auto" onClick={() => { if (window.confirm(`Delete ${current.name}?`)) { crm.remove(current.id); notify('info', 'Lead deleted'); close(); } }}><Trash2 className="h-4 w-4" /></Btn>}
            {current && current.status !== 'converted' && <Btn onClick={() => convert(current)}><ArrowRightLeft className="h-4 w-4" /> Convert to deal</Btn>}
            {current?.convertedDealId && <Btn onClick={() => router.push(`/deals?open=${current.convertedDealId}`)}>View deal</Btn>}
            <Btn variant="primary" onClick={save}>{panel?.mode === 'create' ? 'Save lead' : 'Save changes'}</Btn>
          </>
        )}
      >
        {current && (
          <div className="mb-4 flex flex-wrap gap-2">
            {current.phone && <a href={`tel:${current.phone}`} className="inline-flex items-center gap-1.5 rounded-md border border-silver-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-blue-50"><Phone className="h-3.5 w-3.5 text-blue-600" /> Call</a>}
            {current.phone && <a href={`https://wa.me/${current.phone.replace(/\D/g, '').replace(/^(?!91)(\d{10})$/, '91$1')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-silver-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-emerald-50">WhatsApp</a>}
            {current.email && <a href={`mailto:${current.email}`} className="inline-flex items-center gap-1.5 rounded-md border border-silver-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-blue-50"><Mail className="h-3.5 w-3.5 text-blue-600" /> Email</a>}
          </div>
        )}
        <div className="rounded-xl border border-silver-200 bg-white p-4 shadow-sm">{form}</div>
        {current && (
          <div className="mt-5">
            <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-silver-600">Timeline</h3>
            <RecordTimeline
              relatedId={current.id}
              relatedKind="lead"
              relatedName={current.name}
              activities={activities}
              history={[{ at: current.createdAt, label: `Lead created from ${current.source}` }, ...(current.status === 'converted' ? [{ at: current.updatedAt, label: 'Converted to a deal' }] : [])]}
            />
          </div>
        )}
      </SidePanel>
    </div>
  );
}
