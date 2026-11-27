'use client';

import * as React from 'react';
import { CalendarCheck, CheckCircle2, Circle, Mail, MessageCircle, Phone, StickyNote, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTIVITY_TYPES, crm, type Activity, type ActivityType } from '@/lib/crm-store';
import { Btn, inputCls, relativeTime } from './crm-ui';

export const ACTIVITY_ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  call: Phone, meeting: Users, task: CalendarCheck, whatsapp: MessageCircle, email: Mail, note: StickyNote,
};

/** Activities + history for one lead/deal, with a quick "log activity" composer. */
export function RecordTimeline({
  relatedId, relatedKind, relatedName, activities, history,
}: {
  relatedId: string;
  relatedKind: 'lead' | 'deal';
  relatedName: string;
  activities: Activity[];
  history: Array<{ at: string; label: string }>;
}) {
  const [type, setType] = React.useState<ActivityType>('call');
  const [subject, setSubject] = React.useState('');
  const [due, setDue] = React.useState('');

  const items = [
    ...activities.filter((a) => a.relatedId === relatedId).map((a) => ({ at: a.dueAt || a.createdAt, activity: a as Activity | undefined, label: a.subject })),
    ...history.map((h) => ({ at: h.at, activity: undefined as Activity | undefined, label: h.label })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    crm.createActivity({
      type,
      subject: subject.trim(),
      dueAt: due ? new Date(due).toISOString() : undefined,
      done: type === 'note',
      relatedId,
      relatedKind,
      relatedName,
    });
    setSubject('');
    setDue('');
  };

  return (
    <div>
      <form onSubmit={add} className="mb-4 rounded-xl border border-silver-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-wrap gap-1">
          {ACTIVITY_TYPES.map((t) => {
            const Icon = ACTIVITY_ICONS[t.id];
            return (
              <button key={t.id} type="button" onClick={() => setType(t.id)} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold', type === t.id ? 'bg-blue-600 text-white' : 'bg-silver-100 text-silver-700 hover:bg-silver-200')}>
                <Icon className="h-3 w-3" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={type === 'note' ? 'Write a note…' : `What’s the ${type} about?`} className={inputCls} />
          {type !== 'note' && <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className={cn(inputCls, 'sm:w-48')} aria-label="Due" />}
          <Btn type="submit" variant="primary" disabled={!subject.trim()}>Add</Btn>
        </div>
      </form>

      <ol className="relative ml-3 border-l-2 border-silver-200">
        {items.map((it, i) => {
          const a = it.activity;
          const Icon = a ? ACTIVITY_ICONS[a.type] : Circle;
          const overdue = a && !a.done && a.dueAt && new Date(a.dueAt).getTime() < Date.now();
          return (
            <li key={`${it.at}-${i}`} className="relative mb-3 ml-5">
              <span className={cn('absolute -left-[31px] top-0.5 grid h-6 w-6 place-items-center rounded-full ring-4 ring-silver-50', a ? (a.done ? 'bg-emerald-500 text-white' : overdue ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white') : 'bg-silver-300 text-white')}>
                <Icon className="h-3 w-3" />
              </span>
              <div className={cn('rounded-lg border bg-white px-3 py-2 shadow-sm', overdue ? 'border-rose-200' : 'border-silver-200')}>
                <div className="flex items-start justify-between gap-2">
                  <div className={cn('text-[13px] font-semibold text-slate-900', a?.done && a.type !== 'note' && 'text-silver-500 line-through')}>{it.label}</div>
                  {a && a.type !== 'note' && (
                    <button type="button" title={a.done ? 'Mark as open' : 'Mark as done'} onClick={() => crm.update<Activity>(a.id, { done: !a.done, doneAt: !a.done ? new Date().toISOString() : undefined })} className="flex-shrink-0 text-silver-400 hover:text-emerald-600">
                      {a.done ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> : <Circle className="h-4.5 w-4.5" />}
                    </button>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-silver-600">
                  {a ? `${ACTIVITY_TYPES.find((t) => t.id === a.type)?.label} · ` : ''}
                  {overdue ? <span className="font-semibold text-rose-600">Overdue · {relativeTime(it.at)}</span> : relativeTime(it.at)}
                </div>
              </div>
            </li>
          );
        })}
        {!items.length && <li className="ml-5 text-[12px] text-silver-500">No activity yet — log a call or add a follow-up above.</li>}
      </ol>
    </div>
  );
}
