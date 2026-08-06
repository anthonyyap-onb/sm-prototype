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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
