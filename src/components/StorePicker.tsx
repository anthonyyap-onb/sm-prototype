'use client';

import { useEffect, useRef } from 'react';
import type { Store } from '@/types';

interface StorePickerProps {
  stores: Store[];
  selectedStoreId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function StorePicker({ stores, selectedStoreId, onSelect, onClose }: StorePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      
      // Check if the click is inside the dropdown
      const isInsideDropdown = ref.current?.contains(target);
      
      // Check if the click is on the trigger button
      const triggerButton = document.getElementById('store-picker-trigger');
      const isOnTrigger = triggerButton?.contains(target);

      // Only close if the click is strictly outside both
      if (!isInsideDropdown && !isOnTrigger) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-[var(--color-border-subtle)] z-50 min-w-[220px] overflow-hidden"
      role="listbox"
      aria-label="Select store branch"
    >
      {stores.map((store) => (
        <button
          key={store.id}
          role="option"
          aria-selected={store.id === selectedStoreId}
          onClick={() => { onSelect(store.id); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-container-high)] transition-colors ${
            store.id === selectedStoreId
              ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)] font-semibold'
              : 'text-[var(--color-on-surface)]'
          }`}
        >
          <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">location_on</span>
          <div>
            <div className="text-sm font-semibold leading-tight">{store.name}</div>
            <div className="text-xs text-[var(--color-on-surface-variant)] leading-tight">{store.city}</div>
          </div>
          {store.id === selectedStoreId && (
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base ml-auto">check</span>
          )}
        </button>
      ))}
    </div>
  );
}
