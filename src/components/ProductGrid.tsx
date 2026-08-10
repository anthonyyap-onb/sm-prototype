// Server Component
import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  title: string;
  products: Product[];
  sectionClassName?: string;
  titleClassName?: string;
}

export default function ProductGrid({
  title,
  products,
  sectionClassName = '',
  titleClassName = 'text-[var(--color-primary)]',
}: ProductGridProps) {
  return (
    <section className={`rounded-lg p-6 relative ${sectionClassName}`}>
      <h2 className={`text-3xl font-bold mb-6 ${titleClassName}`}>{title}</h2>

      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory 
        [&::-webkit-scrollbar]:h-1 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:bg-gray-200 
        [&::-webkit-scrollbar-thumb]:rounded-full 
        hover:[&::-webkit-scrollbar-thumb]:bg-gray-200"
      >
        
        {products.map((product) => (
          <div 
            key={product.id} 
            className="shrink-0 snap-start w-[160px] sm:w-[200px] md:w-[220px] lg:w-[240px]"
          >
            <ProductCard product={product} />
          </div>
        ))}

      </div>
    </section>
  );
}
