'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function BottomNavBar() {
  const { items } = useCart();
  const uniqueItemCount = items.length;

  return (
    <nav className="bg-white fixed bottom-0 w-full z-50 h-16 border-t border-[var(--color-border-subtle)] flex justify-around items-center px-2">
      {/* Home — active */}
      <Link
        href="/"
        className="flex flex-col items-center justify-center text-[var(--color-primary)] bg-[var(--color-primary-fixed)]/30 rounded-full px-4 py-1 hover:bg-[var(--color-surface-container-low)] active:scale-90 transition-all duration-200"
        aria-label="Home"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          home
        </span>
        <span className="text-[12px] font-bold leading-4 mt-0.5">Home</span>
      </Link>

      {/* Categories */}
      <Link
        href="#"
        className="flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] px-4 py-1 rounded-full hover:bg-[var(--color-surface-container-low)] active:scale-90 transition-all duration-200"
        aria-label="Categories"
      >
        <span className="material-symbols-outlined">grid_view</span>
        <span className="text-[12px] font-bold leading-4 mt-0.5">Categories</span>
      </Link>

      {/* Cart */}
      <Link
        href="/cart"
        className="relative flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] px-4 py-1 rounded-full hover:bg-[var(--color-surface-container-low)] active:scale-90 transition-all duration-200"
        aria-label={`Shopping cart, ${uniqueItemCount} unique items`}
      >
        <span className="relative">
          <span className="material-symbols-outlined">shopping_cart</span>
          {uniqueItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
              {uniqueItemCount > 99 ? '99+' : uniqueItemCount}
            </span>
          )}
        </span>
        <span className="text-[12px] font-bold leading-4 mt-0.5">Cart</span>
      </Link>

      {/* Account */}
      <Link
        href="#"
        className="flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] px-4 py-1 rounded-full hover:bg-[var(--color-surface-container-low)] active:scale-90 transition-all duration-200"
        aria-label="Account"
      >
        <span className="material-symbols-outlined">person</span>
        <span className="text-[12px] font-bold leading-4 mt-0.5">Account</span>
      </Link>
    </nav>
  );
}
