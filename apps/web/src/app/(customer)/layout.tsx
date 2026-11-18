'use client';

import { useEffect, type ReactNode } from 'react';
import { UIProvider } from '@/store/ui';
import { CartProvider } from '@/store/cart';
import CartDrawer from '@/components/cart-drawer';
import BottomNav from '@/components/bottom-nav';
import OfflineBanner from '@/components/offline-banner';

export default function CustomerLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline / unsupported — app still works online */
    });
  }, []);

  return (
    <UIProvider>
      <CartProvider>
        {children}
        <OfflineBanner />
        <CartDrawer />
        <BottomNav />
      </CartProvider>
    </UIProvider>
  );
}
