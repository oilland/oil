import { getSettings } from '@/lib/settings';
import { CartView } from '@/components/shop/CartView';

export const metadata = { title: 'سبد خرید' };

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <div className="container-x section">
      <h1 className="mb-6 text-xl font-extrabold text-slate-900 md:text-2xl">سبد خرید</h1>
      <CartView currencyLabel={settings.currencyLabel} freeShippingThreshold={settings.freeShippingThreshold} />
    </div>
  );
}
