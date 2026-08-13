import type {
  AppliedPromo,
  CartItem,
  CheckoutTotals,
  Promo,
  PromoApplicationResult,
  PromoEvaluation,
  PromoRejection,
} from '@/types';

export const DEFAULT_DELIVERY_FEE = 99;

type EvaluationArgs = {
  promos: Promo[];
  items: CartItem[];
  appliedIds: string[];
  deliveryFee?: number;
  now?: Date;
};

type ApplicationArgs = EvaluationArgs & { requestedIds: string[] };

interface EligibilityResult {
  eligible: boolean;
  reason: string;
}

interface DiscountCalculation {
  totals: CheckoutTotals;
  savingsById: Map<string, number>;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getSubtotal(items: CartItem[]): number {
  return roundCurrency(
    items.reduce((total, { product, quantity }) => total + product.price * quantity, 0)
  );
}

function formatCurrency(value: number): string {
  return `₱${roundCurrency(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function calendarDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function getEligibility(promo: Promo, items: CartItem[], now: Date): EligibilityResult {
  if (items.length === 0) {
    return { eligible: false, reason: 'Requires at least one item in the cart.' };
  }

  const today = calendarDate(now);
  if (today < promo.validFrom) {
    return { eligible: false, reason: `Available from ${promo.validFrom}.` };
  }
  if (today > promo.validUntil) {
    return { eligible: false, reason: `Expired on ${promo.validUntil}.` };
  }

  const subtotal = getSubtotal(items);
  if (promo.eligibility.minSubtotal !== undefined && subtotal < promo.eligibility.minSubtotal) {
    return {
      eligible: false,
      reason: `Requires a merchandise subtotal of ${formatCurrency(promo.eligibility.minSubtotal)}.`,
    };
  }

  const { requiredProductIds, minProductQuantity } = promo.eligibility;
  if (requiredProductIds && minProductQuantity !== undefined) {
    const qualifyingQuantity = items.reduce(
      (total, cartItem) =>
        requiredProductIds.includes(cartItem.product.id) ? total + cartItem.quantity : total,
      0
    );
    if (qualifyingQuantity < minProductQuantity) {
      const productLabel = requiredProductIds.join(', ');
      return {
        eligible: false,
        reason: `Requires ${minProductQuantity} units of product ${productLabel}.`,
      };
    }
  }

  return { eligible: true, reason: 'Eligible' };
}

function hasStackingConflict(candidate: Promo, acceptedPromos: Promo[]): boolean {
  return acceptedPromos.some(
    (acceptedPromo) => acceptedPromo.id !== candidate.id && (!candidate.stackable || !acceptedPromo.stackable)
  );
}

function reconcileIds({ promos, items, appliedIds, now = new Date() }: EvaluationArgs): string[] {
  const catalogById = new Map(promos.map((promo) => [promo.id, promo]));
  const acceptedIds: string[] = [];
  const acceptedPromos: Promo[] = [];

  for (const id of appliedIds) {
    if (acceptedIds.includes(id)) continue;
    const promo = catalogById.get(id);
    if (!promo || !getEligibility(promo, items, now).eligible) continue;
    if (hasStackingConflict(promo, acceptedPromos)) continue;
    acceptedIds.push(id);
    acceptedPromos.push(promo);
  }

  return promos.filter((promo) => acceptedIds.includes(promo.id)).map((promo) => promo.id);
}

function calculateDiscounts({
  promos,
  items,
  appliedIds,
  deliveryFee = DEFAULT_DELIVERY_FEE,
  now = new Date(),
}: EvaluationArgs): DiscountCalculation {
  const reconciledIds = reconcileIds({ promos, items, appliedIds, deliveryFee, now });
  const appliedIdSet = new Set(reconciledIds);
  const subtotal = Math.max(0, getSubtotal(items));
  const initialDeliveryFee = Math.max(0, roundCurrency(deliveryFee));
  let remainingMerchandise = subtotal;
  let remainingDelivery = initialDeliveryFee;
  const savingsById = new Map<string, number>();

  const discountPhases: Promo['discount']['type'][] = ['fixed', 'percentage', 'free_delivery'];
  for (const discountType of discountPhases) {
    for (const promo of promos) {
      if (!appliedIdSet.has(promo.id) || promo.discount.type !== discountType) continue;

      let savings = 0;
      if (promo.discount.type === 'fixed') {
        savings = Math.min(remainingMerchandise, Math.max(0, promo.discount.amount));
        remainingMerchandise = roundCurrency(remainingMerchandise - savings);
      } else if (promo.discount.type === 'percentage') {
        const rawSavings = Math.max(0, remainingMerchandise * (promo.discount.percent / 100));
        const cappedSavings = promo.discount.maxDiscount === undefined
          ? rawSavings
          : Math.min(rawSavings, Math.max(0, promo.discount.maxDiscount));
        savings = Math.min(remainingMerchandise, cappedSavings);
        remainingMerchandise = roundCurrency(remainingMerchandise - savings);
      } else {
        savings = remainingDelivery;
        remainingDelivery = 0;
      }
      savingsById.set(promo.id, roundCurrency(savings));
    }
  }

  const merchandiseDiscount = roundCurrency(subtotal - remainingMerchandise);
  const deliveryDiscount = roundCurrency(initialDeliveryFee - remainingDelivery);
  const totalSavings = roundCurrency(merchandiseDiscount + deliveryDiscount);

  return {
    totals: {
      subtotal,
      deliveryFee: initialDeliveryFee,
      merchandiseDiscount,
      deliveryDiscount,
      totalSavings,
      finalTotal: Math.max(0, roundCurrency(subtotal + initialDeliveryFee - totalSavings)),
    },
    savingsById,
  };
}

function getAppliedPromos(
  promos: Promo[],
  appliedIds: string[],
  savingsById: Map<string, number>
): AppliedPromo[] {
  const catalogById = new Map(promos.map((promo) => [promo.id, promo]));
  return appliedIds.flatMap((id) => {
    const promo = catalogById.get(id);
    return promo
      ? [{ id: promo.id, code: promo.code, title: promo.title, savings: savingsById.get(id) ?? 0 }]
      : [];
  });
}

export function evaluatePromos({
  promos,
  items,
  appliedIds,
  deliveryFee = DEFAULT_DELIVERY_FEE,
  now = new Date(),
}: EvaluationArgs): PromoEvaluation[] {
  const reconciledIds = reconcileIds({ promos, items, appliedIds, deliveryFee, now });
  const appliedIdSet = new Set(reconciledIds);
  const currentCalculation = calculateDiscounts({ promos, items, appliedIds: reconciledIds, deliveryFee, now });
  const appliedPromos = promos.filter((promo) => appliedIdSet.has(promo.id));

  return promos.map((promo) => {
    const eligibility = getEligibility(promo, items, now);
    const applied = appliedIdSet.has(promo.id);
    if (!eligibility.eligible) {
      return { promo, ...eligibility, estimatedSavings: 0, applied: false };
    }
    if (!applied && hasStackingConflict(promo, appliedPromos)) {
      return {
        promo,
        eligible: false,
        reason: 'Promotion cannot be combined with other promotions.',
        estimatedSavings: 0,
        applied: false,
      };
    }
    if (applied) {
      return {
        promo,
        ...eligibility,
        estimatedSavings: currentCalculation.savingsById.get(promo.id) ?? 0,
        applied: true,
      };
    }

    const candidateCalculation = calculateDiscounts({
      promos,
      items,
      appliedIds: [...reconciledIds, promo.id],
      deliveryFee,
      now,
    });
    return {
      promo,
      ...eligibility,
      estimatedSavings: candidateCalculation.savingsById.get(promo.id) ?? 0,
      applied: false,
    };
  });
}

export function applyPromoIds({
  promos,
  items,
  appliedIds,
  requestedIds,
  deliveryFee = DEFAULT_DELIVERY_FEE,
  now = new Date(),
}: ApplicationArgs): PromoApplicationResult {
  const catalogById = new Map(promos.map((promo) => [promo.id, promo]));
  const nextAppliedIds = reconcileIds({ promos, items, appliedIds, deliveryFee, now });
  const nextAppliedPromos = nextAppliedIds.flatMap((id) => {
    const promo = catalogById.get(id);
    return promo ? [promo] : [];
  });
  const rejected: PromoRejection[] = [];

  for (const id of [...new Set(requestedIds)]) {
    const promo = catalogById.get(id);
    if (!promo) {
      rejected.push({ id, reason: 'Promotion was not found.' });
      continue;
    }
    if (nextAppliedIds.includes(id)) {
      rejected.push({ id, reason: 'Promotion is already applied.' });
      continue;
    }
    const eligibility = getEligibility(promo, items, now);
    if (!eligibility.eligible) {
      rejected.push({ id, reason: eligibility.reason });
      continue;
    }
    if (hasStackingConflict(promo, nextAppliedPromos)) {
      rejected.push({ id, reason: 'Promotion cannot be combined with other promotions.' });
      continue;
    }
    nextAppliedIds.push(id);
    nextAppliedPromos.push(promo);
  }

  const normalizedAppliedIds = promos
    .filter((promo) => nextAppliedIds.includes(promo.id))
    .map((promo) => promo.id);
  const calculation = calculateDiscounts({
    promos,
    items,
    appliedIds: normalizedAppliedIds,
    deliveryFee,
    now,
  });
  return {
    appliedIds: normalizedAppliedIds,
    applied: getAppliedPromos(promos, normalizedAppliedIds, calculation.savingsById),
    rejected,
    totals: calculation.totals,
  };
}

export function calculateCheckoutTotals(args: EvaluationArgs): CheckoutTotals {
  return calculateDiscounts(args).totals;
}

export function reconcileAppliedPromoIds(args: EvaluationArgs): string[] {
  return reconcileIds(args);
}
