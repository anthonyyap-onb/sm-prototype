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
}

export interface CartItem {
  product: Product;
  quantity: number;
}
