import Link from 'next/link';
import { Stars, Price, DiscountBadge } from '@/components/ui';
import { AddToCartButton, WishlistButton } from './CartProvider';

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  stock: number;
  averageRating: number;
  ratingCount: number;
  isBestSeller?: boolean;
  brand: { name: string } | null;
  category: { name: string } | null;
  images: { url: string; alt: string | null }[];
};

export function ProductCard({ product, currencyLabel }: { product: ProductCardData; currencyLabel: string }) {
  const img = product.images[0]?.url ?? '/images/placeholder.svg';
  const cartItem = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    image: img,
    stock: product.stock
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="block">
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <DiscountBadge price={product.price} salePrice={product.salePrice} />
          {product.isBestSeller && <span className="badge bg-brand-800 text-white">پرفروش</span>}
          {product.stock <= 0 && <span className="badge bg-slate-700 text-white">ناموجود</span>}
        </div>
        <div className="absolute left-3 top-3">
          <WishlistButton id={product.id} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <span className="mb-1 text-xs font-semibold text-brand-600">{product.brand.name}</span>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="mb-2 line-clamp-2 min-h-[2.6rem] text-sm font-bold leading-6 text-slate-800 hover:text-brand-700"
        >
          {product.name}
        </Link>
        <div className="mb-3 flex items-center gap-1.5">
          <Stars rating={product.averageRating} className="h-3.5 w-3.5" />
          <span className="text-xs text-slate-400">
            ({new Intl.NumberFormat('fa-IR').format(product.ratingCount)})
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <Price price={product.price} salePrice={product.salePrice} currencyLabel={currencyLabel} size="sm" />
        </div>
        <div className="mt-3 flex gap-2">
          <AddToCartButton product={cartItem} className="flex-1 !py-2 text-xs" />
        </div>
      </div>
    </div>
  );
}
