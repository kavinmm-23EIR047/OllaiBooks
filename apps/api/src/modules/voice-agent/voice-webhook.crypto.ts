import { createHash, createHmac } from 'crypto';

export function deriveVoiceAgentSecret(masterSecret: string, agentConfigId: string) {
  return createHmac('sha256', masterSecret).update(`billpilot-voice-agent:${agentConfigId}`).digest('hex');
}

export function hashVoiceAgentSecret(agentSecret: string) {
  return createHash('sha256').update(agentSecret).digest('hex');
}
