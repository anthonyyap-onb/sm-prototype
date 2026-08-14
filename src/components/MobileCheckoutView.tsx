'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { usePromos } from '@/context/PromoContext';
import MobileTopAppBar from './MobileTopAppBar';
import Link from 'next/link';

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isSupportedProductImageUrl(imageUrl: string | undefined): imageUrl is string {
  const trimmed = imageUrl?.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const url = new URL(trimmed);
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
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-1 items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-fixed)]/45 ring-1 ring-[var(--color-primary)]'
          : 'border-[var(--color-border-subtle)] bg-white hover:border-[var(--color-outline)]'
      } ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
    >
      <span
        className={`material-symbols-outlined text-[20px] ${
          selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block font-bold text-[14px] text-[var(--color-on-surface)]">{title}</span>
        <span className="mt-0.5 block text-[12px] text-[var(--color-on-surface-variant)]">{description}</span>
      </span>
    </button>
  );
}

const inputCls =
  'mt-1.5 w-full rounded-md border border-[var(--color-border-subtle)] px-3 py-2.5 text-[14px] font-normal outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]';

const labelCls = 'block text-[13px] font-semibold text-[var(--color-on-surface)]';

const sectionCls =
  'rounded-xl border border-[var(--color-border-subtle)] bg-white p-4 shadow-sm flex flex-col gap-4';

export default function MobileCheckoutView({ isChatOpen = false }: { isChatOpen?: boolean }) {
  const { items } = useCart();
  const { evaluations, appliedPromos, applyPromos, removePromo, totals } = usePromos();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const handleApplyPromo = (promoId: string) => {
    const result = applyPromos([promoId]);
    setPromoMessage(result.rejected[0]?.reason ?? null);
  };

  const handleRemovePromo = (promoId: string) => {
    removePromo(promoId);
    setPromoMessage(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface-bright)]">
      <MobileTopAppBar backHref="/" />

      {items.length === 0 ? (
        <main className="flex-1 flex flex-col items-center justify-center gap-4 pt-16 px-4">
          <span className="material-symbols-outlined text-6xl text-[var(--color-on-surface-variant)]">
            shopping_cart
          </span>
          <h2 className="text-lg font-bold text-[var(--color-primary)]">Your cart is empty</h2>
          <p className="text-[14px] text-[var(--color-on-surface-variant)] text-center">
            Add some groceries first, then return here.
          </p>
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
          <main className={`flex-1 overflow-y-auto pt-20 pb-52 px-4 flex flex-col gap-4 transition-all duration-300 ${isChatOpen ? 'blur-sm pointer-events-none select-none' : ''}`}>
            {/* Breadcrumb */}
            <p className="text-[12px] font-semibold text-[var(--color-primary)]">Cart › Checkout</p>
            <h1 className="text-[24px] font-bold text-[var(--color-primary)] -mt-2 leading-8">Checkout</h1>

            {/* Contact details */}
            <section className={sectionCls}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">contact_mail</span>
                <h2 className="text-[16px] font-bold text-[var(--color-primary)]">Contact details</h2>
              </div>
              <div className="flex flex-col gap-3">
                <label className={labelCls}>
                  Email address
                  <input type="email" name="email" placeholder="you@example.com" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Mobile number
                  <input type="tel" name="phone" placeholder="0917 123 4567" className={inputCls} />
                </label>
              </div>
            </section>

            {/* Fulfillment */}
            <section className={sectionCls}>
              <h2 className="text-[16px] font-bold text-[var(--color-primary)]">Fulfillment</h2>
              <div className="flex flex-col gap-2">
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
              <div className="flex flex-col gap-3">
                <label className={`${labelCls} col-span-2`}>
                  Delivery address
                  <input
                    type="text"
                    name="address"
                    placeholder="House no., street, barangay"
                    className={inputCls}
                  />
                </label>
                <label className={labelCls}>
                  City
                  <input type="text" name="city" placeholder="Mandaluyong" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Postal code
                  <input type="text" name="postal-code" placeholder="1550" className={inputCls} />
                </label>
              </div>
            </section>

            {/* Payment method */}
            <section className={sectionCls}>
              <h2 className="text-[16px] font-bold text-[var(--color-primary)]">Payment method</h2>
              <div className="flex flex-col gap-2">
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

            {/* Review items */}
            <section className={sectionCls}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">receipt_long</span>
                <h2 className="text-[16px] font-bold text-[var(--color-primary)]">Review items</h2>
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative h-16 w-16 shrink-0 rounded-md border border-[var(--color-border-subtle)] bg-white">
                      {isSupportedProductImageUrl(product.imageUrl) ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
                          <span className="material-symbols-outlined text-[20px]">image_not_supported</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[14px] text-[var(--color-on-surface)] line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-[var(--color-on-surface-variant)]">
                        {product.weight} · Qty {quantity}
                      </p>
                    </div>
                    <p className="whitespace-nowrap font-bold text-[14px] text-[var(--color-on-surface)]">
                      {formatCurrency(product.price * quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Prototype offers */}
            <section className={sectionCls}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-promo-orange)] text-[20px]">local_offer</span>
                <div>
                  <h2 className="text-[16px] font-bold text-[var(--color-primary)]">Prototype offers</h2>
                  <p className="text-[12px] text-[var(--color-on-surface-variant)]">Apply mock offers to this cart.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {evaluations.map((evaluation) => {
                  const { promo } = evaluation;
                  return (
                    <article
                      key={promo.id}
                      className={`rounded-lg border p-3 ${
                        evaluation.applied
                          ? 'border-green-300 bg-green-50/60'
                          : 'border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <h3 className="font-bold text-[14px] text-[var(--color-on-surface)]">{promo.title}</h3>
                            <span className="rounded-full bg-[var(--color-secondary-container)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-on-secondary-container)]">
                              Prototype offer
                            </span>
                          </div>
                          <p className="font-mono text-[13px] font-bold text-[var(--color-primary)]">{promo.code}</p>
                          <p className="mt-1 text-[12px] text-[var(--color-on-surface-variant)]">{promo.terms}</p>
                          <p
                            className={`mt-1 text-[12px] font-medium ${
                              evaluation.eligible ? 'text-green-700' : 'text-[var(--color-error)]'
                            }`}
                          >
                            {evaluation.eligible ? 'Eligible' : 'Not eligible'}: {evaluation.reason}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[var(--color-on-surface-variant)]">
                            Est. savings: {formatCurrency(evaluation.estimatedSavings)}
                          </p>
                          {promo.sourceUrl && (
                            <a
                              href={promo.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-[12px] font-semibold text-[var(--color-primary)] hover:underline"
                            >
                              {promo.sourceLabel ?? 'Offer source'}
                            </a>
                          )}
                        </div>
                        {evaluation.applied ? (
                          <button
                            type="button"
                            onClick={() => handleRemovePromo(promo.id)}
                            className="shrink-0 rounded-md border border-[var(--color-primary)] px-3 py-1.5 text-[12px] font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-fixed)]"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!evaluation.eligible}
                            onClick={() => handleApplyPromo(promo.id)}
                            className="shrink-0 rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[var(--color-primary-container)] disabled:cursor-not-allowed disabled:opacity-45"
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
                  className="rounded-md border border-[var(--color-error)] bg-[var(--color-error-container)] p-3 text-[12px] text-[var(--color-on-error-container)]"
                >
                  Promotion not applied: {promoMessage}
                </p>
              )}
            </section>
          </main>

          {/* Sticky bottom order summary + place order */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[var(--color-border-subtle)] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40 px-4 pt-3 pb-6 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px] text-[var(--color-on-surface-variant)]">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-[var(--color-on-surface-variant)]">
                <span>Delivery fee</span>
                <span>{formatCurrency(totals.deliveryFee)}</span>
              </div>
              {appliedPromos.map((promo) => (
                <div key={promo.id} className="flex justify-between text-[13px] text-green-700">
                  <span>{promo.code}</span>
                  <span>−{formatCurrency(promo.savings)}</span>
                </div>
              ))}
              {totals.totalSavings > 0 && (
                <div className="flex justify-between text-[13px] font-semibold text-green-700">
                  <span>Total savings</span>
                  <span>−{formatCurrency(totals.totalSavings)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-[var(--color-border-subtle)]">
                <div className="flex flex-col">
                  <span className="text-[20px] font-bold text-[var(--color-primary)] leading-7">Total</span>
                  <span className="text-[10px] text-[var(--color-on-surface-variant)]">Includes 12% VAT</span>
                </div>
                <span className="text-[24px] font-bold text-[var(--color-primary)] leading-8">
                  {formatCurrency(totals.finalTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-md bg-[var(--color-primary)] h-12 font-bold text-[18px] text-white opacity-55"
            >
              Place Order
            </button>
            <p className="text-center text-[11px] text-[var(--color-on-surface-variant)]">
              Mock checkout — purchase completion is unavailable.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
