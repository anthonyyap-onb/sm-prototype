// Server Component
import type { Product } from '@/types';
import { useRef } from 'react';
import ProductCard from './ProductCard';

interface ProductGridProps {
  title: string;
  products: Product[];
  sectionClassName?: string;
  titleClassName?: string;
  icon?: string;
  viewAllHref?: string;
}

export default function ProductGrid({
  title,
  products,
  sectionClassName = '',
  titleClassName = 'text-[var(--color-primary)]',
  icon,
  viewAllHref,
}: ProductGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll function for the left/right buttons
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // Scrolls by exactly the width of the visible container
      const scrollAmount = current.clientWidth; 
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={`mb-16 ${sectionClassName}`}>
      {/* Section header */}
      <div className="flex items-end justify-between mb-8 border-b border-[var(--color-border-subtle)] pb-4">
        <h2 className={`text-3xl font-bold flex items-center gap-2 ${titleClassName}`}>
          {icon && (
            <span className="material-symbols-outlined text-3xl">{icon}</span>
          )}
          {title}
        </h2>

        {/* Header Actions Container */}
        <div className="flex items-center gap-6">
          {/* Optional: Scroll Controls (Hidden on mobile where swiping is natural) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 flex items-center justify-center rounded-full border border-[var(--color-border-subtle)] hover:bg-gray-100 transition-colors"
              aria-label="Scroll left"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 flex items-center justify-center rounded-full border border-[var(--color-border-subtle)] hover:bg-gray-100 transition-colors"
              aria-label="Scroll right"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          {viewAllHref && (
            <a
              href={viewAllHref}
              className="text-[var(--color-primary)] hover:text-[var(--color-primary-container)] font-bold text-xs uppercase flex items-center gap-1 group"
            >
              View All
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                chevron_right
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Product Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth
                   /* Custom Scrollbar Styling (Tailwind Arbitrary Variants) */
                   [&::-webkit-scrollbar]:h-2
                   [&::-webkit-scrollbar-track]:bg-gray-100
                   [&::-webkit-scrollbar-track]:rounded-full
                   [&::-webkit-scrollbar-thumb]:bg-gray-300
                   [&::-webkit-scrollbar-thumb]:rounded-full
                   hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
      >
        {products.map((product) => (
          <div
            key={product.id}
            // Math applied here accounts for the 24px (1.5rem) gap to show exactly 1, 2, 3, or 4 items per screen size
            className="w-[85vw] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] flex-none snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
