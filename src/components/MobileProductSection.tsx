import type { Product } from '@/types';
import MobileProductCard from './MobileProductCard';

interface MobileProductSectionProps {
  title: string;
  products: Product[];
}

export default function MobileProductSection({ title, products }: MobileProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby={`section-${title}`} className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-end">
        <h2
          id={`section-${title}`}
          className="text-[20px] font-bold text-[var(--color-primary)] leading-7"
        >
          {title}
        </h2>
        <button className="text-[12px] font-bold text-[var(--color-primary-container)] flex items-center">
          See All
          <span className="material-symbols-outlined text-[16px] ml-0.5">chevron_right</span>
        </button>
      </div>

      {/* 2-column product grid */}
      <div className="grid grid-cols-2 gap-2">
        {products.map((product) => (
          <MobileProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
