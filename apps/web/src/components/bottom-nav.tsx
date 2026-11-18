'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/store/cart';

export default function BottomNav() {
  const { count, setOpen } = useCart();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-foreground/10 bg-background/90 backdrop-blur md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="relative mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
        aria-label="open cart"
      >
        <ShoppingBag className="h-6 w-6" />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
            {count}
          </span>
        ) : null}
      </button>
    </nav>
  );
}
