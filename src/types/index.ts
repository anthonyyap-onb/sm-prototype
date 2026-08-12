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

export interface IngredientSuggestion {
  number: number;
  name: string;
  matchedProductId?: string; // product ID if matched to inventory
  matchedProductName?: string;
  inStock: boolean;
}
