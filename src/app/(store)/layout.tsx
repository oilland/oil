import { ShopProvider } from '@/components/shop/CartProvider';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { getCategoryTree } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { getSession } from '@/lib/session';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, session] = await Promise.all([
    getCategoryTree(),
    getSettings(),
    getSession()
  ]);

  return (
    <ShopProvider>
      <div className="flex min-h-screen flex-col">
        <Header
          categories={categories}
          storeName={settings.storeName}
          phone={settings.phone}
          workingHours={settings.workingHours}
          logoUrl={settings.logoUrl}
          session={session}
        />
        <main className="flex-1">{children}</main>
        <Footer categories={categories} settings={settings} />
      </div>
    </ShopProvider>
  );
}
