const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function faNum(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Format an integer amount of toman → "۱٬۲۵۰٬۰۰۰ تومان" */
export function formatPrice(toman: number, currency = 'تومان'): string {
  const n = new Intl.NumberFormat('fa-IR').format(toman);
  return `${n} ${currency}`;
}

/** Compact price for tight spaces, e.g. "۱٫۲ میلیون" */
export function formatPriceCompact(toman: number): string {
  if (toman >= 1_000_000_000) return `${faNum((toman / 1_000_000_000).toFixed(1))} میلیارد`;
  if (toman >= 1_000_000) return `${faNum((toman / 1_000_000).toFixed(1))} میلیون`;
  if (toman >= 1_000) return `${faNum((toman / 1_000).toFixed(1))} هزار`;
  return faNum(toman);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(date)
  );
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(date)
  );
}

export function discountPercent(price: number, salePrice?: number | null): number {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}
