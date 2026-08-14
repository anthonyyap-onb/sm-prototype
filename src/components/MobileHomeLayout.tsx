'use client';

import { useState } from 'react';
import type { Product, StoreProducts } from '@/types';
import MobileTopAppBar from './MobileTopAppBar';
import BottomNavBar from './BottomNavBar';
import MobileCategoryPills, { type CategoryId } from './MobileCategoryPills';
import MobileProductSection from './MobileProductSection';

interface MobileHomeLayoutProps {
  storeData: StoreProducts;
  isChatOpen?: boolean;
}

const SECTION_MAP: Record<CategoryId, { title: string; key: keyof StoreProducts }> = {
  freshMeatAndSeafood: { title: 'Fresh Meat & Seafood', key: 'freshMeatAndSeafood' },
  freshProduce:        { title: 'Fresh Produce',        key: 'freshProduce' },
  pantry:              { title: 'Pantry Staples',       key: 'pantry' },
  featuredProducts:    { title: 'Featured Products',    key: 'featuredProducts' },
  priceDrop:           { title: 'SM Price Drop',        key: 'priceDrop' },
};

export default function MobileHomeLayout({ storeData, isChatOpen = false }: MobileHomeLayoutProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('freshMeatAndSeafood');

  const { title, key } = SECTION_MAP[activeCategory];
  const products = storeData[key] as Product[];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)]">
      <MobileTopAppBar />

      <main className={`flex-1 flex flex-col px-4 pt-20 pb-24 gap-4 overflow-y-auto transition-all duration-300 ${isChatOpen ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <MobileCategoryPills
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <MobileProductSection title={title} products={products} />
      </main>

      <BottomNavBar />
    </div>
  );
}
