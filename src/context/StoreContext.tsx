'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'sm-selected-store';

interface StoreContextValue {
  selectedStoreId: string;
  setSelectedStoreId: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [selectedStoreId, setSelectedStoreIdState] = useState('');

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? '';
    setSelectedStoreIdState(stored);
  }, []);

  const setSelectedStoreId = useCallback((id: string) => {
    setSelectedStoreIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <StoreContext.Provider value={{ selectedStoreId, setSelectedStoreId }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
