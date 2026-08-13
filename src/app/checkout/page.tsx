import CheckoutPageClient from '@/components/CheckoutPageClient';
import productsData from '@/data/products.json';
import storesData from '@/data/stores.json';
import type { Store, StoreProducts } from '@/types';

export default function CheckoutPage() {
  const stores = storesData as Store[];
  const allStoreProducts = productsData as StoreProducts[];

  return <CheckoutPageClient stores={stores} allStoreProducts={allStoreProducts} />;
}
