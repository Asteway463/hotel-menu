'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface CartLine {
  lineId: string;
  productId: string;
  restaurantId: string;
  nameEn: string;
  nameAm: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  addons: string | null;
  notes: string | null;
  isCombo: boolean;
  customizations: string | null;
}

export interface CartLineInput {
  productId: string;
  restaurantId?: string;
  nameEn: string;
  nameAm: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  addons?: string | null;
  notes?: string | null;
  isCombo?: boolean;
  customizations?: string | null;
}

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addLine: (input: CartLineInput) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  restaurantId: string;
}

const CartContext = createContext<CartContextValue | null>(null);

let lineSeq = 1;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string>('');

  // Persist cart to sessionStorage so it survives reloads / offline usage.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('bh-cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem('bh-cart', JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const addLine = (input: CartLineInput) => {
    const lineId = `line-${Date.now().toString(36)}-${lineSeq++}`;
    const line: CartLine = {
      lineId,
      productId: input.productId,
      restaurantId: input.restaurantId || restaurantId,
      nameEn: input.nameEn,
      nameAm: input.nameAm,
      image: input.image,
      unitPrice: input.unitPrice,
      quantity: input.quantity,
      addons: input.addons ?? null,
      notes: input.notes ?? null,
      isCombo: input.isCombo ?? false,
      customizations: input.customizations ?? null,
    };
    if (input.restaurantId) {
      setRestaurantId(input.restaurantId);
    }
    setLines((prev) => {
      const existing = prev.find(
        (l) =>
          l.productId === input.productId &&
          l.customizations === input.customizations &&
          l.addons === input.addons
      );
      if (existing) {
        return prev.map((l) =>
          l.lineId === existing.lineId
            ? { ...l, quantity: Math.min(20, l.quantity + input.quantity) }
            : l
        );
      }
      return [...prev, line];
    });
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.lineId !== lineId)
        : prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l))
    );
  };

  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  const clear = () => setLines([]);

  const { count, subtotal } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    for (const l of lines) {
      count += l.quantity;
      subtotal += l.unitPrice * l.quantity;
    }
    return { count, subtotal };
  }, [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      isOpen,
      setOpen,
      addLine,
      updateQuantity,
      removeLine,
      clear,
      count,
      subtotal,
      restaurantId,
    }),
    [lines, isOpen, addLine, updateQuantity, removeLine, clear, count, subtotal, restaurantId]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
