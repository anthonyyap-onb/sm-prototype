'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useLiveVoiceSession, type UseLiveVoiceSessionReturn } from '@/hooks/useLiveVoiceSession';
import type { Product, Store } from '@/types';

export interface ChatContextData {
  selectedLocation?: string;
  inventoryData: Product[];
  storesData?: Store[];
  pageContext?: 'shopping' | 'checkout';
  onStoreChange?: (storeId: string) => void;
}

interface LiveVoiceContextValue extends UseLiveVoiceSessionReturn {
  chatContextData: ChatContextData;
  setChatContext: (data: ChatContextData) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const LiveVoiceContext = createContext<LiveVoiceContextValue | null>(null);

export function LiveVoiceProvider({ children }: { children: ReactNode }) {
  const session = useLiveVoiceSession();
  const [chatContextData, setChatContextData] = useState<ChatContextData>({
    inventoryData: [],
  });
  const [isChatOpen, setIsChatOpen] = useState(false);

  const setChatContext = useCallback((data: ChatContextData) => {
    setChatContextData(data);
  }, []);

  return (
    <LiveVoiceContext.Provider
      value={{ ...session, chatContextData, setChatContext, isChatOpen, setIsChatOpen }}
    >
      {children}
    </LiveVoiceContext.Provider>
  );
}

export function useLiveVoice(): LiveVoiceContextValue {
  const ctx = useContext(LiveVoiceContext);
  if (!ctx) throw new Error('useLiveVoice must be used inside LiveVoiceProvider');
  return ctx;
}
