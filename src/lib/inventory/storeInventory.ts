import type { Product, StoreProducts } from '../../types';

export function getStoreInventory(
  allStoreProducts: StoreProducts[],
  storeId: string
): Product[] {
  const store = allStoreProducts.find((record) => record.storeId === storeId);
  if (!store) return [];
  return [
    ...store.featuredProducts,
    ...store.priceDrop,
    ...store.freshMeatAndSeafood,
    ...store.pantry,
    ...store.freshProduce,
  ];
}
