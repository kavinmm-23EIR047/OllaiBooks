'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarCheck, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTIVITY_TYPES, crm, useCrm, type Activity, type ActivityType } from '@/lib/crm-store';
import { useNotify } from '@/components/ui/toast-provider';
import { ACTIVITY_ICONS } from '@/components/crm/crm-timeline';
import { Btn, EmptyState, Field, inputCls, PageHeader, Pill, relativeTime, SidePanel, StatStrip } from '@/components/crm/crm-ui';
import { CrmTasksIllustration } from '@/components/illustrations/crm-illustrations';

type Bucket = 'overdue' | 'today' | 'upcoming' | 'nodate' | 'done';
const BUCKETS: Array<{ id: Bucket; label: string; tone: string }> = [
  { id: 'overdue', label: 'Overdue', tone: 'text-rose-600' },
  { id: 'today', label: 'Today', tone: 'text-blue-700' },
  { id: 'upcoming', label: 'Upcoming', tone: 'text-slate-800' },
  { id: 'nodate', label: 'Anytime', tone: 'text-silver-700' },
  { id: 'done', label: 'Completed', tone: 'text-emerald-700' },
];

function bucketOf(a: Activity): Bucket {
  if (a.done) return 'done';
  if (!a.dueAt) return 'nodate';
  const due = new Date(a.dueAt).getTime();
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  if (due < Date.now()) return 'overdue';
  if (due <= endOfToday.getTime()) return 'today';
  return 'upcoming';
}

export function ActivitiesPage() {
  const { activities, leads, deals, ready } = useCrm();
  const notify = useNotify();
  const router = useRouter();
  const params = useSearchParams();
  const [typeFilter, setTypeFilter] = React.useState<ActivityType | 'all'>('all');
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ type: 'call' as ActivityType, subject: '', dueAt: '', priority: 'normal' as 'high' | 'normal' | 'low', related: '', notes: '' });

  React.useEffect(() => { if (params?.get('new')) setOpen(true); }, [params]);
  const close = () => { setOpen(false); if (params?.get('new')) router.replace('/activities'); };

  const list = activities.filter((a) => a.type !== 'note' && (typeFilter === 'all' || a.type === typeFilter));
  const grouped = BUCKETS.map((b) => ({ ...b, items: list.filter((a) => bucketOf(a) === b.id) }));
  const counts = Object.fromEntries(grouped.map((g) => [g.id, g.items.length])) as Record<Bucket, number>;

  const save = () => {
    if (!draft.subject.trim()) { notify('warning', 'Add a subject', 'For example: “Call Priya about the Diwali order”.'); return; }
    const [kind, id] = draft.related.split(':');
    const relatedName = kind === 'lead' ? leads.find((l) => l.id === id)?.name : kind === 'deal' ? deals.find((d) => d.id === id)?.title : undefined;
    crm.createActivity({
      type: draft.type, subject: draft.subject.trim(), dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : undefined, done: false,
      priority: draft.priority, notes: draft.notes.trim() || undefined,
      ...(id ? { relatedId: id, relatedKind: kind as 'lead' | 'deal', relatedName } : {}),
    });
    notify('success', 'Follow-up scheduled', draft.dueAt ? `We’ll show it under ${relativeTime(new Date(draft.dueAt).toISOString())}.` : 'Added to your list.');
    setDraft({ type: 'call', subject: '', dueAt: '', priority: 'normal', related: '', notes: '' });
    close();
  };

  const toggle = (a: Activity) => {
    crm.update<Activity>(a.id, { done: !a.done, doneAt: !a.done ? new Date().toISOString() : undefined });
    if (!a.done) notify('success', 'Nice work!', `“${a.subject}” marked as done.`, { duration: 2500 });
  };

  return (
    <div>
      <PageHeader
        icon={CalendarCheck}
        title="Activities"
        subtitle="Calls, meetings and follow-ups for your leads and deals. Never miss a promise to a customer."
        actions={<Btn variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New follow-up</Btn>}
      />
      <StatStrip items={[
        { label: 'Overdue', value: counts.overdue, hint: counts.overdue ? 'Clear these first' : 'You’re on top of it', tone: counts.overdue ? 'amber' : 'green' },
        { label: 'Due today', value: counts.today },
        { label: 'Upcoming', value: counts.upcoming, tone: 'silver' },
        { label: 'Done', value: counts.done, tone: 'green' },
      ]} />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {[{ id: 'all', label: 'All' }, ...ACTIVITY_TYPES.filter((t) => t.id !== 'note')].map((t) => (
          <button key={t.id} type="button" onClick={() => setTypeFilter(t.id as ActivityType | 'all')} className={cn('rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ring-inset', typeFilter === t.id ? 'bg-blue-600 text-white ring-blue-600' : 'bg-white text-silver-700 ring-silver-300 hover:bg-silver-50')}>{t.label}</button>
        ))}
      </div>

      {ready && !list.length ? (
        <div className="rounded-xl border border-silver-200 bg-white shadow-sm">
          <EmptyState art={<CrmTasksIllustration className="w-44" />} title="No follow-ups yet" body="Schedule a call or meeting, or log one from any lead or deal. Overdue items will turn red here." action={<Btn variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Schedule a follow-up</Btn>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {grouped.filter((g) => g.items.length).map((g) => (
            <section key={g.id} className="overflow-hidden rounded-xl border border-silver-200 bg-white shadow-sm">
              <header className="flex items-center justify-between border-b border-silver-200 bg-silver-50 px-4 py-2.5">
                <h2 className={cn('text-[13px] font-extrabold uppercase tracking-wider', g.tone)}>{g.label}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-silver-700 ring-1 ring-silver-200">{g.items.length}</span>
              </header>
              <ul>
                {g.items.slice(0, 50).map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type];
                  return (
                    <li key={a.id} className="group flex items-start gap-3 border-b border-silver-100 px-4 py-3 last:border-0 hover:bg-blue-50/30">
                      <button type="button" onClick={() => toggle(a)} className="mt-0.5 flex-shrink-0 text-silver-400 hover:text-emerald-600" aria-label={a.done ? 'Mark as open' : 'Mark as done'}>
                        {a.done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
                      </button>
                      <span className={cn('grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg', a.done ? 'bg-silver-100 text-silver-500' : 'bg-blue-50 text-blue-700')}><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className={cn('text-[13px] font-semibold text-slate-900', a.done && 'text-silver-500 line-through')}>{a.subject}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-silver-600">
                          {a.dueAt && <span className={g.id === 'overdue' ? 'font-semibold text-rose-600' : ''}>{new Date(a.dueAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {relativeTime(a.dueAt)}</span>}
                          {a.relatedName && <Link href={`/${a.relatedKind === 'deal' ? 'deals' : 'leads'}?open=${a.relatedId}`} className="font-semibold text-blue-700 hover:underline">{a.relatedKind === 'deal' ? 'Deal' : 'Lead'}: {a.relatedName}</Link>}
                          {a.priority === 'high' && <Pill tone="red">High priority</Pill>}
                        </div>
                      </div>
                      <button type="button" onClick={() => { crm.remove(a.id); notify('info', 'Follow-up removed'); }} className="flex-shrink-0 text-silver-300 opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100 focus:opacity-100" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <SidePanel open={open} onClose={close} title="New follow-up" subtitle="Saved on this device instantly — syncs when online" footer={<><Btn onClick={close}>Cancel</Btn><Btn variant="primary" onClick={save}>Schedule</Btn></>}>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-silver-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <Field label="Type" className="sm:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_TYPES.filter((t) => t.id !== 'note').map((t) => { const Icon = ACTIVITY_ICONS[t.id]; return (
                <button key={t.id} type="button" onClick={() => setDraft({ ...draft, type: t.id })} className={cn('inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-semibold', draft.type === t.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-silver-300 text-silver-700 hover:bg-silver-50')}><Icon className="h-3.5 w-3.5" />{t.label}</button>
              ); })}
            </div>
          </Field>
          <Field label="Subject *" className="sm:col-span-2"><input className={inputCls} value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Call Priya about the Diwali order" autoFocus /></Field>
          <Field label="When"><input className={inputCls} type="datetime-local" value={draft.dueAt} onChange={(e) => setDraft({ ...draft, dueAt: e.target.value })} /></Field>
          <Field label="Priority"><select className={inputCls} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as 'high' | 'normal' | 'low' })}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></Field>
          <Field label="Related to" className="sm:col-span-2">
            <select className={inputCls} value={draft.related} onChange={(e) => setDraft({ ...draft, related: e.target.value })}>
              <option value="">Nothing specific</option>
              {leads.length > 0 && <optgroup label="Leads">{leads.slice(0, 200).map((l) => <option key={l.id} value={`lead:${l.id}`}>{l.name}{l.company ? ` · ${l.company}` : ''}</option>)}</optgroup>}
              {deals.length > 0 && <optgroup label="Deals">{deals.slice(0, 200).map((d) => <option key={d.id} value={`deal:${d.id}`}>{d.title}</option>)}</optgroup>}
            </select>
          </Field>
          <Field label="Notes" className="sm:col-span-2"><textarea className={`${inputCls} h-20 py-2`} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>
        </div>
      </SidePanel>
    </div>
  );
}
