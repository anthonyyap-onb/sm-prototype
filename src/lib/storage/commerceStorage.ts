import type { CartItem, Product } from '@/types';

export const CART_STORAGE_KEY = 'sm-cart';
export const PROMO_STORAGE_KEY = 'sm-applied-promos';

const STORAGE_VERSION = 1 as const;

export function shouldPersistHydratedState(isHydrated: boolean): boolean {
  return isHydrated;
}

export function canReconcilePromos(cartHydrated: boolean, promosHydrated: boolean): boolean {
  return cartHydrated && promosHydrated;
}

export function selectHydratedPromoIds(
  currentIds: string[],
  restoredIds: string[],
  hasLocalMutation: boolean
): string[] {
  return hasLocalMutation ? currentIds : restoredIds;
}

export function selectHydratedCartItems(
  currentItems: CartItem[],
  restoredItems: CartItem[],
  hasLocalMutation: boolean
): CartItem[] {
  return hasLocalMutation ? currentItems : restoredItems;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function toCartItem(value: unknown): CartItem | null {
  if (!isRecord(value) || !isRecord(value.product) || !isPositiveInteger(value.quantity)) return null;

  const product = value.product;
  if (!isNonEmptyString(product.id) || !isNonEmptyString(product.name) || typeof product.imageUrl !== 'string' || typeof product.weight !== 'string' || !isValidNumber(product.price)) {
    return null;
  }
  if ((product.originalPrice !== undefined && !isValidNumber(product.originalPrice)) || (product.discountPercent !== undefined && !isValidNumber(product.discountPercent))) {
    return null;
  }

  const snapshot: Product = {
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    weight: product.weight,
    price: product.price,
    ...(product.originalPrice === undefined ? {} : { originalPrice: product.originalPrice }),
    ...(product.discountPercent === undefined ? {} : { discountPercent: product.discountPercent }),
  };
  return { product: snapshot, quantity: value.quantity };
}

function normalizeCart(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];

  const normalized = new Map<string, CartItem>();
  for (const value of items) {
    const item = toCartItem(value);
    if (!item) continue;
    const existing = normalized.get(item.product.id);
    if (existing) {
      const combinedQuantity = existing.quantity + item.quantity;
      if (Number.isSafeInteger(combinedQuantity)) existing.quantity = combinedQuantity;
    }
    else normalized.set(item.product.id, item);
  }
  return [...normalized.values()];
}

function normalizePromoIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const normalized = new Set<string>();
  for (const id of ids) {
    if (isNonEmptyString(id)) normalized.add(id);
  }
  return [...normalized];
}

export function parseStoredCart(value: string | null): CartItem[] {
  if (value === null) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) return [];
    return normalizeCart(parsed.items);
  } catch {
    return [];
  }
}

export function parseStoredPromoIds(value: string | null): string[] {
  if (value === null) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.appliedPromoIds)) return [];
    return normalizePromoIds(parsed.appliedPromoIds);
  } catch {
    return [];
  }
}

function defaultStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readStoredCart(storage = defaultStorage()): CartItem[] {
  if (!storage) return [];
  try {
    return parseStoredCart(storage.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeStoredCart(items: CartItem[], storage = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items: normalizeCart(items) }));
    return true;
  } catch {
    return false;
  }
}

export function readStoredPromoIds(storage = defaultStorage()): string[] {
  if (!storage) return [];
  try {
    return parseStoredPromoIds(storage.getItem(PROMO_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeStoredPromoIds(ids: string[], storage = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PROMO_STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, appliedPromoIds: normalizePromoIds(ids) }));
    return true;
  } catch {
    return false;
  }
}
