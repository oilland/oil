import Link from 'next/link';
import { IconStar, IconInfo, IconCheck, IconAlert } from './icons';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="در حال بارگذاری"
    />
  );
}

export function Stars({ rating, className = 'h-4 w-4' }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          className={`${className} ${i <= Math.round(rating) ? 'fill-accent-400 text-accent-400' : 'fill-slate-200 text-slate-200'}`}
        />
      ))}
    </span>
  );
}

export function SectionHeading({
  title,
  subtitle,
  link,
  linkLabel = 'مشاهده همه'
}: {
  title: string;
  subtitle?: string | null;
  link?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {link && (
        <Link href={link} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">
          {linkLabel}
          <IconArrowLeftSm />
        </Link>
      )}
    </div>
  );
}

function IconArrowLeftSm() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function Price({
  price,
  salePrice,
  currencyLabel = 'تومان',
  size = 'md'
}: {
  price: number;
  salePrice?: number | null;
  currencyLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const fmt = new Intl.NumberFormat('fa-IR');
  const actual = salePrice && salePrice < price ? salePrice : price;
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className={`${sizes[size]} font-extrabold text-slate-900`}>
        {fmt.format(actual)} <span className="text-xs font-medium text-slate-500">{currencyLabel}</span>
      </span>
      {salePrice && salePrice < price && (
        <span className="text-xs text-slate-400 line-through">{fmt.format(price)}</span>
      )}
    </span>
  );
}

export function DiscountBadge({ price, salePrice }: { price: number; salePrice?: number | null }) {
  if (!salePrice || salePrice >= price) return null;
  const pct = Math.round(((price - salePrice) / price) * 100);
  return <span className="badge bg-red-100 text-red-700">٪{new Intl.NumberFormat('fa-IR').format(pct)}</span>;
}

export function EmptyState({
  icon,
  title,
  message,
  children
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">{icon ?? <IconInfo className="h-7 w-7" />}</div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Flash({ searchParams }: { searchParams: { flash?: string; err?: string } }) {
  if (!searchParams.flash && !searchParams.err) return null;
  const success = Boolean(searchParams.flash);
  return (
    <div
      className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {success ? <IconCheck className="h-5 w-5 shrink-0" /> : <IconAlert className="h-5 w-5 shrink-0" />}
      {success ? searchParams.flash : searchParams.err}
    </div>
  );
}

export function StatusPill({
  value,
  items
}: {
  value: string;
  items: readonly { value: string; label: string; color: string }[];
}) {
  const item = items.find((s) => s.value === value);
  return <span className={`badge ${item?.color ?? 'bg-slate-100 text-slate-700'}`}>{item?.label ?? value}</span>;
}

export function Pagination({
  page,
  totalPages,
  baseUrl
}: {
  page: number;
  totalPages: number;
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;
  const sep = baseUrl.includes('?') ? '&' : '?';
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={`${baseUrl}${sep}page=${p}`}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
            p === page ? 'bg-brand-800 text-white' : 'bg-white text-slate-700 shadow-card hover:bg-slate-50'
          }`}
        >
          {new Intl.NumberFormat('fa-IR').format(p)}
        </Link>
      ))}
    </div>
  );
}
