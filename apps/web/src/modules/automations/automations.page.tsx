'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, Play, Loader2, CircleAlert, Workflow } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { Modal, FormField } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AiSymbol } from '@/components/ui/ai-symbol';

export function AutomationsPage() {
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [name, setName] = React.useState('');
  const [triggerType, setTriggerType] = React.useState('ORDER_CREATED');
  const [selectedActions, setSelectedActions] = React.useState<string[]>(['GENERATE_INVOICE']);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [aiGenerating, setAiGenerating] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [workflowOptions, setWorkflowOptions] = React.useState<{ triggers: string[]; actions: string[] }>({
    triggers: ['ORDER_CREATED', 'ORDER_CONFIRMED', 'ORDER_PAID', 'INVOICE_CREATED', 'INVOICE_OVERDUE', 'PAYMENT_RECEIVED', 'CALL_COMPLETED'],
    actions: ['GENERATE_INVOICE', 'SEND_WHATSAPP', 'SEND_EMAIL', 'CREATE_TASK'],
  });

  const load = React.useCallback(() => {
    setLoading(true);
    ApiClient.get<any>('/automations')
      .then((data) => setWorkflows(Array.isArray(data) ? data : data?.items || []))
      .catch((reason) => setError(reason.message || 'Could not load automation workflows.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    ApiClient.get<{ triggers: string[]; actions: string[] }>('/automations/options')
      .then((options) => setWorkflowOptions(options))
      .catch(() => undefined);
  }, []);

  // Autonomous Agent Listeners for Visual Automations
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWorkflowEvent = () => {
      setOpen(true);
    };

    window.addEventListener('billpilot:create-workflow', handleWorkflowEvent);

    const params = new URLSearchParams(window.location.search);
    if (params.get('synthesize') === 'true') {
      setOpen(true);
      setName('Automated Overdue Payment Reminder');
    }

    return () => {
      window.removeEventListener('billpilot:create-workflow', handleWorkflowEvent);
    };
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await ApiClient.post('/automations', {
        name,
        triggerType,
        conditions: [],
        actions: selectedActions.map((type) => ({ type })),
        isActive: false,
      });
      setName('');
      setTriggerType('ORDER_CREATED');
      setSelectedActions(['GENERATE_INVOICE']);
      setOpen(false);
      await load();
    } catch (reason: any) {
      setError(reason.message || 'Could not create this workflow.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAiSynthesize(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setError('');
    try {
      const generated = await ApiClient.post<any>('/ai/generate-workflow', {
        prompt: aiPrompt,
      });
      setName(generated.name || 'AI workflow draft');
      setTriggerType(generated.triggerType || 'ORDER_CREATED');
      setSelectedActions((generated.actions || []).map((action: any) => action.type));
      setOpen(true);
      setError('AI prepared a draft. Review it and choose Save Workflow to store it. Runs currently validate only; they do not execute external actions.');
      setAiPrompt('');
    } catch (reason: any) {
      setError(reason.message || 'Could not synthesize this workflow. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }

  async function dryRun(id: string) {
    setRunningId(id);
    setError('');
    try {
      const run = await ApiClient.post<any>(`/automations/${id}/test`);
      setError(`Dry run ${run.status}: validated actions only; no external action was executed.`);
      await load();
    } catch (reason: any) {
      setError(reason.message || 'The dry run could not be completed.');
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Automation Rules"
        description="Build, review, and safely validate billing workflows."
        primaryAction={{
          label: 'Create Workflow',
          onClick: () => setOpen((value) => !value),
          icon: <Plus className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="automations" onActionComplete={load} />

      {/* Natural Language Workflow Builder Card - Solid Sharp Zero Gradient */}
      <Card className="rounded-[4px] border border-[#CBD5E1] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-[#0F172A] font-semibold text-xs">
          <AiSymbol className="h-4 w-4 fill-[#0066FF]" />
          <span>Natural Language Workflow Builder</span>
        </div>
        <form onSubmit={handleAiSynthesize} className="flex flex-col sm:flex-row gap-2">
          <input
            required
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="E.g. When an order arrives, generate GST invoice and send WhatsApp confirmation"
            className="flex-1 rounded-[3px] border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none"
          />
          <button
            type="submit"
            disabled={aiGenerating}
            className="flex items-center justify-center gap-2 rounded-[3px] bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0052CC] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer flex-shrink-0"
          >
            <AiSymbol className="h-3.5 w-3.5 fill-white" />
            <span>{aiGenerating ? 'Building workflow…' : 'Synthesize Workflow'}</span>
          </button>
        </form>
        <p className="mt-2 text-[11px] text-slate-500">Generated workflows need your review. Saved rules are inactive drafts; dry runs validate the configuration only.</p>
        {aiGenerating && (
          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-blue-700" role="status" aria-live="polite">
            <span className="flex items-center gap-1" aria-hidden="true">
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.2s]" />
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.1s]" />
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600" />
            </span>
            Turning your description into a reviewable workflow…
          </div>
        )}
      </Card>

      {/* New Workflow Form Modal (Popup Style) */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Automation Workflow"
        subtitle="Configure trigger event and automated pipeline actions"
        icon={<Zap className="h-4 w-4" />}
        maxWidth="md"
      >
        <form onSubmit={create} className="space-y-4">
          <FormField label="Workflow Name" required>
            <input
              required
              minLength={2}
              maxLength={100}
              placeholder="e.g. Overdue Invoice Auto-WhatsApp Followup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>

          <FormField label="When should it run?" required>
            <select value={triggerType} onChange={(event) => setTriggerType(event.target.value)} className="h-[38px] w-full rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] focus:border-[#0066FF] focus:outline-none">
              {workflowOptions.triggers.map((trigger) => <option key={trigger} value={trigger}>{`When ${trigger.toLowerCase().replaceAll('_', ' ')}`}</option>)}
            </select>
          </FormField>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-semibold text-slate-700">What should happen?</legend>
            {workflowOptions.actions.map((value) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selectedActions.includes(value)}
                  onChange={(event) => setSelectedActions((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {value.replaceAll('_', ' ').toLowerCase()}
              </label>
            ))}
            {!selectedActions.length && <p className="text-[11px] text-rose-600">Choose at least one action.</p>}
          </fieldset>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !selectedActions.length}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save Workflow'}
            </Button>
          </div>
        </form>
      </Modal>

      {error && (
        <div role="status" aria-live="polite" className={`flex items-start gap-2 rounded-xl p-3.5 text-xs font-semibold border ${error.startsWith('Dry run') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm font-medium text-slate-500" role="status">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Loading workflows…
          </div>
        )}
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Zap className="h-4 w-4" />
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{workflow.name}</h4>
                  <Badge variant={workflow.isActive ? 'success' : 'secondary'}>
                    {workflow.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                  <span>Trigger: <span className="font-bold text-slate-800">{String(workflow.triggerType || 'Manual').replaceAll('_', ' ')}</span></span>
                  <span>Actions: <span className="font-bold text-slate-800">{(workflow.actions || []).map((action: any) => String(action.type).replaceAll('_', ' ')).join(' · ') || 'None'}</span></span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Runs executed: {workflow.executionCount || 0}</p>
              </div>
              <button
                onClick={() => dryRun(workflow.id)}
                disabled={runningId === workflow.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-3xs disabled:cursor-wait disabled:opacity-60"
              >
                {runningId === workflow.id ? <Loader2 className="h-3 w-3 animate-spin text-emerald-600" /> : <Play className="h-3 w-3 text-emerald-600 fill-emerald-600" />}
                {runningId === workflow.id ? 'Validating…' : 'Validate Dry Run'}
              </button>
            </div>
          </Card>
        ))}
      </div>
      {!loading && !workflows.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Workflow className="h-5 w-5" /></span>
          <h3 className="text-sm font-bold text-slate-800">No workflows yet</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Describe a billing task above or create a workflow to start automating routine work.</p>
          <button type="button" onClick={() => setOpen(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Plus className="h-3.5 w-3.5" /> Create workflow</button>
        </div>
      )}
    </div>
  );
}
