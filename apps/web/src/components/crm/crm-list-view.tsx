'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ListColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  hideOnMobile?: boolean;
}

export interface ListFilterGroup<T> {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  match: (row: T, value: string) => boolean;
}

/**
 * Zoho-style list view: filter sidebar on the left, toolbar with search +
 * active filter chips, sortable dense table with checkboxes, bulk actions.
 */
export function CrmListView<T extends { id: string }>({
  rows, columns, filters = [], searchText, onRowClick, bulkActions, emptyState, toolbarExtra, initialSort,
}: {
  rows: T[];
  columns: ListColumn<T>[];
  filters?: ListFilterGroup<T>[];
  searchText: (row: T) => string;
  onRowClick?: (row: T) => void;
  bulkActions?: (selected: T[], clear: () => void) => React.ReactNode;
  emptyState?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
}) {
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<Record<string, string[]>>({});
  const [sort, setSort] = React.useState(initialSort || null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((r) => (!q || searchText(r).toLowerCase().includes(q))
      && filters.every((g) => !active[g.key]?.length || active[g.key].some((v) => g.match(r, v))));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a); const bv = col.sortValue!(b);
          const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, query, active, filters, sort, columns, searchText]);

  React.useEffect(() => {
    setSelected((s) => new Set(Array.from(s).filter((id) => rows.some((r) => r.id === id))));
  }, [rows]);

  const toggleFilter = (key: string, value: string) => setActive((cur) => {
    const list = cur[key] || [];
    return { ...cur, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
  });
  const activeChips = filters.flatMap((g) => (active[g.key] || []).map((v) => ({ g, v, label: g.options.find((o) => o.value === v)?.label || v })));
  const selectedRows = filtered.filter((r) => selected.has(r.id));
  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const filterPanel = (
    <div className="space-y-4">
      {filters.map((g) => (
        <div key={g.key}>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-silver-500">{g.label}</div>
          <div className="space-y-0.5">
            {g.options.map((o) => {
              const count = rows.filter((r) => g.match(r, o.value)).length;
              const on = active[g.key]?.includes(o.value);
              return (
                <label key={o.value} className={cn('flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px]', on ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-silver-100')}>
                  <input type="checkbox" checked={Boolean(on)} onChange={() => toggleFilter(g.key, o.value)} className="h-3.5 w-3.5 accent-blue-600" />
                  <span className="flex-1 truncate">{o.label}</span>
                  <span className="text-[11px] font-semibold text-silver-500">{count}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex gap-4">
      {filters.length > 0 && (
        <aside className="hidden w-56 flex-shrink-0 self-start rounded-xl border border-silver-200 bg-white p-3 shadow-sm xl:block">
          <div className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-slate-900"><Filter className="h-4 w-4 text-blue-600" /> Filter by</div>
          {filterPanel}
        </aside>
      )}

      <section className="min-w-0 flex-1 overflow-hidden rounded-xl border border-silver-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-silver-200 bg-gradient-to-b from-white to-silver-50 px-3 py-2.5">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this list…" className="h-9 w-full rounded-md border border-silver-300 bg-white pl-8 pr-2 text-[13px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15" />
          </div>
          {filters.length > 0 && (
            <button type="button" onClick={() => setFiltersOpen((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-silver-300 bg-white px-3 text-[13px] font-semibold text-slate-700 xl:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeChips.length ? ` (${activeChips.length})` : ''}
            </button>
          )}
          {activeChips.map((c) => (
            <button key={`${c.g.key}:${c.v}`} type="button" onClick={() => toggleFilter(c.g.key, c.v)} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100">
              {c.g.label}: {c.label} <X className="h-3 w-3" />
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] font-medium text-silver-600">{filtered.length} of {rows.length}</span>
            {toolbarExtra}
          </div>
        </div>

        {filtersOpen && filters.length > 0 && <div className="border-b border-silver-200 bg-silver-50 p-3 xl:hidden">{filterPanel}</div>}

        {selectedRows.length > 0 && bulkActions && (
          <div className="flex flex-wrap items-center gap-2 border-b border-blue-200 bg-blue-50 px-3 py-2 text-[13px]">
            <b className="text-blue-800">{selectedRows.length} selected</b>
            {bulkActions(selectedRows, () => setSelected(new Set()))}
            <button type="button" className="ml-auto text-[12px] font-semibold text-blue-700 hover:underline" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}

        {filtered.length === 0 ? (
          emptyState || <div className="p-10 text-center text-[13px] text-silver-600">Nothing matches these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-silver-200 bg-silver-50">
                  {bulkActions && (
                    <th className="w-10 px-3 py-2.5">
                      <input type="checkbox" aria-label="Select all" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(filtered.map((r) => r.id)))} className="h-3.5 w-3.5 accent-blue-600" />
                    </th>
                  )}
                  {columns.map((c) => (
                    <th key={c.key} className={cn('px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-silver-600', c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                      {c.sortValue ? (
                        <button type="button" className="inline-flex items-center gap-1 hover:text-slate-900" onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'asc' }))}>
                          {c.label}
                          {sort?.key === c.key && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </button>
                      ) : c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onRowClick?.(r)}
                    className={cn('group border-b border-silver-100 transition-colors last:border-0', onRowClick && 'cursor-pointer', selected.has(r.id) ? 'bg-blue-50/60' : 'hover:bg-blue-50/40')}
                  >
                    {bulkActions && (
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label="Select row" checked={selected.has(r.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} className="h-3.5 w-3.5 accent-blue-600" />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-3 py-2.5 align-middle text-[13px] text-slate-800', c.hideOnMobile && 'hidden md:table-cell', c.className)}>{c.render(r)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
