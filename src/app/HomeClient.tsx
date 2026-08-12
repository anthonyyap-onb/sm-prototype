'use client';

import { useMemo, useState } from 'react';
import type { Store, StoreProducts } from '@/types';
import TopNavBar from '@/components/TopNavBar';
import SideNavBar from '@/components/SideNavBar';
import ProductGrid from '@/components/ProductGrid';
import ChatModal from '@/components/ChatModal';
import ChatFAB from '@/components/ChatFAB';


interface HomeClientProps {
  stores: Store[];
  allStoreProducts: StoreProducts[];
}

export default function HomeClient({ stores, allStoreProducts }: HomeClientProps) {
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const selectedStore = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId);
  }, [stores, selectedStoreId]);

  const currentInventory = useMemo(() => {
    const storeRecord = allStoreProducts.find((p) => p.storeId === selectedStoreId);
    if (!storeRecord) return [];
    return [
      ...storeRecord.featuredProducts,
      ...storeRecord.priceDrop,
      ...storeRecord.freshMeatAndSeafood,
      ...storeRecord.pantry,
    ];
  }, [allStoreProducts, selectedStoreId]);

  const storeData = allStoreProducts.find((sp) => sp.storeId === selectedStoreId)
    ?? allStoreProducts[0];

  return (
    <div className="flex flex-col min-h-screen">
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
        </main>
      </div>

      <ChatFAB onClick={() => setIsChatOpen((v) => !v)} isOpen={isChatOpen} />
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        selectedLocation={selectedStore?.name + " " + selectedStore?.city} 
        inventoryData={currentInventory}
        onStoreChange={setSelectedStoreId}
        storesData={stores}
      />
    </div>
  );
}
