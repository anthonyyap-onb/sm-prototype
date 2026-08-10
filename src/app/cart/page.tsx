import storesData from '@/data/stores.json';
import type { Store } from '@/types';
import CartPageClient from '@/components/CartPageClient';

export default function CartPage() {
  const stores = storesData as Store[];
  return <CartPageClient stores={stores} />;
}
