import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../database/prisma.service';

export const AutomationActionSchema = z.object({ type: z.enum(['GENERATE_INVOICE', 'SEND_WHATSAPP', 'SEND_EMAIL', 'CREATE_TASK']) }).strict();
export const AutomationTriggerSchema = z.enum(['ORDER_CREATED', 'ORDER_CONFIRMED', 'ORDER_PAID', 'INVOICE_CREATED', 'INVOICE_OVERDUE', 'PAYMENT_RECEIVED', 'CALL_COMPLETED']);
export const WorkflowSchema = z.object({
  name: z.string().trim().min(2).max(100), description: z.string().trim().max(1000).optional(),
  triggerType: AutomationTriggerSchema.default('ORDER_CREATED'),
  conditions: z.array(z.record(z.unknown())).max(20).default([]), actions: z.array(AutomationActionSchema).min(1).max(10), isActive: z.boolean().default(false),
}).strict();

@Injectable()
export class AutomationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listWorkflows(tenantId: string) {
    return this.prisma.automationWorkflow.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, include: { runs: { take: 5, orderBy: { createdAt: 'desc' } } } });
  }

  async createWorkflow(tenantId: string, input: unknown) {
    const data = WorkflowSchema.parse(input);
    return this.prisma.automationWorkflow.create({ data: { tenantId, name: data.name, description: data.description, triggerType: data.triggerType, conditions: data.conditions as Prisma.InputJsonValue, actions: data.actions as Prisma.InputJsonValue, isActive: false } });
  }

  async testRunWorkflow(tenantId: string, workflowId: string) {
    const workflow = await this.prisma.automationWorkflow.findFirst({ where: { id: workflowId, tenantId } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    const actions = z.array(AutomationActionSchema).parse(workflow.actions);
    const steps = actions.map((action, index) => ({ step: index + 1, action: action.type, status: 'DRY_RUN', detail: 'Validated only; no invoice, message, email, or external action was executed.' }));
    return this.prisma.automationRun.create({ data: {
      tenantId, workflowId, triggerPayload: { test: true, createdAt: new Date().toISOString() },
      stepsExecuted: steps, status: 'DRY_RUN', executionLogs: 'Workflow and action schemas validated. No side effects were performed.',
    } });
  }

  getOptions() {
    return {
      triggers: AutomationTriggerSchema.options,
      actions: AutomationActionSchema.shape.type.options,
      executionMode: 'DRY_RUN_ONLY',
    };
  }
}
