'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import MobileTopAppBar from './MobileTopAppBar';

export default function MobileCartView() {
  const { items, incrementItem, decrementItem, totalPrice } = useCart();
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface)]">
      <MobileTopAppBar />

      {items.length === 0 ? (
        <main className="flex-1 flex flex-col items-center justify-center gap-4 pt-16 px-4">
          <span className="material-symbols-outlined text-6xl text-[var(--color-on-surface-variant)]">
            shopping_cart
          </span>
          <p className="text-[var(--color-on-surface-variant)] text-base">Your cart is empty.</p>
          <Link
            href="/"
            className="mt-2 bg-[var(--color-primary)] text-white font-bold px-6 py-3 rounded-md text-sm hover:bg-[var(--color-primary-container)] transition-colors"
          >
            Continue Shopping
          </Link>
        </main>
      ) : (
        <>
          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto pt-20 pb-52 px-4 flex flex-col gap-3">
            {/* Page title */}
            <div className="flex justify-between items-end pb-2 border-b border-[var(--color-border-subtle)]">
              <h1 className="text-[20px] font-bold text-[var(--color-primary)] leading-7">
                Your Cart
              </h1>
              <span className="text-[14px] text-[var(--color-on-surface-variant)]">
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Cart items */}
            <div className="flex flex-col gap-3">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-[var(--color-border-subtle)] p-3 flex gap-3 shadow-sm"
                >
                  {/* Product image */}
                  <div className="w-20 h-20 shrink-0 border border-[var(--color-border-subtle)] rounded-md overflow-hidden bg-[var(--color-surface)] flex items-center justify-center relative">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-[var(--color-on-surface)] line-clamp-2 leading-tight mb-1">
                        {product.name}
                      </h3>
                      <p className="text-[12px] text-[var(--color-primary-container)] flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        In Stock
                      </p>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      {/* Price */}
                      <span className="text-[18px] font-bold text-[var(--color-primary)] leading-6">
                        ₱{product.price.toFixed(2)}
                      </span>

                      {/* Quantity stepper */}
                      <div className="flex items-center border border-[var(--color-border-subtle)] rounded-md h-8">
                        <button
                          onClick={() => decrementItem(product.id)}
                          aria-label={`Decrease quantity of ${product.name}`}
                          className="w-8 h-full flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors rounded-l-md"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="w-8 h-full flex items-center justify-center text-[14px] text-[var(--color-on-surface)] font-medium border-x border-[var(--color-border-subtle)]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => incrementItem(product.id)}
                          aria-label={`Increase quantity of ${product.name}`}
                          className="w-8 h-full flex items-center justify-center text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors rounded-r-md"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Sticky bottom summary + checkout */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[var(--color-border-subtle)] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40 px-4 pt-3 pb-6 flex flex-col gap-3">
            {/* Order summary rows */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[14px] text-[var(--color-on-surface-variant)]">
                <span>Subtotal ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})</span>
                <span>₱{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[14px] text-[var(--color-on-surface-variant)]">
                <span>Delivery Fee</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between items-center mt-1 pt-2 border-t border-[var(--color-border-subtle)]">
                <div className="flex flex-col">
                  <span className="text-[20px] font-bold text-[var(--color-primary)] leading-7">Total</span>
                  <span className="text-[10px] text-[var(--color-on-surface-variant)]">Includes 12% VAT</span>
                </div>
                <span className="text-[24px] font-bold text-[var(--color-primary)] leading-8">
                  ₱{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <Link
              href="/checkout"
              className="w-full bg-[var(--color-secondary-container)] hover:bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-container)] h-12 rounded-md flex items-center justify-center font-bold text-[20px] shadow-sm transition-colors"
            >
              Checkout
              <span className="material-symbols-outlined text-[20px] ml-2">arrow_forward</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
