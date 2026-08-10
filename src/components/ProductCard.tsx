'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { name, imageUrl, weight, price, originalPrice, discountPercent } = product;
  const isOnSale = Boolean(discountPercent && originalPrice);

  const { items, addToCart, incrementItem, decrementItem } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  return (
    <div className="group bg-white border border-[var(--color-border-subtle)] rounded-lg overflow-hidden flex flex-col relative hover:shadow-md hover:border-[var(--color-primary)] transition-all duration-200">
      {/* Price Drop badge */}
      {isOnSale && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-[var(--color-promo-orange)] text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
            Price Drop
          </span>
        </div>
      )}

      {/* Image zone */}
      <div className="p-6 bg-[var(--color-surface-bright)] flex items-center justify-center h-48 border-b border-[var(--color-border-subtle)]">
        <Image
          src={imageUrl}
          alt={name}
          width={160}
          height={160}
          className="object-contain h-full w-auto group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Brand */}
        <div className="text-xs text-[var(--color-on-surface-variant)] mb-1 uppercase tracking-wider font-semibold">
          {weight}
        </div>

        {/* Name */}
        <h3 className="text-base text-[var(--color-on-surface)] leading-snug mb-2 line-clamp-2">
          {name}
        </h3>

        {/* Price + CTA */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            {isOnSale && originalPrice && (
              <span className="text-xs text-[var(--color-outline)] line-through">
                ₱{originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-bold text-[var(--color-primary)]">
              ₱{price.toFixed(2)}
            </span>
          </div>

          {quantity === 0 ? (
            <button
              onClick={() => addToCart(product)}
              className="w-10 h-10 rounded-full bg-[var(--color-secondary-container)] hover:bg-[var(--color-secondary-fixed)] flex items-center justify-center text-[var(--color-primary-container)] transition-colors shadow-sm"
              aria-label={`Add ${name} to cart`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                add_shopping_cart
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-[var(--color-primary)] rounded-full overflow-hidden px-1">
              <button
                onClick={() => decrementItem(product.id)}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-[var(--color-primary-container)] transition-colors rounded-full"
                aria-label={`Decrease quantity of ${name}`}
              >
                <span className="material-symbols-outlined text-base">remove</span>
              </button>
              <span className="text-white font-bold text-sm px-1">{quantity}</span>
              <button
                onClick={() => incrementItem(product.id)}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-[var(--color-primary-container)] transition-colors rounded-full"
                aria-label={`Increase quantity of ${name}`}
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
