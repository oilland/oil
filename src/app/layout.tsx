import type { Metadata, Viewport } from 'next';
import { getSettings } from '@/lib/settings';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  // Resilient: if the DB is unavailable during build, fall back to defaults
  // instead of failing the build (DB is created after the first deploy).
  try {
    const s = await getSettings();
    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
      title: {
        default: s.metaTitle || `${s.storeName} | فروشگاه اینترنتی روغن و روانکار`,
        template: `%s | ${s.storeName}`
      },
      description: s.metaDescription,
      icons: { icon: s.faviconUrl || '/images/logo.png' },
      robots: { index: true, follow: true }
    };
  } catch {
    return {
      title: { default: 'فروشگاه روغن و روانکار', template: '%s' },
      description: 'فروشگاه اینترنتی روغن موتور و روانکار',
      icons: { icon: '/images/logo.png' },
      robots: { index: true, follow: true }
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
