export interface Store {
  id: string;
  name: string;
  city: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  weight: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
}

export interface StoreProducts {
  storeId: string;
  featuredProducts: Product[];
  priceDrop: Product[];
  freshMeatAndSeafood: Product[];
  pantry: Product[];
  freshProduce: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PromoDiscount =
  | { type: 'fixed'; amount: number }
  | { type: 'percentage'; percent: number; maxDiscount?: number }
  | { type: 'free_delivery' };

export interface PromoEligibility {
  minSubtotal?: number;
  requiredProductIds?: string[];
  minProductQuantity?: number;
}

export interface Promo {
  id: string;
  code: string;
  title: string;
  description: string;
  terms: string;
  validFrom: string;
  validUntil: string;
  stackable: boolean;
  isMock: true;
  sourceLabel?: string;
  sourceUrl?: string;
  discount: PromoDiscount;
  eligibility: PromoEligibility;
}

export interface PromoEvaluation {
  promo: Promo;
  eligible: boolean;
  reason: string;
  estimatedSavings: number;
  applied: boolean;
}

export interface AppliedPromo {
  id: string;
  code: string;
  title: string;
  savings: number;
}

export interface PromoRejection { id: string; reason: string }

export interface CheckoutTotals {
  subtotal: number;
  deliveryFee: number;
  merchandiseDiscount: number;
  deliveryDiscount: number;
  totalSavings: number;
  finalTotal: number;
}

export interface PromoApplicationResult {
  appliedIds: string[];
  applied: AppliedPromo[];
  rejected: PromoRejection[];
  totals: CheckoutTotals;
}

export interface IngredientSuggestion {
  number: number;
  name: string;
  matchedProductId?: string; // product ID if matched to inventory
  matchedProductName?: string;
  inStock: boolean;
}
