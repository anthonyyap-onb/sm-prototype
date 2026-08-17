'use client';

import { useCallback, useRef, useState } from 'react';
import {
  GoogleGenAI,
  Modality,
  StartSensitivity,
  EndSensitivity,
  type Session,
  type LiveServerMessage,
} from '@google/genai/web';
import type { LiveSystemPromptContext } from '@/lib/live/buildLiveSystemPrompt';
import { handleLiveToolCall } from '@/lib/live/liveToolHandler';
import type { ChatToolDependencies } from '@/lib/tools/chatTools';

export type LiveSessionStatus = 'idle' | 'connecting' | 'active' | 'error';

export interface UseLiveVoiceSessionReturn {
  status: LiveSessionStatus;
  errorMessage: string | null;
  isInterrupted: boolean;
  startSession: (
    context: LiveSystemPromptContext,
    dependencies: ChatToolDependencies
  ) => Promise<void>;
  endSession: () => Promise<void>;
}

export function useLiveVoiceSession(): UseLiveVoiceSessionReturn {
  const [status, setStatus] = useState<LiveSessionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInterrupted, setIsInterrupted] = useState(false);

  const sessionRef = useRef<Session | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  // Prevents onclose from overwriting 'error' status when onerror fired first
  const erroredRef = useRef(false);

  const playAudioChunk = useCallback((base64PcmData: string) => {
    if (!audioCtxRef.current) return;
    setIsInterrupted(false);

    const binaryString = atob(base64PcmData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const dataView = new DataView(bytes.buffer);
    const numSamples = bytes.length / 2;
    const float32Array = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      float32Array[i] = int16 / 32768.0;
    }

    const audioBuffer = audioCtxRef.current.createBuffer(1, numSamples, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
    };

    const currentTime = audioCtxRef.current.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
  }, []);

  const stopMicrophoneAndAudio = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    nextStartTimeRef.current = 0;
  }, []);

  const stopAudioPlayback = useCallback(() => {
    for (const source of activeSourcesRef.current) {
      try { source.stop(); } catch { /* already ended — safe to ignore */ }
    }
    activeSourcesRef.current = [];
    if (audioCtxRef.current) {
      nextStartTimeRef.current = audioCtxRef.current.currentTime;
    }
  }, []);

  const startMicrophone = useCallback(
    async (session: Session) => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      if (audioCtxRef.current!.state === 'suspended') {
        await audioCtxRef.current!.resume();
      }

      await audioCtxRef.current!.audioWorklet.addModule('/pcm-processor.js');

      const source = audioCtxRef.current!.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtxRef.current!, 'pcm-processor');
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(event.data))
        );
        session.sendRealtimeInput({
          audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' },
        });
      };

      // NOTE: do NOT connect workletNode to destination — that would cause mic feedback.
      source.connect(workletNode);
    },
    []
  );

  const startSession = useCallback(
    async (context: LiveSystemPromptContext, dependencies: ChatToolDependencies) => {
      if (sessionRef.current) return;

      setStatus('connecting');
      setErrorMessage(null);

      try {
        const res = await fetch('/api/live-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(context),
        });
        const { accessToken, error } = await res.json();
        if (error || !accessToken) throw new Error(error ?? 'No token returned');

        audioCtxRef.current = new AudioContext({ sampleRate: 16000 });
        nextStartTimeRef.current = audioCtxRef.current.currentTime;

        const ai = new GoogleGenAI({
          apiKey: accessToken,
          httpOptions: { apiVersion: 'v1alpha' },
        });

        const session = await ai.live.connect({
          model: 'models/gemini-3.1-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            realtimeInputConfig: {
              automaticActivityDetection: {
                startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
                endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
                prefixPaddingMs: 20,
                silenceDurationMs: 100,
              },
            },
          },
          callbacks: {
            onopen: () => {
              console.log('[LiveSession] onopen — session active');
              erroredRef.current = false;
              setStatus('active');
            },
            onmessage: async (msg: LiveServerMessage) => {
              // Play incoming audio
              if (msg.serverContent?.modelTurn?.parts) {
                for (const part of msg.serverContent.modelTurn.parts) {
                  if (part.inlineData?.data) {
                    playAudioChunk(part.inlineData.data);
                  }
                }
              }

              // Stop playback and flag the interruption
              if (msg.serverContent?.interrupted) {
                stopAudioPlayback();
                setIsInterrupted(true);
              }

              // Handle tool calls
              if (msg.toolCall?.functionCalls && msg.toolCall.functionCalls.length > 0) {
                const responses = await Promise.all(
                  msg.toolCall.functionCalls.map((call) =>
                    handleLiveToolCall(call, dependencies)
                  )
                );
                sessionRef.current?.sendToolResponse({ functionResponses: responses });
              }
            },
            onerror: (err) => {
              console.error('[LiveSession] onerror:', err);
              erroredRef.current = true;
              setErrorMessage('Connection error. Please try again.');
              setStatus('error');
              stopMicrophoneAndAudio();
            },
            onclose: () => {
              console.log('[LiveSession] onclose — errored:', erroredRef.current);
              stopMicrophoneAndAudio();
              sessionRef.current = null;
              // Don't overwrite 'error' status if onerror already fired
              if (!erroredRef.current) {
                setStatus('idle');
              }
            },
          },
        });

        sessionRef.current = session;
        await startMicrophone(session);

        // Trigger initial greeting — exact wording matches the text-chat welcome message
        const greetingInstruction = context.storeLocation
          ? `Say exactly this greeting to the user: "Hello! I am your SM Markets Assistant. You're currently shopping at ${context.storeLocation}. Ask me about products, recipes, or item availability!"`
          : `Say exactly this greeting to the user: "Hello! I am your SM Markets Assistant. Ask me about products, recipes, or item availability at your chosen branch!"`;

        await session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [{ text: greetingInstruction }],
            },
          ],
          turnComplete: true,
        });
      } catch (err) {
        console.error('[LiveSession] startSession failed:', err);
        erroredRef.current = true;
        setErrorMessage(err instanceof Error ? err.message : 'Failed to connect.');
        setStatus('error');
        stopMicrophoneAndAudio();
        // Close session if it was already opened before the error
        if (sessionRef.current) {
          try { await sessionRef.current.close(); } catch { /* ignore */ }
          sessionRef.current = null;
        }
      }
    },
    [playAudioChunk, startMicrophone, stopMicrophoneAndAudio, stopAudioPlayback]
  );

  const endSession = useCallback(async () => {
    erroredRef.current = false;
    if (sessionRef.current) {
      try {
        await sessionRef.current.close();
      } catch {
        // Session may already be closed server-side; safe to ignore
      }
      sessionRef.current = null;
    }
    stopMicrophoneAndAudio();
    setStatus('idle');
    setErrorMessage(null);
  }, [stopMicrophoneAndAudio]);

  return { status, errorMessage, isInterrupted, startSession, endSession };
}
