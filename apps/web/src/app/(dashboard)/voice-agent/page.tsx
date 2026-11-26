import { VoiceAgentPage } from '@/modules/voice-agent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Voice Calling Agent - ollaiBooks AI',
};

export default function Page() {
  return <VoiceAgentPage />;
}
