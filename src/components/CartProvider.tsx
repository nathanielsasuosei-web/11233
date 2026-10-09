'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type CartItem = {
  beatId: number;
  slug: string;
  title: string;
  cover: string;
  license: string;
  licenseName: string;
  price: number; // minor units
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  remove: (beatId: number, license: string) => void;
  clear: () => void;
  has: (beatId: number, license?: string) => boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'beatvault_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.beatId === item.beatId && p.license === item.license);
      if (exists) return prev;
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((beatId: number, license: string) => {
    setItems((prev) => prev.filter((p) => !(p.beatId === beatId && p.license === license)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback(
    (beatId: number, license?: string) =>
      items.some((p) => p.beatId === beatId && (!license || p.license === license)),
    [items],
  );

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.length,
      total: items.reduce((s, i) => s + i.price, 0),
      add,
      remove,
      clear,
      has,
      open,
      setOpen,
    }),
    [items, add, remove, clear, has, open],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
