'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReportGenerateFormSchema, ReportGenerateFormData } from './reports.schema';
import { ReportTypeDefinition } from './reports.types';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

interface ReportsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportGenerateFormData) => Promise<void>;
  reportTypes: ReportTypeDefinition[];
}

export function ReportsForm({ isOpen, onClose, onSubmit, reportTypes }: ReportsFormProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportGenerateFormData>({
    resolver: zodResolver(ReportGenerateFormSchema),
    defaultValues: {
      reportType: 'SALES_SUMMARY',
      format: 'CSV',
      dateRange: 'this_month',
    },
  });

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleFormSubmit = async (data: ReportGenerateFormData) => {
    try {
      setSubmitting(true);
      await onSubmit(data);
      reset();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-[4px] bg-white border border-[#CBD5E1] shadow-xl overflow-hidden relative my-auto max-h-[min(90vh,680px)] flex flex-col">
        {/* Zoho top blue accent stripe */}
        <div className="h-1 w-full bg-[#0066FF]" />

        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[4px] bg-[#EAF2FE] text-[#0066FF] flex items-center justify-center font-bold">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#0F172A]">Export Financial Report</h3>
              <p className="text-[12px] text-[#64748B]">Generate audited CSV, XLSX or PDF ledgers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-[4px] hover:bg-[#F1F5F9] transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">
              Select Report Type
            </label>
            <select
              {...register('reportType')}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] focus:border-[#0066FF] focus:outline-none transition-colors"
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.category})
                </option>
              ))}
            </select>
            {errors.reportType && <p className="text-xs text-[#DC2626] mt-1">{errors.reportType.message}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['CSV', 'XLSX', 'PDF'].map((fmt) => (
                <label
                  key={fmt}
                  className="flex items-center justify-center rounded-[4px] border border-[#CBD5E1] py-2 text-[13px] font-medium text-[#334155] cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                >
                  <input
                    type="radio"
                    value={fmt}
                    {...register('format')}
                    className="mr-1.5 accent-[#0066FF]"
                  />
                  {fmt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">
              Date Period
            </label>
            <select
              {...register('dateRange')}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] focus:border-[#0066FF] focus:outline-none transition-colors"
            >
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="this_month">This Month (October 2026)</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-[36px] px-4 rounded-[4px] border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-[36px] px-5 rounded-[4px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium shadow-none cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
