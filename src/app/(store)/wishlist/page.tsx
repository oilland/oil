'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useShop } from '@/components/shop/CartProvider';
import { ProductCard, type ProductCardData } from '@/components/shop/ProductCard';
import { EmptyState } from '@/components/ui';
import { IconHeart } from '@/components/icons';

export default function WishlistPage() {
  const { wishlist } = useShop();
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlist.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetch(`/api/products/ids?ids=${wishlist.join(',')}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d);
        setLoading(false);
      });
  }, [wishlist]);

  return (
    <div className="container-x section">
      <h1 className="mb-6 text-xl font-extrabold text-slate-900 md:text-2xl">علاقه‌مندی‌های من</h1>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconHeart className="h-7 w-7" />}
          title="لیست علاقه‌مندی شما خالی است"
          message="با کلیک روی آیکون قلب در کارت محصولات، آن‌ها را به این لیست اضافه کنید."
        >
          <Link href="/products" className="btn-primary">مشاهده محصولات</Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} currencyLabel="تومان" />
          ))}
        </div>
      )}
    </div>
  );
}
