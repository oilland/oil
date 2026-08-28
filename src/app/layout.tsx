import type { Metadata, Viewport } from 'next';
import { getSettings } from '@/lib/settings';
import './globals.css';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://oilland.shop').replace(/\/+$/, '');
const GOOGLE_VERIFY = 'lPvRcTOeDTp865xqCCinACzOM0ntzu6DJ5r7Pb9js3A';

export async function generateMetadata(): Promise<Metadata> {
  // Resilient: if the DB is unavailable during build, fall back to defaults
  // instead of failing the build (DB is created after the first deploy).
  try {
    const s = await getSettings();
    const title = s.metaTitle || `${s.storeName} | فروشگاه اینترنتی روغن و روانکار`;
    const description = s.metaDescription || 'خرید روغن موتور و روانکار با ضمانت اصالت';
    return {
      metadataBase: new URL(SITE_URL),
      title: { default: title, template: `%s | ${s.storeName}` },
      description,
      alternates: { canonical: '/' },
      openGraph: {
        type: 'website',
        locale: 'fa_IR',
        url: SITE_URL,
        siteName: s.storeName,
        title,
        description,
        images: [{ url: s.faviconUrl || '/images/logo.png' }]
      },
      twitter: { card: 'summary_large_image', title, description },
      icons: { icon: s.faviconUrl || '/images/logo.png' },
      robots: { index: true, follow: true },
      verification: { google: GOOGLE_VERIFY }
    };
  } catch {
    return {
      metadataBase: new URL(SITE_URL),
      title: { default: 'سرزمین روغن | فروشگاه اینترنتی روغن موتور و روانکار', template: '%s' },
      description: 'خرید روغن موتور و روانکار با ضمانت اصالت',
      icons: { icon: '/images/logo.png' },
      robots: { index: true, follow: true },
      verification: { google: GOOGLE_VERIFY }
    };
  }
}

export async function generateViewport(): Promise<Viewport> {
  try {
    const s = await getSettings();
    return { width: 'device-width', initialScale: 1, themeColor: s.primaryColor || '#0b554d' };
  } catch {
    return { width: 'device-width', initialScale: 1, themeColor: '#0b554d' };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  );
}
