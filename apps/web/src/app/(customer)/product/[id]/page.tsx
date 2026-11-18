'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useUI } from '@/store/ui';
import { useCart } from '@/store/cart';
import { getProduct, formatPrice } from '@/lib/api';
import type { Product } from '@burger/shared';

interface Customization {
  id: string;
  nameEn: string;
  nameAm: string;
  priceDelta: number;
  required?: boolean;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = String(params?.id ?? '');
  const { t, language } = useUI();
  const { addLine } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProduct(productId).then((p) => {
      if (cancelled) return;
      setProduct(p);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return <main className="min-h-screen bg-background p-4"><div className="h-80 animate-pulse rounded-3xl bg-foreground/10" /></main>;
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold text-foreground">Product not found</p>
          <button onClick={() => window.history.back()} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-white">Back</button>
        </div>
      </main>
    );
  }

  const name = language === 'am' ? product.nameAm : product.nameEn;
  const description = language === 'am' ? product.descriptionAm : product.descriptionEn;
  const ingredients = language === 'am' ? product.ingredientsAm : product.ingredientsEn;
  const effectivePrice = product.promoPrice && product.promoPrice < product.price ? product.promoPrice : product.price;
  const customizations: Customization[] = product.customizations
    ? (() => {
        try {
          const parsed = JSON.parse(product.customizations) as Customization[];
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : [];

  const selectedDelta = customizations.reduce((sum, c) => sum + (selectedCustomizations[c.id] ? c.priceDelta : 0), 0);
  const linePrice = effectivePrice + selectedDelta;
  const finalQuantity = Math.max(1, quantity);

  const addToCart = () => {
    addLine({
      productId: product.id,
      restaurantId: product.restaurantId,
      nameEn: product.nameEn,
      nameAm: product.nameAm,
      image: product.image,
      unitPrice: linePrice,
      quantity: finalQuantity,
      isCombo: product.isCombo,
      customizations: customizations.length
        ? JSON.stringify(
            customizations
              .filter((c) => selectedCustomizations[c.id])
              .map((c) => ({ id: c.id, quantity: selectedCustomizations[c.id] }))
          )
        : null,
    });
    window.location.href = '/';
  };

  return (
    <main className="min-h-screen bg-background pb-28 text-foreground">
      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-primary/15 via-cream to-primary/25">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-8xl">🍔</div>
        )}
      </div>

      <div className="space-y-6 px-5 pt-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{name}</h1>
              {product.promoPrice && product.promoPrice < product.price ? (
                <p className="mt-1 font-display text-2xl font-bold text-accent">{formatPrice(effectivePrice)}</p>
              ) : (
                <p className="mt-1 font-display text-2xl font-bold text-primary">{formatPrice(effectivePrice)}</p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.available ? 'bg-green-500/15 text-green-600' : 'bg-red-500/15 text-red-600'}`}>
              {product.available ? (language === 'am' ? 'ገና አለ' : 'Available') : (language === 'am' ? 'አልተገኘም' : 'Unavailable')}
            </span>
          </div>
          {product.descriptionEn ? <p className="mt-3 text-foreground/80">{language === 'am' ? product.descriptionAm : product.descriptionEn}</p> : null}
        </div>

        {customizations.length > 0 ? (
          <section className="rounded-2xl bg-foreground/5 p-4 ring-1 ring-foreground/10">
            <h2 className="font-display text-lg font-semibold text-foreground">{t.menu.chooseOptions}</h2>
            <div className="mt-3 space-y-3">
              {customizations.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{language === 'am' ? c.nameAm : c.nameEn}</p>
                    {c.priceDelta !== 0 ? <p className="text-sm text-foreground/60">+{c.priceDelta} ETB</p> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCustomizations((prev) => ({ ...prev, [c.id]: Math.max(0, (prev[c.id] ?? 0) - 1) }))}
                      className="rounded-full bg-foreground/10 p-2 text-foreground"
                      aria-label="decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-foreground">{selectedCustomizations[c.id] ?? 0}</span>
                    <button
                      onClick={() => setSelectedCustomizations((prev) => ({ ...prev, [c.id]: Math.min(5, (prev[c.id] ?? 0) + 1) }))}
                      className="rounded-full bg-foreground/10 p-2 text-foreground"
                      aria-label="increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {product.prepTime ? (
          <p className="text-sm text-foreground/70">{t.menu.prepTime}: {product.prepTime} {t.menu.minutes}</p>
        ) : null}

        {product.allergens && product.allergens.length > 0 ? (
          <section className="rounded-2xl bg-accent/10 p-4 ring-1 ring-accent/20">
            <h2 className="font-display text-lg font-semibold text-accent">{t.menu.allergens}</h2>
            <p className="mt-1 text-sm text-foreground/80">
              {t.menu.allergensWarning}: {product.allergens.join(', ')}
            </p>
          </section>
        ) : null}

        {product.ingredientsEn ? (
          <section className="rounded-2xl bg-foreground/5 p-4 ring-1 ring-foreground/10">
            <h2 className="font-display text-lg font-semibold text-foreground">{t.menu.ingredients}</h2>
            <p className="mt-1 text-sm text-foreground/80">{language === 'am' ? product.ingredientsAm : product.ingredientsEn}</p>
          </section>
        ) : null}

        <section className="rounded-2xl bg-foreground/5 p-4 ring-1 ring-foreground/10">
          <h2 className="font-display text-lg font-semibold text-foreground">{t.cart.specialInstructions}</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t.cart.specialInstructionsPlaceholder}
            className="mt-2 w-full rounded-xl bg-background px-4 py-3 text-foreground outline-none ring-1 ring-foreground/10 focus:ring-primary"
          />
        </section>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-full bg-foreground/10 px-2 py-1.5">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="rounded-full p-2 text-foreground" aria-label="decrease"><Minus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-bold text-foreground">{finalQuantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(20, q + 1))} className="rounded-full p-2 text-foreground" aria-label="increase"><Plus className="h-4 w-4" /></button>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={addToCart}
            className="flex-1 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            {t.common.addToCart}
          </motion.button>
        </div>

        <button
          onClick={() => (window.location.href = '/')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground/5 py-3 font-semibold text-foreground ring-1 ring-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" /> {t.common.back}
        </button>
      </div>
    </main>
  );
}
