'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Columns3, FileText, List, Plus, Trash2, Trophy } from 'lucide-react';
import { crm, DEAL_STAGES, useCrm, type Deal, type DealStage } from '@/lib/crm-store';
import { useNotify } from '@/components/ui/toast-provider';
import { CrmListView, type ListColumn } from '@/components/crm/crm-list-view';
import { DealKanban } from '@/components/crm/crm-kanban';
import { RecordTimeline } from '@/components/crm/crm-timeline';
import { Avatar, Btn, EmptyState, Field, inputCls, inr, PageHeader, Pill, relativeTime, SidePanel, StatStrip, type PillTone } from '@/components/crm/crm-ui';
import { CrmPipelineIllustration } from '@/components/illustrations/crm-illustrations';

const STAGE_TONE: Record<DealStage, PillTone> = { qualification: 'silver', needs: 'sky', proposal: 'blue', negotiation: 'indigo', won: 'green', lost: 'red' };

type Draft = { title: string; contactName: string; company: string; phone: string; email: string; amount: string; stage: DealStage; probability: string; closeDate: string; notes: string; lostReason: string };
const EMPTY: Draft = { title: '', contactName: '', company: '', phone: '', email: '', amount: '', stage: 'qualification', probability: '10', closeDate: '', notes: '', lostReason: '' };
const toDraft = (d: Deal): Draft => ({ title: d.title, contactName: d.contactName, company: d.company || '', phone: d.phone || '', email: d.email || '', amount: String(d.amount || ''), stage: d.stage, probability: String(d.probability), closeDate: d.closeDate?.slice(0, 10) || '', notes: d.notes || '', lostReason: d.lostReason || '' });

export function DealsPage() {
  const { deals, activities, ready } = useCrm();
  const notify = useNotify();
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = React.useState<'kanban' | 'list'>('kanban');
  const [panel, setPanel] = React.useState<{ mode: 'create' } | { mode: 'view'; id: string } | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    try { const v = localStorage.getItem('ollaibooks_deals_view'); if (v === 'list' || v === 'kanban') setView(v); } catch { /* ignore */ }
  }, []);
  React.useEffect(() => { try { localStorage.setItem('ollaibooks_deals_view', view); } catch { /* ignore */ } }, [view]);
  React.useEffect(() => {
    if (params?.get('new')) { setDraft(EMPTY); setPanel({ mode: 'create' }); }
    const open = params?.get('open');
    if (open) setPanel({ mode: 'view', id: open });
  }, [params]);

  const current = panel?.mode === 'view' ? deals.find((d) => d.id === panel.id) : undefined;
  React.useEffect(() => { if (current) setDraft(toDraft(current)); }, [current?.id, current?.stage]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => { setPanel(null); setError(''); if (params?.get('new') || params?.get('open')) router.replace('/deals'); };

  const moveStage = (deal: Deal, stage: DealStage) => {
    const probability = DEAL_STAGES.find((s) => s.id === stage)?.probability ?? deal.probability;
    crm.update<Deal>(deal.id, { stage, probability });
    if (stage === 'won') notify('success', `🎉 Deal won — ${inr(deal.amount)}`, `${deal.title} is closed. Create the GST invoice while it’s fresh.`, { action: { label: 'Create invoice', onClick: () => router.push('/invoices') } });
    else if (stage === 'lost') notify('warning', 'Marked as lost', 'Add a reason in the deal so you learn from it.');
    else notify('info', `Moved to ${DEAL_STAGES.find((s) => s.id === stage)?.label}`, navigator.onLine ? undefined : 'Saved offline — syncs later.');
  };

  const save = () => {
    if (!draft.title.trim() || !draft.contactName.trim()) { setError('Add a deal name and a contact person.'); return; }
    const amount = Number(draft.amount || 0);
    if (!Number.isFinite(amount) || amount < 0) { setError('Amount must be a positive number.'); return; }
    setError('');
    const data = {
      title: draft.title.trim(), contactName: draft.contactName.trim(), company: draft.company.trim() || undefined, phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined, amount, stage: draft.stage, probability: Math.max(0, Math.min(100, Number(draft.probability) || 0)),
      closeDate: draft.closeDate ? new Date(draft.closeDate).toISOString() : undefined, notes: draft.notes.trim() || undefined,
      lostReason: draft.stage === 'lost' ? draft.lostReason.trim() || undefined : undefined,
    };
    if (panel?.mode === 'create') {
      const deal = crm.createDeal(data);
      notify('success', 'Deal created', `${deal.title} added to ${DEAL_STAGES.find((s) => s.id === deal.stage)?.label}.`);
      setPanel({ mode: 'view', id: deal.id });
    } else if (current) {
      crm.update<Deal>(current.id, data);
      notify('success', 'Deal updated', navigator.onLine ? undefined : 'Saved offline — syncs later.');
    }
  };

  const open = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const pipeline = open.reduce((s, d) => s + d.amount, 0);
  const weighted = open.reduce((s, d) => s + d.amount * (d.probability / 100), 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const wonMonth = deals.filter((d) => d.stage === 'won' && new Date(d.updatedAt) >= monthStart);
  const closed = deals.filter((d) => d.stage === 'won' || d.stage === 'lost');
  const winRate = closed.length ? Math.round((deals.filter((d) => d.stage === 'won').length / closed.length) * 100) : 0;

  const columns: ListColumn<Deal>[] = [
    { key: 'title', label: 'Deal', sortValue: (d) => d.title.toLowerCase(), render: (d) => <div className="flex items-center gap-2.5"><Avatar name={d.contactName} /><div className="min-w-0"><div className="truncate font-semibold group-hover:text-blue-700">{d.title}</div><div className="truncate text-[12px] text-silver-600">{d.contactName}{d.company ? ` · ${d.company}` : ''}</div></div></div> },
    { key: 'stage', label: 'Stage', sortValue: (d) => DEAL_STAGES.findIndex((s) => s.id === d.stage), render: (d) => <Pill tone={STAGE_TONE[d.stage]}>{DEAL_STAGES.find((s) => s.id === d.stage)?.label}</Pill> },
    { key: 'amount', label: 'Amount', className: 'text-right', sortValue: (d) => d.amount, render: (d) => <b>{inr(d.amount)}</b> },
    { key: 'prob', label: 'Probability', hideOnMobile: true, sortValue: (d) => d.probability, render: (d) => <div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-silver-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${d.probability}%` }} /></div><span className="text-[12px] text-silver-600">{d.probability}%</span></div> },
    { key: 'close', label: 'Closing', hideOnMobile: true, sortValue: (d) => d.closeDate || '9', render: (d) => <span className="text-[12px] text-silver-700">{d.closeDate ? new Date(d.closeDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span> },
    { key: 'updated', label: 'Updated', hideOnMobile: true, sortValue: (d) => d.updatedAt, render: (d) => <span className="text-[12px] text-silver-600">{relativeTime(d.updatedAt)}</span> },
  ];

  const viewToggle = (
    <div className="inline-flex rounded-md border border-silver-300 bg-white p-0.5" role="tablist" aria-label="View">
      <button type="button" role="tab" aria-selected={view === 'kanban'} onClick={() => setView('kanban')} className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-semibold ${view === 'kanban' ? 'bg-blue-600 text-white' : 'text-silver-700 hover:bg-silver-100'}`}><Columns3 className="h-3.5 w-3.5" /> Pipeline</button>
      <button type="button" role="tab" aria-selected={view === 'list'} onClick={() => setView('list')} className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[12px] font-semibold ${view === 'list' ? 'bg-blue-600 text-white' : 'text-silver-700 hover:bg-silver-100'}`}><List className="h-3.5 w-3.5" /> List</button>
    </div>
  );

  const empty = (
    <EmptyState
      art={<CrmPipelineIllustration className="w-52" />}
      title="Build your sales pipeline"
      body="Track every quotation from first chat to payment. Drag deals between stages as they move — it works offline too."
      action={<Btn variant="primary" onClick={() => { setDraft(EMPTY); setPanel({ mode: 'create' }); }}><Plus className="h-4 w-4" /> Create first deal</Btn>}
    />
  );

  return (
    <div>
      <PageHeader
        icon={Briefcase}
        title="Deals"
        subtitle="Your sales pipeline at a glance. Drag a card to move it to the next stage."
        actions={<>{viewToggle}<Btn variant="primary" onClick={() => { setDraft(EMPTY); setError(''); setPanel({ mode: 'create' }); }}><Plus className="h-4 w-4" /> New deal</Btn></>}
      />
      <StatStrip items={[
        { label: 'Open pipeline', value: inr(pipeline), hint: `${open.length} active deal${open.length === 1 ? '' : 's'}` },
        { label: 'Likely to close', value: inr(weighted), hint: 'Weighted by stage probability', tone: 'silver' },
        { label: 'Won this month', value: inr(wonMonth.reduce((s, d) => s + d.amount, 0)), hint: `${wonMonth.length} deal${wonMonth.length === 1 ? '' : 's'}`, tone: 'green' },
        { label: 'Win rate', value: `${winRate}%`, hint: `${closed.length} closed`, tone: 'amber' },
      ]} />

      {ready && !deals.length ? (
        <div className="rounded-xl border border-silver-200 bg-white shadow-sm">{empty}</div>
      ) : view === 'kanban' ? (
        <DealKanban deals={deals} onMove={moveStage} onOpen={(d) => setPanel({ mode: 'view', id: d.id })} />
      ) : (
        <CrmListView
          rows={deals}
          columns={columns}
          initialSort={{ key: 'updated', dir: 'desc' }}
          searchText={(d) => [d.title, d.contactName, d.company, d.phone].join(' ')}
          onRowClick={(d) => setPanel({ mode: 'view', id: d.id })}
          filters={[{ key: 'stage', label: 'Stage', options: DEAL_STAGES.map((s) => ({ value: s.id, label: s.label })), match: (d, v) => d.stage === v }]}
          bulkActions={(sel, clear) => <Btn variant="danger" className="h-8" onClick={() => { if (!window.confirm(`Delete ${sel.length} deal(s)?`)) return; sel.forEach((d) => crm.remove(d.id)); clear(); notify('info', 'Deals deleted'); }}><Trash2 className="h-3.5 w-3.5" /> Delete</Btn>}
        />
      )}

      <SidePanel
        open={Boolean(panel) && (panel?.mode === 'create' || Boolean(current))}
        onClose={close}
        width={640}
        title={panel?.mode === 'create' ? 'New deal' : current?.title}
        subtitle={current ? <span className="flex flex-wrap items-center gap-2"><Pill tone={STAGE_TONE[current.stage]}>{DEAL_STAGES.find((s) => s.id === current.stage)?.label}</Pill><b className="text-slate-800">{inr(current.amount)}</b> · updated {relativeTime(current.updatedAt)}</span> : 'Saved on this device instantly — syncs when online'}
        footer={(
          <>
            {current && <Btn variant="danger" className="mr-auto" onClick={() => { if (window.confirm(`Delete ${current.title}?`)) { crm.remove(current.id); notify('info', 'Deal deleted'); close(); } }}><Trash2 className="h-4 w-4" /></Btn>}
            {current && current.stage !== 'won' && <Btn onClick={() => moveStage(current, 'won')}><Trophy className="h-4 w-4 text-emerald-600" /> Mark won</Btn>}
            {current?.stage === 'won' && <Btn onClick={() => router.push('/invoices')}><FileText className="h-4 w-4" /> Create invoice</Btn>}
            <Btn variant="primary" onClick={save}>{panel?.mode === 'create' ? 'Create deal' : 'Save changes'}</Btn>
          </>
        )}
      >
        {current && (
          <div className="mb-4 overflow-x-auto">
            <div className="flex min-w-[520px]">
              {DEAL_STAGES.filter((s) => s.id !== 'lost').map((s, i) => {
                const idx = DEAL_STAGES.findIndex((x) => x.id === current.stage);
                const done = current.stage !== 'lost' && i <= idx;
                return (
                  <button key={s.id} type="button" onClick={() => moveStage(current, s.id)} className={`relative flex-1 py-2 text-[11px] font-bold transition-colors [clip-path:polygon(0_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,0_100%,10px_50%)] first:[clip-path:polygon(0_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,0_100%)] ${done ? 'bg-blue-600 text-white' : 'bg-silver-200 text-silver-700 hover:bg-silver-300'}`}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {error && <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">{error}</div>}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-silver-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <Field label="Deal name *" className="sm:col-span-2"><input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. 200 boxes of sweets for Diwali" autoFocus /></Field>
          <Field label="Contact person *"><input className={inputCls} value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} /></Field>
          <Field label="Company"><input className={inputCls} value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></Field>
          <Field label="Mobile"><input className={inputCls} inputMode="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
          <Field label="Email"><input className={inputCls} type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
          <Field label="Amount (₹)"><input className={inputCls} type="number" min={0} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} /></Field>
          <Field label="Expected closing"><input className={inputCls} type="date" value={draft.closeDate} onChange={(e) => setDraft({ ...draft, closeDate: e.target.value })} /></Field>
          <Field label="Stage"><select className={inputCls} value={draft.stage} onChange={(e) => { const stage = e.target.value as DealStage; setDraft({ ...draft, stage, probability: String(DEAL_STAGES.find((s) => s.id === stage)?.probability ?? draft.probability) }); }}>{DEAL_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
          <Field label="Probability (%)"><input className={inputCls} type="number" min={0} max={100} value={draft.probability} onChange={(e) => setDraft({ ...draft, probability: e.target.value })} /></Field>
          {draft.stage === 'lost' && <Field label="Why was it lost?" className="sm:col-span-2"><input className={inputCls} value={draft.lostReason} onChange={(e) => setDraft({ ...draft, lostReason: e.target.value })} placeholder="Price, timing, competitor…" /></Field>}
          <Field label="Notes" className="sm:col-span-2"><textarea className={`${inputCls} h-20 py-2`} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>
        </div>
        {current && (
          <div className="mt-5">
            <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-silver-600">Timeline</h3>
            <RecordTimeline relatedId={current.id} relatedKind="deal" relatedName={current.title} activities={activities} history={[{ at: current.createdAt, label: current.leadId ? 'Deal created from a converted lead' : 'Deal created' }]} />
          </div>
        )}
      </SidePanel>
    </div>
  );
}
