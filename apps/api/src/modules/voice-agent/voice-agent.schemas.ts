import { z } from 'zod';

const phoneSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 phone format');

export const SaveVoiceAgentConfigSchema = z.object({
  isEnabled: z.boolean().default(false),
  language: z.enum(['en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'ml-IN', 'kn-IN']).default('en-IN'),
  voiceId: z.string().trim().min(1).max(80).default('default'),
  greeting: z.string().trim().max(500).default(''),
  callingWindowStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'),
  callingWindowEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('19:00'),
  maxAttempts: z.number().int().min(1).max(5).default(3),
}).strict();

export const CreateVoiceCampaignSchema = z.object({
  name: z.string().trim().min(2).max(100),
  invoiceIds: z.array(z.string().uuid()).min(1).max(500).refine((items) => new Set(items).size === items.length, 'Invoice IDs must be unique'),
  scheduleAt: z.string().datetime().optional(),
}).strict();

export const TriggerVoiceCallSchema = z.object({
  customerId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  toNumber: phoneSchema,
  purpose: z.literal('PAYMENT_REMINDER').default('PAYMENT_REMINDER'),
  scheduledAt: z.string().datetime().optional(),
}).strict();

export const TestVoiceCallSchema = z.object({
  toNumber: phoneSchema,
  confirmAuthorizedTestNumber: z.literal(true),
}).strict();

export const VoiceToolCallSchema = z.object({ callId: z.string().uuid() }).strict();
export const VoiceGetBillSchema = VoiceToolCallSchema.extend({ identityConfirmed: z.literal(true) }).strict();
export const VoiceOutcomeSchema = VoiceToolCallSchema.extend({ outcome: z.enum(['WILL_PAY', 'PAID_ALREADY', 'DISPUTED', 'WRONG_NUMBER', 'CALL_LATER', 'DO_NOT_CALL', 'NO_ANSWER', 'TRANSFERRED']) }).strict();
export const VoiceWorkerDialFailureSchema = z.object({ failureType: z.enum(['NO_ANSWER', 'BUSY', 'SIP_FAILURE', 'AGENT_FAILURE']) }).strict();
export const VoiceCallEndedSchema = VoiceToolCallSchema.extend({
  transcript: z.string().max(50_000),
  recordingUrl: z.string().url().startsWith('https://').optional(),
  durationSec: z.number().int().min(0).max(24 * 60 * 60),
  costInr: z.number().min(0).max(1_000_000).optional(),
}).strict();

export const VoiceConsentSchema = z.object({
  customerId: z.string().uuid(),
  phone: phoneSchema,
  source: z.string().trim().min(1).max(100),
  granted: z.boolean(),
}).strict();

export const DoNotCallSchema = z.object({ phone: phoneSchema, reason: z.string().trim().max(300).optional() }).strict();
