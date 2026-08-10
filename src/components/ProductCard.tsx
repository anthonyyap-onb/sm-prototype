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
    <div className="bg-white border border-[var(--color-border-subtle)] rounded-lg p-4 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square mb-4 relative bg-[var(--color-surface-container-low)] rounded p-2">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain p-2"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex gap-2 mb-2 flex-wrap">
          <span className="bg-[var(--color-primary-fixed)] text-[var(--color-primary)] px-2 py-0.5 rounded text-[10px] font-bold">
            {weight}
          </span>
          {isOnSale && (
            <span className="bg-[var(--color-promo-orange)] text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm text-[var(--color-on-surface)] font-semibold line-clamp-2 mb-2 flex-1 min-h-[40px]">
          {name}
        </h3>

        {/* Price */}
        <div className="mb-4 flex items-center gap-2">
          <span className={`text-lg font-bold ${isOnSale ? 'text-[var(--color-promo-orange)]' : 'text-[var(--color-on-surface)]'}`}>
            ₱{price.toFixed(2)}
          </span>
          {isOnSale && originalPrice && (
            <span className="text-xs text-[var(--color-on-surface-variant)] line-through">
              ₱{originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {quantity === 0 ? (
            <button
              onClick={() => addToCart(product)}
              className="flex-1 bg-[var(--color-primary)] text-white rounded font-bold text-xs py-2 hover:bg-[var(--color-primary-container)] transition-colors"
              aria-label={`Add ${name} to cart`}
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-between bg-[var(--color-primary)] rounded overflow-hidden">
              <button
                onClick={() => decrementItem(product.id)}
                className="w-9 h-9 flex items-center justify-center text-white hover:bg-[var(--color-primary-container)] transition-colors"
                aria-label={`Decrease quantity of ${name}`}
              >
                <span className="material-symbols-outlined text-base">remove</span>
              </button>
              <span className="text-white font-bold text-sm">{quantity}</span>
              <button
                onClick={() => incrementItem(product.id)}
                className="w-9 h-9 flex items-center justify-center text-white hover:bg-[var(--color-primary-container)] transition-colors"
                aria-label={`Increase quantity of ${name}`}
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>
          )}
          <button
            className="w-10 h-10 border border-[var(--color-border-subtle)] rounded flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-colors"
            aria-label={`Add ${name} to favourites`}
          >
            <span className="material-symbols-outlined text-xl">favorite</span>
          </button>
        </div>
      </div>
    </div>
  );
}
