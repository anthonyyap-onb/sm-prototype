'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import { useCart } from '@/context/CartContext';
import { usePromos } from '@/context/PromoContext';
import { useStore } from '@/context/StoreContext';
import { getStoreInventory } from '@/lib/inventory/storeInventory';
import type { Store, StoreProducts } from '@/types';
import MobileCheckoutView from '@/components/MobileCheckoutView';
import { useLiveVoice } from '@/context/LiveVoiceContext';

interface CheckoutPageClientProps {
  stores: Store[];
  allStoreProducts: StoreProducts[];
}

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isSupportedProductImageUrl(imageUrl: string | undefined): imageUrl is string {
  const trimmedUrl = imageUrl?.trim();
  if (!trimmedUrl) return false;
  if (trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) return true;

  try {
    const url = new URL(trimmedUrl);
    return url.protocol === 'https:' && url.hostname === 'smmarkets.ph';
  } catch {
    return false;
  }
}

function ChoiceButton({
  selected,
  title,
  description,
  icon,
  onClick,
  disabled = false,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={disabled ? `${title}. ${description}` : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-1 items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-fixed)]/45 ring-1 ring-[var(--color-primary)]'
          : 'border-[var(--color-border-subtle)] bg-white hover:border-[var(--color-outline)]'
      } ${
        disabled ? 'cursor-not-allowed opacity-55 hover:border-[var(--color-border-subtle)]' : ''
      }`}
    >
      <span
        className={`material-symbols-outlined ${
          selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block font-bold text-[var(--color-on-surface)]">{title}</span>
        <span className="mt-1 block text-xs text-[var(--color-on-surface-variant)]">{description}</span>
      </span>
    </button>
  );
}

export default function CheckoutPageClient({ stores, allStoreProducts }: CheckoutPageClientProps) {
  const { selectedStoreId, setSelectedStoreId } = useStore();
  const { setChatContext, isChatOpen } = useLiveVoice();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const { items } = useCart();
  const { evaluations, appliedPromos, applyPromos, removePromo, totals } = usePromos();

  const selectedStore = useMemo(() => {
    return stores.find((store) => store.id === selectedStoreId);
  }, [stores, selectedStoreId]);

  const currentInventory = useMemo(
    () => getStoreInventory(allStoreProducts, selectedStoreId),
    [allStoreProducts, selectedStoreId]
  );

  useEffect(() => {
    setChatContext({
      selectedLocation: selectedStore ? `${selectedStore.name} ${selectedStore.city}` : undefined,
      inventoryData: currentInventory,
      onStoreChange: setSelectedStoreId,
      storesData: stores,
      pageContext: 'checkout',
    });
  }, [selectedStore, currentInventory, stores, setSelectedStoreId, setChatContext]);

  const handleApplyPromo = (promoId: string) => {
    const result = applyPromos([promoId]);
    setPromoMessage(result.rejected[0]?.reason ?? null);
  };

  const handleRemovePromo = (promoId: string) => {
    removePromo(promoId);
    setPromoMessage(null);
  };

  return (
    <>
      {/* Mobile / Tablet layout — shown below lg (1024px) */}
      <div className="lg:hidden">
        <MobileCheckoutView isChatOpen={isChatOpen} />
      </div>

      {/* Desktop layout — shown at lg (1024px) and above */}
      <div className="hidden lg:flex min-h-screen flex-col bg-[var(--color-surface-bright)]">
        <TopNavBar
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
        />

      <main
        className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
          isChatOpen ? 'pointer-events-none select-none blur-sm' : ''
        }`}
      >
        <div className="mx-auto max-w-6xl">
          <p className="mb-2 text-sm font-semibold text-[var(--color-primary)]">Cart › Checkout</p>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-primary)]">Checkout</h1>
              <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
                Review your mock order details before the unavailable completion step.
              </p>
            </div>
            <Link
              href="/cart"
              className="text-sm font-bold text-[var(--color-primary)] hover:underline"
            >
              Back to cart
            </Link>
          </div>

          {items.length === 0 ? (
            <section className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-10 text-center shadow-sm">
              <span className="material-symbols-outlined mb-3 block text-5xl text-[var(--color-on-surface-variant)]">
                shopping_cart
              </span>
              <h2 className="text-xl font-bold text-[var(--color-primary)]">Your cart is empty</h2>
              <p className="mt-2 text-[var(--color-on-surface-variant)]">
                Add some groceries first, then return here to review the mock checkout.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-md bg-[var(--color-primary)] px-5 py-3 font-bold text-white hover:bg-[var(--color-primary-container)]"
              >
                Continue shopping
              </Link>
            </section>
          ) : (
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-6">
                <section className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">contact_mail</span>
                    <h2 className="text-xl font-bold text-[var(--color-primary)]">Contact details</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                      Email address
                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        className="mt-2 w-full rounded-md border border-[var(--color-border-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </label>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                      Mobile number
                      <input
                        type="tel"
                        name="phone"
                        placeholder="0917 123 4567"
                        className="mt-2 w-full rounded-md border border-[var(--color-border-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-xl font-bold text-[var(--color-primary)]">Fulfillment</h2>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <ChoiceButton
                      selected
                      title="Delivery"
                      description="Deliver to your selected address"
                      icon="local_shipping"
                    />
                    <ChoiceButton
                      selected={false}
                      title="Pickup (coming soon)"
                      description="This display-only mock option is unavailable."
                      icon="storefront"
                      disabled
                    />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)] sm:col-span-2">
                      Delivery address
                      <input
                        type="text"
                        name="address"
                        placeholder="House no., street, barangay"
                        className="mt-2 w-full rounded-md border border-[var(--color-border-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </label>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                      City
                      <input
                        type="text"
                        name="city"
                        placeholder="Mandaluyong"
                        className="mt-2 w-full rounded-md border border-[var(--color-border-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </label>
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                      Postal code
                      <input
                        type="text"
                        name="postal-code"
                        placeholder="1550"
                        className="mt-2 w-full rounded-md border border-[var(--color-border-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-xl font-bold text-[var(--color-primary)]">Payment method</h2>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <ChoiceButton
                      selected={paymentMethod === 'cod'}
                      title="Cash on Delivery"
                      description="Pay when the mock delivery arrives"
                      icon="payments"
                      onClick={() => setPaymentMethod('cod')}
                    />
                    <ChoiceButton
                      selected={paymentMethod === 'card'}
                      title="Card"
                      description="Card details are not collected in this mock"
                      icon="credit_card"
                      onClick={() => setPaymentMethod('card')}
                    />
                  </div>
                </section>

                <section className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">receipt_long</span>
                    <h2 className="text-xl font-bold text-[var(--color-primary)]">Review items</h2>
                  </div>
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {items.map(({ product, quantity }) => (
                      <div key={product.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="relative h-20 w-20 shrink-0 rounded-md border border-[var(--color-border-subtle)] bg-white p-1">
                          {isSupportedProductImageUrl(product.imageUrl) ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="80px"
                              className="object-contain p-1"
                            />
                          ) : (
                            <div
                              role="img"
                              aria-label={`Product image unavailable for ${product.name}`}
                              className="flex h-full w-full items-center justify-center rounded bg-[var(--color-surface-container-low)] text-[var(--color-primary)]"
                            >
                              <span className="material-symbols-outlined" aria-hidden="true">image_not_supported</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-[var(--color-on-surface)]">{product.name}</h3>
                          <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
                            {product.weight} · Quantity {quantity}
                          </p>
                        </div>
                        <p className="whitespace-nowrap font-bold text-[var(--color-on-surface)]">
                          {formatCurrency(product.price * quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--color-promo-orange)]">local_offer</span>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-primary)]">Prototype offers</h2>
                      <p className="text-sm text-[var(--color-on-surface-variant)]">Apply mock offers to this cart.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {evaluations.map((evaluation) => {
                      const { promo } = evaluation;
                      return (
                        <article
                          key={promo.id}
                          className={`rounded-lg border p-4 ${
                            evaluation.applied
                              ? 'border-green-300 bg-green-50/60'
                              : 'border-[var(--color-border-subtle)]'
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-[var(--color-on-surface)]">{promo.title}</h3>
                                <span className="rounded-full bg-[var(--color-secondary-container)] px-2 py-0.5 text-xs font-bold text-[var(--color-on-secondary-container)]">
                                  Prototype offer
                                </span>
                              </div>
                              <p className="mt-2 font-mono text-sm font-bold text-[var(--color-primary)]">{promo.code}</p>
                              <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{promo.terms}</p>
                              <p
                                className={`mt-2 text-sm font-medium ${
                                  evaluation.eligible ? 'text-green-700' : 'text-[var(--color-error)]'
                                }`}
                              >
                                {evaluation.eligible ? 'Eligible' : 'Not eligible'}: {evaluation.reason}
                              </p>
                              <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
                                Estimated savings: {formatCurrency(evaluation.estimatedSavings)}
                              </p>
                              {promo.sourceUrl && (
                                <a
                                  href={promo.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline"
                                >
                                  {promo.sourceLabel ?? 'Offer source'}
                                </a>
                              )}
                            </div>
                            {evaluation.applied ? (
                              <button
                                type="button"
                                onClick={() => handleRemovePromo(promo.id)}
                                className="shrink-0 rounded-md border border-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-fixed)]"
                              >
                                Remove
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!evaluation.eligible}
                                onClick={() => handleApplyPromo(promo.id)}
                                className="shrink-0 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-primary-container)] disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {promoMessage && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="mt-4 rounded-md border border-[var(--color-error)] bg-[var(--color-error-container)] p-3 text-sm text-[var(--color-on-error-container)]"
                    >
                      Promotion not applied: {promoMessage}
                    </p>
                  )}
                </section>
              </div>

              <aside className="xl:sticky xl:top-20">
                <section className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-xl font-bold text-[var(--color-primary)]">Order summary</h2>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-[var(--color-on-surface-variant)]">Subtotal</span>
                      <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[var(--color-on-surface-variant)]">Base delivery fee</span>
                      <span className="font-medium">{formatCurrency(totals.deliveryFee)}</span>
                    </div>
                    {appliedPromos.map((promo) => (
                      <div key={promo.id} className="flex justify-between gap-4 text-green-700">
                        <span>{promo.code}</span>
                        <span className="font-medium">−{formatCurrency(promo.savings)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4 border-t border-[var(--color-border-subtle)] pt-3">
                      <span className="font-semibold text-[var(--color-on-surface)]">Total savings</span>
                      <span className="font-bold text-green-700">−{formatCurrency(totals.totalSavings)}</span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-[var(--color-border-subtle)] pt-3 text-lg">
                      <span className="font-bold text-[var(--color-primary)]">Final total</span>
                      <span className="font-bold text-[var(--color-primary)]">{formatCurrency(totals.finalTotal)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full cursor-not-allowed rounded-md bg-[var(--color-primary)] px-4 py-3 font-bold text-white opacity-55"
                  >
                    Place Order
                  </button>
                  <p className="mt-3 text-center text-sm text-[var(--color-on-surface-variant)]">
                    Mock checkout — purchase completion is unavailable.
                  </p>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>

      </div>

    </>
  );
}
