'use client';

import React from 'react';
import type { LiveSessionStatus } from '@/hooks/useLiveVoiceSession';

interface LiveVoiceOverlayProps {
  status: LiveSessionStatus;
  errorMessage: string | null;
  isInterrupted: boolean;
  onEnd: () => void;
}

export default function LiveVoiceOverlay({
  status,
  errorMessage,
  isInterrupted,
  onEnd,
}: LiveVoiceOverlayProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-white p-8">
      {/* Pulsing mic visual */}
      <div className="relative flex items-center justify-center">
        {status === 'active' && (
          <>
            <span className="absolute inline-flex h-20 w-20 rounded-full bg-[var(--color-primary)] opacity-20 animate-ping" />
            <span className="absolute inline-flex h-28 w-28 rounded-full bg-[var(--color-primary)] opacity-10 animate-ping [animation-delay:0.3s]" />
          </>
        )}
        <div
          className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full text-white shadow-lg transition-colors ${
            status === 'active'
              ? 'bg-[var(--color-primary)]'
              : status === 'connecting'
              ? 'bg-yellow-500'
              : status === 'error'
              ? 'bg-red-500'
              : 'bg-gray-400'
          }`}
        >
          <span className="material-symbols-outlined text-3xl">
            {status === 'error' ? 'error' : 'mic'}
          </span>
        </div>
      </div>

      {/* Status label */}
      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-[var(--color-on-surface)]">
          {status === 'connecting' && 'Connecting…'}
          {status === 'active' && 'Live Voice Session Active'}
          {status === 'error' && 'Connection Error'}
          {status === 'idle' && 'Session Ended'}
        </p>
        {status === 'active' && (
          <p className="text-sm text-[var(--color-outline)]">
            {isInterrupted ? (
              <span className="text-[var(--color-primary)] font-medium animate-pulse">
                Listening…
              </span>
            ) : (
              'Speak naturally — the assistant is listening'
            )}
          </p>
        )}
        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}
      </div>

      {/* Action buttons */}
      {(status === 'active' || status === 'connecting') && (
        <button
          type="button"
          onClick={onEnd}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-full transition-colors shadow"
        >
          <span className="material-symbols-outlined text-base">call_end</span>
          End Session
        </button>
      )}

      {status === 'error' && (
        <button
          type="button"
          onClick={onEnd}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
          Dismiss
        </button>
      )}

      <p className="text-[10px] text-[var(--color-outline)] mt-auto">
        Powered by Gemini Live
      </p>
    </div>
  );
}
