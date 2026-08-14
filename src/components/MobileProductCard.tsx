'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface MobileProductCardProps {
  product: Product;
}

export default function MobileProductCard({ product }: MobileProductCardProps) {
  const { name, imageUrl, weight, price, originalPrice, discountPercent } = product;
  const isOnSale = Boolean(discountPercent && originalPrice);

  const { items, addToCart, incrementItem, decrementItem } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  return (
    <article className="bg-white border border-[var(--color-border-subtle)] rounded-lg flex flex-col overflow-hidden relative">
      {/* Sale badge */}
      {isOnSale && (
        <div className="absolute top-2 left-2 z-10 bg-[var(--color-promo-orange)] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          Sale
        </div>
      )}

      {/* Square image */}
      <div className="aspect-square bg-[var(--color-surface-container-low)] relative w-full border-b border-[var(--color-border-subtle)]">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover mix-blend-multiply"
          sizes="(max-width: 1024px) 50vw"
        />
      </div>

      {/* Card body */}
      <div className="p-2 flex flex-col flex-1 justify-between gap-1">
        {/* Name + weight */}
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[14px] leading-snug text-[var(--color-on-surface)] line-clamp-2">
            {name}
          </h3>
          <span className="text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider">
            {weight}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-dashed border-[var(--color-border-subtle)]">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-bold text-[var(--color-primary)] leading-6">
              ₱{price.toFixed(2)}
            </span>
            {isOnSale && originalPrice && (
              <span className="text-[12px] text-[var(--color-outline)] line-through">
                ₱{originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {quantity === 0 ? (
            <button
              onClick={() => addToCart(product)}
              aria-label={`Add ${name} to cart`}
              className="bg-[var(--color-secondary-container)] hover:bg-[#ebd55b] text-[var(--color-primary)] w-full py-1.5 rounded font-bold text-[12px] flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              Add
            </button>
          ) : (
            <div className="flex items-center justify-between bg-[var(--color-primary)] rounded px-1 h-8">
              <button
                onClick={() => decrementItem(product.id)}
                aria-label={`Decrease quantity of ${name}`}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-[var(--color-primary-container)] rounded transition-colors"
              >
                <span className="material-symbols-outlined text-base">remove</span>
              </button>
              <span className="text-white font-bold text-sm">{quantity}</span>
              <button
                onClick={() => incrementItem(product.id)}
                aria-label={`Increase quantity of ${name}`}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-[var(--color-primary-container)] rounded transition-colors"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
