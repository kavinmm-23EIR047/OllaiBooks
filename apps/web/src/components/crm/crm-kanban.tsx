'use client';

import * as React from 'react';
import { CalendarDays, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEAL_STAGES, type Deal, type DealStage } from '@/lib/crm-store';
import { Avatar, inr } from './crm-ui';

/** Drag-and-drop deal pipeline. Keyboard / touch users can change stage from the card menu. */
export function DealKanban({ deals, onMove, onOpen }: { deals: Deal[]; onMove: (deal: Deal, stage: DealStage) => void; onOpen: (deal: Deal) => void }) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<DealStage | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-3" role="list" aria-label="Deal pipeline">
      {DEAL_STAGES.map((stage) => {
        const list = deals.filter((d) => d.stage === stage.id);
        const total = list.reduce((s, d) => s + Number(d.amount || 0), 0);
        const weighted = list.reduce((s, d) => s + Number(d.amount || 0) * (d.probability / 100), 0);
        return (
          <section
            key={stage.id}
            role="listitem"
            onDragOver={(e) => { e.preventDefault(); setOverStage(stage.id); }}
            onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain') || dragId;
              const deal = deals.find((d) => d.id === id);
              if (deal && deal.stage !== stage.id) onMove(deal, stage.id);
              setDragId(null); setOverStage(null);
            }}
            className={cn('flex w-[272px] flex-shrink-0 flex-col rounded-xl border bg-silver-100/70 transition-colors', overStage === stage.id ? 'border-blue-400 bg-blue-50' : 'border-silver-200')}
          >
            <header className="rounded-t-xl border-b border-silver-200 bg-white px-3 py-2.5" style={{ boxShadow: `inset 0 3px 0 0 ${stage.tone}` }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-900">{stage.label}</span>
                <span className="rounded-full bg-silver-100 px-2 py-0.5 text-[11px] font-bold text-silver-700">{list.length}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[11px] text-silver-600">
                <span className="font-semibold text-slate-700">{inr(total)}</span>
                <span title="Weighted by probability">~{inr(weighted)} likely</span>
              </div>
            </header>
            <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
              {list.map((d) => (
                <article
                  key={d.id}
                  draggable
                  onDragStart={(e) => { setDragId(d.id); e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragEnd={() => { setDragId(null); setOverStage(null); }}
                  className={cn('group cursor-grab rounded-lg border border-silver-200 bg-white p-2.5 shadow-sm transition-all hover:-translate-y-px hover:border-blue-300 hover:shadow-md active:cursor-grabbing', dragId === d.id && 'opacity-50')}
                >
                  <div className="flex items-start gap-1.5">
                    <GripVertical className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-silver-300 group-hover:text-silver-500" />
                    <button type="button" onClick={() => onOpen(d)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[13px] font-bold text-slate-900 group-hover:text-blue-700">{d.title}</div>
                      <div className="truncate text-[12px] text-silver-600">{d.company || d.contactName}</div>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[14px] font-extrabold text-slate-900">{inr(d.amount)}</span>
                    <Avatar name={d.contactName} size={22} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-silver-600">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{d.closeDate ? new Date(d.closeDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No date'}</span>
                    <select
                      aria-label="Move to stage"
                      value={d.stage}
                      onChange={(e) => onMove(d, e.target.value as DealStage)}
                      onClick={(e) => e.stopPropagation()}
                      className="max-w-[110px] rounded border border-silver-200 bg-silver-50 px-1 py-0.5 text-[11px] text-slate-700"
                    >
                      {DEAL_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </article>
              ))}
              {!list.length && <div className="grid flex-1 place-items-center rounded-lg border-2 border-dashed border-silver-200 text-[12px] text-silver-400">Drop deals here</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
