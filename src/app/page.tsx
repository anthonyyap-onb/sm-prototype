// Server Component
import type { Store, StoreProducts } from '@/types';
import storesData from '@/data/stores.json';
import productsData from '@/data/products.json';
import HomeClient from './HomeClient';

export default function Home() {
  const stores = storesData as Store[];
  const allStoreProducts = productsData as StoreProducts[];

  return <HomeClient stores={stores} allStoreProducts={allStoreProducts} />;
}
