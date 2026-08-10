'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Store } from '@/types';
import StorePicker from './StorePicker';
import { useCart } from '@/context/CartContext';

interface TopNavBarProps {
  stores: Store[];
  selectedStoreId: string;
  onStoreChange: (id: string) => void;
}

export default function TopNavBar({ stores, selectedStoreId, onStoreChange }: TopNavBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? stores[0];
  const { totalItems } = useCart();

  return (
    <header className="bg-[var(--color-primary)] text-[var(--color-on-primary)] sticky top-0 z-50 flex justify-between items-center w-full h-16 px-10 shadow-md border-b border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <a href="#" className="flex items-center" aria-label="SM Markets home">
          <img
            src="https://lh3.googleusercontent.com/aida/AP1WRLugqu8ObLD9oE2v0fclYMM881pGZOE_d9EaFNK9AFi9cilPWcHt2_TL_cgZAZKC49OZZikoN_c29h4VQCRi1FLw3fCyahN76tHNzpfWbTnx2Vow6wyYxNlZ4W6WHOfRDFJfA2fveuTxMw0kukACXkI3EpMGIL3RSDdOcz00B5F7soNloKbDYB8a0DVlBN4DoipEWV_J7nJxZVTc5kbMlSXSuPsc3PULztSWobcx8WeMex1f-xqsI3rKMAk"
            alt="SM MARKETS Logo"
            className="h-8 object-contain"
            referrerPolicy="no-referrer"
          />
        </a>
        

        {/* Store picker */}
        <div className="relative">
          <button
            id="store-picker-trigger"
            onClick={() => setIsPickerOpen((v) => !v)}
            className="flex items-center gap-2 border border-white/30 rounded px-3 py-1.5 hover:bg-[var(--color-primary-container)] transition-colors duration-200"
            aria-haspopup="listbox"
            aria-expanded={isPickerOpen}
          >
            <span className="material-symbols-outlined text-white text-xl">location_on</span>
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-bold text-white leading-tight">{selectedStore.name}</span>
              <span className="text-[10px] text-white/80 leading-tight">{selectedStore.city}</span>
            </div>
            <span className="material-symbols-outlined text-white text-sm ml-1">
              {isPickerOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {isPickerOpen && (
            <StorePicker
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelect={onStoreChange}
              onClose={() => setIsPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-2xl px-6 relative">
        <input
          type="text"
          id="search-input"
          placeholder="Search for products..."
          className="w-full h-10 pl-4 pr-10 rounded text-[var(--color-on-surface)] bg-white border-none focus:ring-2 focus:ring-[var(--color-secondary-container)] text-sm"
        />
        <button
          className="absolute right-8 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
          aria-label="Search"
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          id="login-btn"
          className="flex items-center gap-2 bg-white text-[var(--color-primary)] px-4 py-2 rounded font-bold text-xs hover:bg-[var(--color-surface-container-high)] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">person</span>
          Login or Register
        </button>
        <Link
          href="/cart"
          className="relative hover:bg-[var(--color-primary-container)] p-2 rounded transition-colors duration-200 text-white opacity-90"
          aria-label="Shopping cart"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
