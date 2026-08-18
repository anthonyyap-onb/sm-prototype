'use client';

import { useEffect, useMemo } from 'react';
import type { Store, StoreProducts } from '@/types';
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';
import ProductGrid from '@/components/ProductGrid';
import { useStore } from '@/context/StoreContext';
import { getStoreInventory } from '@/lib/inventory/storeInventory';
import MobileHomeLayout from '@/components/MobileHomeLayout';
import { useLiveVoice } from '@/context/LiveVoiceContext';

interface HomeClientProps {
  stores: Store[];
  allStoreProducts: StoreProducts[];
}

function mergeAllProducts(allStoreProducts: StoreProducts[]): StoreProducts {
  const seen = new Set<string>();
  const merge = (arr: ReturnType<typeof allStoreProducts[0]['featuredProducts']['slice']>) =>
    arr.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  return {
    storeId: '',
    featuredProducts: merge(allStoreProducts.flatMap((sp) => sp.featuredProducts)),
    priceDrop: merge(allStoreProducts.flatMap((sp) => sp.priceDrop)),
    freshMeatAndSeafood: merge(allStoreProducts.flatMap((sp) => sp.freshMeatAndSeafood)),
    pantry: merge(allStoreProducts.flatMap((sp) => sp.pantry)),
    freshProduce: merge(allStoreProducts.flatMap((sp) => sp.freshProduce)),
  };
}

export default function HomeClient({ stores, allStoreProducts }: HomeClientProps) {
  const { selectedStoreId, setSelectedStoreId } = useStore();
  const { setChatContext, isChatOpen } = useLiveVoice();

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId),
    [stores, selectedStoreId]
  );

  const currentInventory = useMemo(() => {
    if (!selectedStoreId) {
      return allStoreProducts.flatMap((sp) => [
        ...sp.featuredProducts,
        ...sp.priceDrop,
        ...sp.freshMeatAndSeafood,
        ...sp.pantry,
        ...sp.freshProduce,
      ]);
    }
    return getStoreInventory(allStoreProducts, selectedStoreId);
  }, [allStoreProducts, selectedStoreId]);

  const storeData = selectedStoreId
    ? (allStoreProducts.find((sp) => sp.storeId === selectedStoreId) ?? mergeAllProducts(allStoreProducts))
    : mergeAllProducts(allStoreProducts);

  useEffect(() => {
    setChatContext({
      selectedLocation: selectedStore ? `${selectedStore.name} ${selectedStore.city}` : undefined,
      inventoryData: currentInventory,
      onStoreChange: setSelectedStoreId,
      storesData: stores,
      pageContext: 'shopping',
    });
  }, [selectedStore, currentInventory, stores, setSelectedStoreId, setChatContext]);

  return (
    <>
      {/* Mobile / Tablet layout — shown below lg (1024px) */}
      <div className="lg:hidden">
        <MobileHomeLayout storeData={storeData} isChatOpen={isChatOpen} />
      </div>

      {/* Desktop layout — shown at lg (1024px) and above */}
      <div className="hidden lg:flex flex-col min-h-screen">
        <TopNavBar
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
        />

        <div className="flex flex-1 overflow-hidden">
          <SideNavBar />

          {/* Main content — blurs when chat is open */}
          <main
            className={`flex-1 md:ml-64 p-10 overflow-y-auto bg-[var(--color-surface-bright)] transition-all duration-300 ${
              isChatOpen ? 'blur-sm pointer-events-none select-none' : ''
            }`}
          >
            <ProductGrid
              title="Featured Products"
              products={storeData.featuredProducts}
              icon="star"
              viewAllHref="#"
            />
            <ProductGrid
              title="SM Price Drop"
              products={storeData.priceDrop}
              icon="sell"
              viewAllHref="#"
            />
            <ProductGrid
              title="Fresh Meat and Seafood"
              products={storeData.freshMeatAndSeafood}
              icon="restaurant"
              viewAllHref="#"
            />
            <ProductGrid
              title="Pantry"
              products={storeData.pantry}
              icon="shopping_basket"
              viewAllHref="#"
            />
            <ProductGrid
              title="Fresh Produce"
              products={storeData.freshProduce}
              icon="eco"
              viewAllHref="#"
            />
          </main>
        </div>
      </div>

    </>
  );
}
