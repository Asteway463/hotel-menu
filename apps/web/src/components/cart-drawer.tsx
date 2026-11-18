'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { formatPrice } from '@/lib/api';

type OrderTypeValue = 'DINING' | 'TAKEAWAY' | 'DELIVERY';
type PaymentMethodValue = 'CASH' | 'MANUAL_CARD';

export default function CartDrawer() {
  const { lines, isOpen, setOpen, updateQuantity, removeLine, clear, subtotal, restaurantId } = useCart();
  const { t, language } = useUI();

  const [orderType, setOrderType] = useState<OrderTypeValue>('TAKEAWAY');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>('CASH');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);

  const total = subtotal;
  const orderTypeLabel = (v: OrderTypeValue) => t.orders.type[v] ?? v;

  async function placeOrder() {
    if (!restaurantId || lines.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          type: orderType,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          customerNotes: customerNotes || undefined,
          paymentMethod,
          paymentStatus: 'PENDING',
          paid: paymentMethod === 'MANUAL_CARD',
          subtotal,
          discount: 0,
          total,
          tax: 0,
          items: lines.map((l) => ({
            productId: l.productId,
            productName: language === 'am' ? l.nameAm : l.nameEn,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            total: l.unitPrice * l.quantity,
            notes: l.notes ?? undefined,
            addons: l.addons ?? undefined,
          })),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        order?: { orderNumber?: string };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Failed to place order');
        return;
      }
      setSuccessOrderNumber(data.order?.orderNumber ?? null);
      clear();
      // Keep the drawer open so the customer sees the order number.
    } catch {
      setError('Network error. Your order could not be sent.');
    } finally {
      setPlacing(false);
    }
  }

  function closeAndReset() {
    setOpen(false);
    setSuccessOrderNumber(null);
    setError(null);
    setCustomerNotes('');
    setCustomerName('');
    setCustomerPhone('');
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="cart-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {t.cart.title}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-foreground/70 hover:bg-foreground/10"
                aria-label={t.common.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successOrderNumber ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-primary"
                >
                  <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </motion.div>
                <h3 className="mt-6 font-display text-2xl font-bold text-foreground">
                  {t.cart.orderPlaced}
                </h3>
                <p className="mt-2 text-sm text-foreground/70">
                  {t.cart.orderNumber}{' '}
                  <span className="font-bold text-primary">{successOrderNumber}</span>
                </p>
                <p className="mt-4 max-w-xs text-sm text-foreground/70">
                  {t.checkout.payAtCounterHint}
                </p>
                <button
                  onClick={closeAndReset}
                  className="mt-8 rounded-full bg-primary px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30"
                >
                  {t.cart.browseMenu}
                </button>
              </div>
            ) : lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <ShoppingBag className="h-14 w-14 text-foreground/30" />
                <p className="mt-4 font-display text-xl font-semibold text-foreground">
                  {t.cart.empty}
                </p>
                <p className="mt-1 text-sm text-foreground/60">{t.cart.emptyHint}</p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-6 rounded-full bg-primary px-8 py-3 font-semibold text-white"
                >
                  {t.common.viewMenu}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5">
                  <ul className="space-y-4">
                    {lines.map((line) => (
                      <li key={line.lineId} className="flex items-center gap-3 rounded-2xl bg-foreground/5 p-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-foreground/10">
                          {line.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={line.image} alt={line.nameEn} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">
                            {language === 'am' ? line.nameAm : line.nameEn}
                          </p>
                          <p className="text-sm text-foreground/60">{formatPrice(line.unitPrice)}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-2 rounded-full bg-foreground/10 px-2 py-1">
                              <button
                                onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                                className="rounded-full p-1 hover:bg-foreground/10"
                                aria-label="decrease"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                              <button
                                onClick={() => updateQuantity(line.lineId, Math.min(20, line.quantity + 1))}
                                className="rounded-full p-1 hover:bg-foreground/10"
                                aria-label="increase"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeLine(line.lineId)}
                              className="rounded-full p-1.5 text-red-500/80 hover:bg-red-500/10"
                              aria-label={t.cart.removeLine}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="font-bold text-foreground">{formatPrice(line.unitPrice * line.quantity)}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-foreground/80">{t.cart.specialInstructions}</p>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder={t.cart.specialInstructionsPlaceholder}
                        className="w-full rounded-xl bg-foreground/5 px-4 py-3 text-foreground outline-none ring-1 ring-foreground/10 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-foreground/80">{t.checkout.orderType}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(t.orders.type) as OrderTypeValue[]).map((v) => (
                          <button
                            key={v}
                            onClick={() => setOrderType(v)}
                            className={`rounded-xl px-2 py-2 text-sm font-semibold ring-1 ${
                              orderType === v
                                ? 'bg-primary text-white ring-primary'
                                : 'bg-foreground/5 text-foreground ring-foreground/10'
                            }`}
                          >
                            {orderTypeLabel(v)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-foreground/80">{t.checkout.paymentMethod}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPaymentMethod('CASH')}
                          className={`rounded-xl px-2 py-2 text-sm font-semibold ring-1 ${
                            paymentMethod === 'CASH'
                              ? 'bg-primary text-white ring-primary'
                              : 'bg-foreground/5 text-foreground ring-foreground/10'
                          }`}
                        >
                          {t.checkout.cash}
                        </button>
                        <button
                          onClick={() => setPaymentMethod('MANUAL_CARD')}
                          className={`rounded-xl px-2 py-2 text-sm font-semibold ring-1 ${
                            paymentMethod === 'MANUAL_CARD'
                              ? 'bg-primary text-white ring-primary'
                              : 'bg-foreground/5 text-foreground ring-foreground/10'
                          }`}
                        >
                          {t.checkout.manualCard}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-foreground/10 px-5 py-4">
                  <div className="mb-1 flex items-center justify-between text-sm text-foreground/70">
                    <span>{t.cart.subtotal}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-foreground">{t.cart.total}</span>
                    <span className="font-display text-xl font-bold text-primary">{formatPrice(total)}</span>
                  </div>
                  {error ? <p className="mb-3 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-600">{error}</p> : null}
                  <button
                    onClick={() => void placeOrder()}
                    disabled={placing}
                    className="w-full rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {placing ? t.cart.placingOrder : t.cart.placeOrder}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
