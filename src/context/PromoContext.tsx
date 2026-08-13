'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import promosData from '@/data/promos.json';
import { useCart } from '@/context/CartContext';
import {
  applyPromoIds,
  calculateCheckoutTotals,
  evaluatePromos,
  reconcileAppliedPromoIds,
} from '@/lib/promos/promoEngine';
import {
  canReconcilePromos,
  readStoredPromoIds,
  selectHydratedPromoIds,
  shouldPersistHydratedState,
  writeStoredPromoIds,
} from '@/lib/storage/commerceStorage';
import type {
  AppliedPromo,
  CheckoutTotals,
  Promo,
  PromoApplicationResult,
  PromoEvaluation,
} from '@/types';

interface PromoContextValue {
  promos: Promo[];
  evaluations: PromoEvaluation[];
  appliedPromoIds: string[];
  appliedPromos: AppliedPromo[];
  totals: CheckoutTotals;
  applyPromos: (ids: string[]) => PromoApplicationResult;
  removePromo: (id: string) => void;
}

const promos = promosData as Promo[];
const PromoContext = createContext<PromoContextValue | null>(null);

function haveSameOrderedIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function PromoProvider({ children }: { children: ReactNode }) {
  const { items, isHydrated: cartHydrated } = useCart();
  const [appliedPromoIds, setAppliedPromoIds] = useState<string[]>([]);
  const [promosHydrated, setPromosHydrated] = useState(false);
  const hasPreHydrationLocalMutation = useRef(false);

  useEffect(() => {
    const restoredPromoIds = readStoredPromoIds();
    queueMicrotask(() => {
      setAppliedPromoIds((currentIds) =>
        selectHydratedPromoIds(
          currentIds,
          restoredPromoIds,
          hasPreHydrationLocalMutation.current
        )
      );
      setPromosHydrated(true);
    });
  }, []);

  const evaluations = useMemo(
    () => evaluatePromos({ promos, items, appliedIds: appliedPromoIds }),
    [items, appliedPromoIds]
  );
  const totals = useMemo(
    () => calculateCheckoutTotals({ promos, items, appliedIds: appliedPromoIds }),
    [items, appliedPromoIds]
  );
  const appliedPromos = useMemo(
    () =>
      evaluations
        .filter((evaluation) => evaluation.applied)
        .map(({ promo, estimatedSavings }) => ({
          id: promo.id,
          code: promo.code,
          title: promo.title,
          savings: estimatedSavings,
        })),
    [evaluations]
  );

  useEffect(() => {
    if (!canReconcilePromos(cartHydrated, promosHydrated)) return;

    const reconciledIds = reconcileAppliedPromoIds({ promos, items, appliedIds: appliedPromoIds });
    if (!haveSameOrderedIds(reconciledIds, appliedPromoIds)) {
      queueMicrotask(() => {
        setAppliedPromoIds((currentIds) =>
          !haveSameOrderedIds(currentIds, appliedPromoIds) || haveSameOrderedIds(currentIds, reconciledIds)
            ? currentIds
            : reconciledIds
        );
      });
    }
  }, [items, appliedPromoIds, cartHydrated, promosHydrated]);

  useEffect(() => {
    if (!shouldPersistHydratedState(promosHydrated)) return;
    writeStoredPromoIds(appliedPromoIds);
  }, [appliedPromoIds, promosHydrated]);

  const applyPromos = useCallback(
    (ids: string[]) => {
      if (!promosHydrated) hasPreHydrationLocalMutation.current = true;
      const result = applyPromoIds({
        promos,
        items,
        appliedIds: appliedPromoIds,
        requestedIds: ids,
      });
      setAppliedPromoIds(result.appliedIds);
      return result;
    },
    [items, appliedPromoIds, promosHydrated]
  );

  const removePromo = useCallback((id: string) => {
    if (!promosHydrated) hasPreHydrationLocalMutation.current = true;
    setAppliedPromoIds((currentIds) => currentIds.filter((appliedId) => appliedId !== id));
  }, [promosHydrated]);

  const value = useMemo(
    () => ({
      promos,
      evaluations,
      appliedPromoIds,
      appliedPromos,
      totals,
      applyPromos,
      removePromo,
    }),
    [evaluations, appliedPromoIds, appliedPromos, totals, applyPromos, removePromo]
  );

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function usePromos(): PromoContextValue {
  const context = useContext(PromoContext);
  if (!context) throw new Error('usePromos must be used inside PromoProvider');
  return context;
}
