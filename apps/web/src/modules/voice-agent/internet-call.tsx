'use client';

import * as React from 'react';
import { Room, RoomEvent, Track, ParticipantKind, type RemoteTrack, type RemoteParticipant, type Participant } from 'livekit-client';
import { Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Bot, X, Wifi } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

type Mode = 'outgoing' | 'incoming';
type Phase = 'ringing' | 'incoming' | 'connecting' | 'active' | 'ended';
type AgentState = 'initializing' | 'listening' | 'thinking' | 'speaking' | string;

/* ------------------------------------------------------------------ */
/* Call tones, synthesised with Web Audio (no audio files needed).     */
/* ------------------------------------------------------------------ */
class CallTones {
  private ctx: AudioContext;
  private master: GainNode;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.newMaster();
  }

  private newMaster() {
    const gain = this.ctx.createGain();
    gain.gain.value = 1;
    gain.connect(this.ctx.destination);
    return gain;
  }

  private tone(freqs: number[], start: number, duration: number, volume = 0.08, type: OscillatorType = 'sine', decay = false) {
    for (const freq of freqs) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(volume, start + 0.015);
      if (decay) env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      else {
        env.gain.setValueAtTime(volume, start + duration - 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      }
      osc.connect(env).connect(this.master);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    }
  }

  private loop(cycle: () => void, everyMs: number) {
    this.stop();
    void this.ctx.resume();
    cycle();
    this.timer = setInterval(cycle, everyMs);
  }

  /** Caller hears this while the other side rings (Indian-style double ring: 400+450 Hz). */
  ringback() {
    this.loop(() => {
      const t = this.ctx.currentTime + 0.05;
      this.tone([400, 450], t, 0.4, 0.05);
      this.tone([400, 450], t + 0.6, 0.4, 0.05);
    }, 3000);
  }

  /** Incoming-call ringtone: a short marimba-like melody, repeated. */
  ringtone() {
    const melody = [659.25, 783.99, 1046.5, 783.99, 880, 1046.5];
    this.loop(() => {
      const t = this.ctx.currentTime + 0.05;
      for (let rep = 0; rep < 2; rep++) {
        melody.forEach((freq, i) => {
          const at = t + rep * 1.15 + i * 0.18;
          this.tone([freq], at, 0.35, 0.16, 'sine', true);
          this.tone([freq * 2], at, 0.15, 0.04, 'triangle', true);
        });
      }
      try { navigator.vibrate?.([400, 200, 400, 200, 400]); } catch { /* not supported */ }
    }, 3200);
  }

  /** Three short beeps when the call ends. */
  hangup() {
    this.stop();
    void this.ctx.resume();
    const t = this.ctx.currentTime + 0.05;
    for (let i = 0; i < 3; i++) this.tone([480, 620], t + i * 0.3, 0.18, 0.05);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    try { navigator.vibrate?.(0); } catch { /* not supported */ }
    this.master.disconnect();
    this.master = this.newMaster();
  }

  close() {
    this.stop();
    void this.ctx.close().catch(() => undefined);
  }
}

const MIN_RING_MS = 4200; // let the phone ring roughly twice before the agent picks up

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ------------------------------------------------------------------ */
/* Call screen                                                         */
/* ------------------------------------------------------------------ */
export function InternetCallScreen({ mode, agentName, onClose }: { mode: Mode; agentName: string; onClose: () => void }) {
  const [phase, setPhase] = React.useState<Phase>(mode === 'outgoing' ? 'ringing' : 'incoming');
  const [agentState, setAgentState] = React.useState<AgentState>('initializing');
  const [muted, setMuted] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [endReason, setEndReason] = React.useState('');
  const [needsAudioTap, setNeedsAudioTap] = React.useState(false);

  const tonesRef = React.useRef<CallTones | null>(null);
  const roomRef = React.useRef<Room | null>(null);
  const audioBoxRef = React.useRef<HTMLDivElement | null>(null);
  const answeredAtRef = React.useRef<number | null>(null);
  const endedRef = React.useRef(false);
  const phaseRef = React.useRef<Phase>(phase);
  phaseRef.current = phase;

  const end = React.useCallback((reason: string) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const room = roomRef.current;
    roomRef.current = null;
    if (room) void room.disconnect();
    tonesRef.current?.hangup();
    setEndReason(reason);
    setPhase('ended');
  }, []);

  const connect = React.useCallback(async (ringStartedAt: number | null) => {
    try {
      const session = await ApiClient.post<{ callId: string; serverUrl: string; participantToken: string }>('/voice-agent/web-call');
      if (endedRef.current) return;
      if (ringStartedAt) {
        const wait = MIN_RING_MS - (Date.now() - ringStartedAt);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        if (endedRef.current) return;
      }

      const room = new Room({ audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      roomRef.current = room;

      const answer = () => {
        if (answeredAtRef.current) return;
        answeredAtRef.current = Date.now();
        tonesRef.current?.stop();
        setPhase('active');
      };

      // The agent publishing its voice track is the moment it "picks up".
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind !== Track.Kind.Audio) return;
        audioBoxRef.current?.appendChild(track.attach());
        answer();
      });
      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => { track.detach().forEach((el) => el.remove()); });
      room.on(RoomEvent.ParticipantAttributesChanged, (changed: Record<string, string>, participant: Participant) => {
        const state = changed['lk.agent.state'] ?? participant.attributes?.['lk.agent.state'];
        if (state) setAgentState(state);
      });
      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        if (participant.kind === ParticipantKind.AGENT) end('The assistant ended the call');
      });
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => setNeedsAudioTap(!room.canPlaybackAudio));
      room.on(RoomEvent.Disconnected, () => end(answeredAtRef.current ? 'Call ended' : 'Call could not connect'));

      await room.connect(session.serverUrl, session.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);
      await room.startAudio().catch(() => setNeedsAudioTap(true));

      // If the agent never picks up, give up like a real phone would.
      setTimeout(() => { if (!answeredAtRef.current && !endedRef.current) end('No answer from the assistant'); }, 30_000);
    } catch (error: any) {
      const message = error?.name === 'NotAllowedError' ? 'Microphone permission is needed to talk' : error?.message || 'Call could not connect';
      end(message);
    }
  }, [end]);

  // Start: outgoing rings immediately; incoming shows the ringing screen and waits for Accept.
  React.useEffect(() => {
    tonesRef.current = new CallTones();
    let missedTimer: ReturnType<typeof setTimeout> | undefined;
    if (mode === 'outgoing') {
      tonesRef.current.ringback();
      void connect(Date.now());
    } else {
      tonesRef.current.ringtone();
      missedTimer = setTimeout(() => { if (phaseRef.current === 'incoming') end('Missed call'); }, 30_000);
    }
    return () => {
      if (missedTimer) clearTimeout(missedTimer);
      endedRef.current = true;
      void roomRef.current?.disconnect();
      roomRef.current = null;
      tonesRef.current?.close();
    };
  }, [mode, connect, end]);

  // Call timer.
  React.useEffect(() => {
    if (phase !== 'active') return;
    const id = setInterval(() => { if (answeredAtRef.current) setSeconds(Math.floor((Date.now() - answeredAtRef.current) / 1000)); }, 500);
    return () => clearInterval(id);
  }, [phase]);

  const accept = () => {
    tonesRef.current?.stop();
    setPhase('connecting');
    void connect(null);
  };

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(muted);
    setMuted(!muted);
  };

  const statusLine =
    phase === 'ringing' ? 'Ringing…' :
    phase === 'incoming' ? 'Incoming internet call' :
    phase === 'connecting' ? 'Connecting…' :
    phase === 'active' ? formatDuration(seconds) :
    endReason || 'Call ended';

  const agentLine = phase !== 'active' ? null :
    agentState === 'speaking' ? 'Speaking' :
    agentState === 'thinking' ? 'Thinking…' :
    agentState === 'listening' ? 'Listening' : 'Connected';

  const ringing = phase === 'ringing' || phase === 'incoming' || phase === 'connecting';
  const speaking = phase === 'active' && agentState === 'speaking';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Internet call with AI assistant">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-black text-white sm:h-[min(760px,92vh)] sm:max-w-[390px] sm:rounded-[2.75rem] sm:border-[10px] sm:border-slate-950 sm:shadow-2xl">
        <div ref={audioBoxRef} className="hidden" />

        <div className="flex items-center justify-between px-6 pt-6 text-xs text-white/60">
          <span className="inline-flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" />Internet call</span>
          {phase === 'ended' && <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>}
        </div>

        {/* Caller identity */}
        <div className="flex flex-1 flex-col items-center px-6 pt-10 text-center">
          <p className="text-sm text-white/70" aria-live="polite">{statusLine}</p>
          <h2 className="mt-2 text-3xl font-light tracking-tight">{agentName}</h2>
          <p className="mt-1 text-sm text-white/50">AI voice assistant</p>

          <div className="relative mt-14 flex h-44 w-44 items-center justify-center">
            {ringing && <>
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 [animation-duration:1.8s]" />
              <span className="absolute inset-4 animate-ping rounded-full bg-emerald-400/20 [animation-delay:0.6s] [animation-duration:1.8s]" />
            </>}
            {speaking && <span className="absolute inset-2 animate-pulse rounded-full bg-sky-400/25" />}
            <div className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 shadow-xl transition-transform duration-300 ${speaking ? 'scale-105' : ''} ${phase === 'ended' ? 'opacity-50 grayscale' : ''}`}>
              <Bot className="h-16 w-16" />
            </div>
          </div>

          {agentLine && <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"><span className={`h-2 w-2 rounded-full ${speaking ? 'bg-sky-400' : agentState === 'listening' ? 'bg-emerald-400' : 'bg-amber-400'}`} />{agentLine}</p>}
          {needsAudioTap && phase === 'active' && <button onClick={() => void roomRef.current?.startAudio().then(() => setNeedsAudioTap(false))} className="mt-4 rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-slate-900">Tap to hear the assistant</button>}
        </div>

        {/* Controls */}
        <div className="px-8 pb-12">
          {phase === 'incoming' && (
            <div className="flex items-end justify-between">
              <CallButton label="Decline" onClick={() => end('Call declined')} className="bg-red-500 hover:bg-red-600"><PhoneOff className="h-7 w-7" /></CallButton>
              <CallButton label="Accept" onClick={accept} className="animate-bounce bg-emerald-500 hover:bg-emerald-600 [animation-duration:1.4s]"><PhoneIncoming className="h-7 w-7" /></CallButton>
            </div>
          )}

          {(phase === 'ringing' || phase === 'connecting' || phase === 'active') && (
            <div className="flex items-end justify-center gap-14">
              <CallButton label={muted ? 'Unmute' : 'Mute'} onClick={() => void toggleMute()} disabled={phase !== 'active'} className={muted ? 'bg-white text-slate-900' : 'bg-white/15 hover:bg-white/25'}>
                {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </CallButton>
              <CallButton label="End" onClick={() => end(phase === 'active' ? 'Call ended' : 'Call cancelled')} className="bg-red-500 hover:bg-red-600"><PhoneOff className="h-7 w-7" /></CallButton>
            </div>
          )}

          {phase === 'ended' && (
            <div className="flex items-end justify-center gap-14">
              <CallButton label="Close" onClick={onClose} className="bg-white/15 hover:bg-white/25"><X className="h-6 w-6" /></CallButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CallButton({ label, onClick, className, disabled, children }: { label: string; onClick: () => void; className: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition disabled:opacity-40 ${className}`}>{children}</button>
      <span className="text-xs text-white/70">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Launcher card shown on the AI Voice Agent page                      */
/* ------------------------------------------------------------------ */
export function InternetCallCard({ agentName, enabled, onCallFinished }: { agentName: string; enabled: boolean; onCallFinished?: () => void }) {
  const [mode, setMode] = React.useState<Mode | null>(null);
  const [pendingIncoming, setPendingIncoming] = React.useState(false);

  const close = () => { setMode(null); onCallFinished?.(); };
  const ringMeSoon = () => {
    setPendingIncoming(true);
    setTimeout(() => { setPendingIncoming(false); setMode('incoming'); }, 1500);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><Wifi className="h-5 w-5" /></div>
          <div>
            <h2 className="font-semibold text-slate-900">Talk to your AI agent over the internet</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">A free internet call in your browser or the app. It needs no phone number, SIP trunk or carrier charges. It rings like a real phone, then the AI answers and talks with you. Uses your microphone.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!enabled} onClick={() => setMode('outgoing')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"><Phone className="h-4 w-4" />Call AI agent</button>
          <button type="button" disabled={!enabled || pendingIncoming} onClick={ringMeSoon} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><PhoneIncoming className="h-4 w-4" />{pendingIncoming ? 'Ringing you…' : 'AI calls me'}</button>
        </div>
      </div>
      {!enabled && <p className="mt-3 text-xs text-amber-800">Enable the voice agent in Agent settings first.</p>}
      {mode && <InternetCallScreen mode={mode} agentName={agentName} onClose={close} />}
    </section>
  );
}
