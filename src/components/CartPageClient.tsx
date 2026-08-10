'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import type { Store } from '@/types';
import TopNavBar from './TopNavBar';
import SideNavBar from './SideNavBar';

interface CartPageClientProps {
  stores: Store[];
}

export default function CartPageClient({ stores }: CartPageClientProps) {
  const { items, incrementItem, decrementItem, removeItem, clearCart, totalPrice } = useCart();

  const defaultStoreId = stores[0]?.id ?? '';

  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar
        stores={stores}
        selectedStoreId={defaultStoreId}
        onStoreChange={() => {}}
      />

      <div className="flex flex-1 overflow-hidden">
        <SideNavBar />

        <main className="flex-1 md:ml-64 p-6 lg:p-8 overflow-y-auto bg-[var(--color-surface-bright)]">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-6">Cart</h1>

            {items.length === 0 ? (
              <div className="bg-white rounded-xl border border-[var(--color-border-subtle)] p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-[var(--color-on-surface-variant)] mb-4 block">
                  shopping_cart
                </span>
                <p className="text-[var(--color-on-surface-variant)] text-lg">Your cart is empty.</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Cart Items */}
                <div className="flex-1 w-full">
                  <div className="bg-white rounded-xl border border-[var(--color-border-subtle)] p-4 sm:p-6 flex flex-col gap-6">
                    {/* Clear cart button */}
                    <div className="flex justify-end border-b border-[var(--color-border-subtle)] pb-4">
                      <button
                        onClick={clearCart}
                        title="Clear Cart"
                        className="text-[var(--color-on-surface-variant)] hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined">delete_sweep</span>
                      </button>
                    </div>

                    {/* Item rows */}
                    {items.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex flex-col sm:flex-row gap-4 py-4 border-b border-[var(--color-border-subtle)] last:border-0"
                      >
                        {/* Product image */}
                        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-white rounded-md flex items-center justify-center p-2 border border-[var(--color-border-subtle)] relative">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-contain p-2"
                            sizes="128px"
                          />
                        </div>

                        {/* Product info */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="font-bold text-sm sm:text-base leading-tight">
                                {product.name}
                              </h3>
                              <p className="text-xs text-green-600 mt-1 font-medium">In Stock</p>
                            </div>
                            <span className="font-bold text-lg whitespace-nowrap">
                              ₱{product.price.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity controls */}
                            <div className="flex items-center bg-[var(--color-surface-container-low)] rounded-md border border-[var(--color-border-subtle)] overflow-hidden">
                              <button
                                onClick={() => decrementItem(product.id)}
                                disabled={quantity <= 1}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Decrease quantity"
                              >
                                <span className="material-symbols-outlined text-base">remove</span>
                              </button>
                              <span className="w-8 sm:w-10 text-center font-medium text-sm">
                                {quantity}
                              </span>
                              <button
                                onClick={() => incrementItem(product.id)}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <span className="material-symbols-outlined text-base">add</span>
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => removeItem(product.id)}
                              title="Remove item"
                              className="w-10 h-10 rounded-full border border-[var(--color-border-subtle)] flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order summary */}
                <div className="w-full lg:w-80 shrink-0">
                  <div className="bg-white rounded-xl border border-[var(--color-border-subtle)] p-6 sticky top-4">
                    <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Order details</h2>

                    <div className="space-y-4 text-sm mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--color-on-surface-variant)]">Item total</span>
                        <span className="font-medium">₱{totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-[var(--color-border-subtle)] pt-4 flex justify-between items-end">
                        <div>
                          <span className="text-lg font-bold text-[var(--color-primary)] block">Subtotal</span>
                          <span className="text-xs text-[var(--color-on-surface-variant)]">12% VAT included</span>
                        </div>
                        <span className="text-lg font-bold text-[var(--color-primary)]">
                          ₱{totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-on-surface-variant)] mb-4 text-center">
                      Vouchers and Final Total on Checkout
                    </p>

                    <button
                      disabled
                      className="w-full bg-[var(--color-primary)] text-white font-bold py-3 px-4 rounded-md text-lg shadow-sm opacity-60 cursor-not-allowed"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
