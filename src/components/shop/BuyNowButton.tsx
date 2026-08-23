'use client';

import { useRouter } from 'next/navigation';
import { useShop, type CartItem } from './CartProvider';

export function BuyNowButton({
  product,
  className = ''
}: {
  product: Omit<CartItem, 'qty'>;
  className?: string;
}) {
  const { addToCart } = useShop();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={product.stock <= 0}
      onClick={() => {
        addToCart(product, 1);
        router.push('/checkout');
      }}
      className={`btn-accent ${className}`}
    >
      خرید سریع
    </button>
  );
}
