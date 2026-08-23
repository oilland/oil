'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IconCheck, IconHeart } from '@/components/icons';

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  image: string;
  stock: number;
  qty: number;
};

type ShopContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  hasWishlist: (id: string) => boolean;
};

const ShopContext = createContext<ShopContextType | null>(null);

const CART_KEY = 'oilshop_cart_v1';
const WISH_KEY = 'oilshop_wishlist_v1';

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      if (c) setCart(JSON.parse(c));
      const w = localStorage.getItem(WISH_KEY);
      if (w) setWishlist(JSON.parse(w));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const addToCart = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: Math.min(c.qty + qty, Math.max(c.stock, 99)) } : c
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, Math.min(qty, 99)) } : c))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((id: string) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const hasWishlist = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const count = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);
  const subtotal = useMemo(
    () => cart.reduce((s, c) => s + (c.salePrice ?? c.price) * c.qty, 0),
    [cart]
  );

  const value = useMemo(
    () => ({ cart, addToCart, removeFromCart, setQty, clearCart, count, subtotal, wishlist, toggleWishlist, hasWishlist }),
    [cart, addToCart, removeFromCart, setQty, clearCart, count, subtotal, wishlist, toggleWishlist, hasWishlist]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}

export function AddToCartButton({
  product,
  className = '',
  label = 'افزودن به سبد'
}: {
  product: Omit<CartItem, 'qty'>;
  className?: string;
  label?: string;
}) {
  const { addToCart } = useShop();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={product.stock <= 0}
      onClick={() => {
        addToCart(product, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
      }}
      className={`btn-primary ${className} ${added ? '!bg-emerald-600' : ''}`}
    >
      {added ? (
        <>
          <IconCheck className="h-4 w-4" /> افزوده شد
        </>
      ) : product.stock <= 0 ? (
        'ناموجود'
      ) : (
        label
      )}
    </button>
  );
}

export function WishlistButton({ id, className = '' }: { id: string; className?: string }) {
  const { toggleWishlist, hasWishlist } = useShop();
  const active = hasWishlist(id);
  return (
    <button
      type="button"
      aria-label="افزودن به علاقه‌مندی‌ها"
      onClick={() => toggleWishlist(id)}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${className} ${
        active
          ? 'border-red-200 bg-red-50 text-red-500'
          : 'border-slate-200 bg-white text-slate-400 hover:text-red-500'
      }`}
    >
      <IconHeart className={`h-5 w-5 ${active ? 'fill-red-500' : ''}`} />
    </button>
  );
}

export function QtyPicker({
  value,
  onChange,
  max = 99
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white">
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-brand-700"
        aria-label="افزایش"
      >
        <span className="text-lg font-bold">+</span>
      </button>
      <input
        type="number"
        value={value}
        min={1}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-12 border-x border-slate-200 text-center text-sm font-bold text-slate-800 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-brand-700"
        aria-label="کاهش"
      >
        <span className="text-lg font-bold">−</span>
      </button>
    </div>
  );
}
