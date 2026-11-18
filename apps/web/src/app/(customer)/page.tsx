'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Moon, Plus, Search, Sun } from 'lucide-react';
import { useUI } from '@/store/ui';
import { useCart } from '@/store/cart';
import { getMenu, DEFAULT_RESTAURANT_SLUG, formatPrice } from '@/lib/api';
import { cacheMenu, getCachedMenu } from '@/lib/offline';
import type { Category, Product, Restaurant } from '@burger/shared';

function ProductCard({
  product,
  restaurantId,
  onAdded,
}: {
  product: Product;
  restaurantId: string;
  onAdded: () => void;
}) {
  const { language } = useUI();
  const { addLine } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const name = language === 'am' ? product.nameAm : product.nameEn;
  const description = language === 'am' ? product.descriptionAm : product.descriptionEn;
  const effectivePrice =
    product.promoPrice && product.promoPrice < product.price ? product.promoPrice : product.price;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden rounded-3xl bg-background shadow-lg ring-1 ring-foreground/10"
    >
      <button
        onClick={() => {
          window.location.href = `/product/${product.id}`;
        }}
        className="block aspect-square w-full bg-gradient-to-br from-primary/15 via-cream to-primary/25"
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">🍔</div>
        )}
        {product.featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white shadow-lg">
            ★ {language === 'am' ? 'የውስድስና አምራች' : "Chef's Pick"}
          </span>
        ) : null}
        {product.isCombo ? (
          <span className="absolute right-3 top-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-cream shadow-lg">
            {language === 'am' ? 'ኮምቦ' : 'Combo'}
          </span>
        ) : null}
      </button>
      <div className="p-4">
        <h3 className="font-display text-lg font-bold text-foreground">{name}</h3>
        {description ? <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{description}</p> : null}
        <div className="mt-3 flex items-center justify-between">
          <div>
            {product.promoPrice && product.promoPrice < product.price ? (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-bold text-accent">{formatPrice(effectivePrice)}</span>
                <span className="text-sm text-foreground/50 line-through">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <span className="font-display text-xl font-bold text-primary">{formatPrice(effectivePrice)}</span>
            )}
          </div>
          {justAdded ? (
            <motion.span
              key="added-check"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </motion.span>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                addLine({
                  productId: product.id,
                  restaurantId,
                  nameEn: product.nameEn,
                  nameAm: product.nameAm,
                  image: product.image,
                  unitPrice: effectivePrice,
                  quantity: 1,
                  isCombo: product.isCombo,
                });
                setJustAdded(true);
                window.setTimeout(() => setJustAdded(false), 900);
                onAdded();
              }}
              className="rounded-full bg-primary p-3 text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
              aria-label={language === 'am' ? 'ወደ ትዕዛዝ ያከማቹ' : 'Add to order'}
            >
              <Plus className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function CustomerMenuPage() {
  const { t, language, theme, toggleTheme } = useUI();
  const { addLine } = useCart();
  const [menu, setMenu] = useState<{ restaurant: Restaurant; categories: Category[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const reduceMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setShowIntro(false);
      return;
    }
    try {
      if (sessionStorage.getItem('bh-intro-seen')) {
        setShowIntro(false);
        return;
      }
      setShowIntro(true);
      const timer = setTimeout(() => {
        setShowIntro(false);
        try {
          sessionStorage.setItem('bh-intro-seen', '1');
        } catch {
          /* ignore */
        }
      }, 2600);
      return () => clearTimeout(timer);
    } catch {
      setShowIntro(false);
    }
  }, [reduceMotion]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMenu(DEFAULT_RESTAURANT_SLUG)
      .then(async (data) => {
        if (cancelled) return;
        setMenu(data);
        if (data) {
          await cacheMenu(data);
        }
        setLoading(false);
      })
      .catch(async () => {
        // Offline fallback: serve from IndexedDB cache.
        const cached = await getCachedMenu<{ restaurant: Restaurant; categories: Category[] }>();
        if (cancelled) return;
        if (cached) {
          setMenu(cached);
          setError(null);
        } else {
          setError('offline');
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const products = useMemo(() => {
    const list: Array<{ category: Category; product: Product }> = [];
    for (const category of menu?.categories ?? []) {
      for (const product of category.products) {
        list.push({ category, product });
      }
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      ({ product }) =>
        product.nameEn.toLowerCase().includes(q) ||
        product.nameAm.toLowerCase().includes(q) ||
        product.descriptionEn.toLowerCase().includes(q) ||
        product.descriptionAm.toLowerCase().includes(q)
    );
  }, [menu, search]);

  const handleAdded = (productId: string) => {
    setAddedId(productId);
    window.setTimeout(() => setAddedId((cur) => (cur === productId ? null : cur)), 900);
  };

  const scrollToCategory = (slug: string) => {
    const el = sectionRefs.current.get(slug);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl animate-pulse px-4 py-8">
          <div className="h-56 w-full rounded-3xl bg-foreground/10" />
          <div className="mt-4 h-8 w-2/3 rounded-xl bg-foreground/10" />
          <div className="mt-2 h-4 w-1/3 rounded-xl bg-foreground/10" />
        </div>
      </main>
    );
  }

  if (error || !menu) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold text-foreground">{t.errors.connectionLost}</p>
        </div>
      </main>
    );
  }

  const restaurant = menu.restaurant;

  return (
    <main className="min-h-screen pb-28 bg-background text-foreground">
      <AnimatePresence>
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-secondary"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-center"
            >
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-5xl shadow-2xl shadow-primary/40">
                🍔
              </div>
              <h1 className="mt-6 font-display text-4xl font-bold text-white">Burger House</h1>
              <p className="mt-2 text-sm tracking-[0.25em] text-primary-soft uppercase">Flame-grilled · Craft · Fresh</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="relative overflow-hidden bg-secondary px-6 pb-14 pt-16 text-center text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(249,115,22,0.35),transparent_60%)]" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.3em] text-primary-soft">Est. 2026</p>
        <h1 className="relative mt-3 font-display text-4xl font-bold sm:text-5xl">{language === 'am' ? restaurant.nameAm : restaurant.nameEn}</h1>
        <p className="relative mt-3 font-display text-lg text-white/80">{language === 'am' ? restaurant.taglineAm : restaurant.taglineEn}</p>
        {restaurant.storyEn ? (
          <p className="relative mx-auto mt-4 max-w-md text-sm text-white/70">{language === 'am' ? restaurant.storyAm : restaurant.storyEn}</p>
        ) : null}
      </section>

      <div className="sticky top-0 z-30 border-b border-foreground/10 bg-background/85 px-4 pb-3 pt-3 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="w-full rounded-full bg-foreground/5 py-3 pl-10 pr-10 text-foreground outline-none ring-1 ring-foreground/10 focus:ring-primary"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {menu.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => scrollToCategory(category.slug)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-foreground/10 bg-foreground/5 text-foreground"
            >
              {language === 'am' ? category.nameAm : category.nameEn}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-6">
        {products.length === 0 ? (
          <p className="py-16 text-center text-foreground/70">{t.cart.empty}</p>
        ) : null}
        {menu.categories.map((category) => {
          const items = category.products;
          if (items.length === 0) return null;
          return (
            <motion.section
              key={category.id}
              id={`cat-${category.slug}`}
              ref={(el) => {
                if (el) sectionRefs.current.set(category.slug, el);
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground">
                {language === 'am' ? category.nameAm : category.nameEn}
              </h2>
              {category.descriptionEn ? (
                <p className="mb-4 text-sm text-foreground/70">
                  {language === 'am' ? category.descriptionAm : category.descriptionEn}
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} restaurantId={menu.restaurant.id} onAdded={() => handleAdded(product.id)} />
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={toggleTheme}
          className="rounded-full bg-secondary p-3 text-white shadow-lg"
          aria-label="toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </main>
  );
}
