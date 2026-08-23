'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop, type CartItem, QtyPicker, WishlistButton } from './CartProvider';

export function ProductActions({ product }: { product: Omit<CartItem, 'qty'> }) {
  const { addToCart } = useShop();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">تعداد:</span>
        <QtyPicker value={qty} onChange={(v) => setQty(Math.max(1, v))} max={Math.max(1, product.stock)} />
      </div>
      <div className="flex gap-2">
        <WishlistButton id={product.id} />
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() => {
            addToCart(product, qty);
            setAdded(true);
            setTimeout(() => setAdded(false), 1400);
          }}
          className={`btn-primary !px-6 ${added ? '!bg-emerald-600' : ''}`}
        >
          {added ? 'افزوده شد ✓' : 'افزودن به سبد خرید'}
        </button>
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() => {
            addToCart(product, qty);
            router.push('/checkout');
          }}
          className="btn-accent !px-6"
        >
          خرید سریع
        </button>
      </div>
    </div>
  );
}
