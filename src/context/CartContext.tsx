'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types';
import {
  readStoredCart,
  selectHydratedCartItems,
  shouldPersistHydratedState,
  writeStoredCart,
} from '@/lib/storage/commerceStorage';

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  isHydrated: boolean;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const isHydratedRef = useRef(false);
  const hasPreHydrationLocalMutation = useRef(false);

  useEffect(() => {
    const restoredItems = readStoredCart();
    queueMicrotask(() => {
      setItems((currentItems) =>
        selectHydratedCartItems(
          currentItems,
          restoredItems,
          hasPreHydrationLocalMutation.current
        )
      );
      isHydratedRef.current = true;
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!shouldPersistHydratedState(isHydrated)) return;
    writeStoredCart(items);
  }, [isHydrated, items]);

  const addToCart = useCallback((product: Product) => {
    if (!isHydratedRef.current) hasPreHydrationLocalMutation.current = true;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const incrementItem = useCallback((productId: string) => {
    if (!isHydratedRef.current) hasPreHydrationLocalMutation.current = true;
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }, []);

  const decrementItem = useCallback((productId: string) => {
    if (!isHydratedRef.current) hasPreHydrationLocalMutation.current = true;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    if (!isHydratedRef.current) hasPreHydrationLocalMutation.current = true;
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    if (!isHydratedRef.current) hasPreHydrationLocalMutation.current = true;
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, incrementItem, decrementItem, removeItem, clearCart, isHydrated, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
