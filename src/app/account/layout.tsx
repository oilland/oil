import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { prisma } from '@/lib/db';
import { logoutAction } from '@/actions/auth';
import { IconGrid, IconPackage, IconUser, IconHeart, IconLogOut, IconHome } from '@/components/icons';

const nav = [
  { href: '/account', label: 'داشبورد', icon: IconGrid },
  { href: '/account/orders', label: 'سفارش‌های من', icon: IconPackage },
  { href: '/account/profile', label: 'اطلاعات حساب', icon: IconUser },
  { href: '/wishlist', label: 'علاقه‌مندی‌ها', icon: IconHeart }
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = await prisma.user.findUnique({ where: { id: session!.sub } });
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container-x py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit lg:sticky lg:top-8">
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 bg-white p-4">
                <img src={settings.logoUrl || '/images/logo.png'} alt={settings.storeName} className="h-12 w-auto" />
              </div>
              <div className="bg-gradient-to-br from-brand-800 to-brand-950 p-5 text-white">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
                  {user?.name.slice(0, 1)}
                </span>
                <p className="font-bold">{user?.name}</p>
                <p className="mt-0.5 text-xs text-slate-300" dir="ltr">{user?.email}</p>
              </div>
              <nav className="p-3">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <n.icon className="h-5 w-5 text-slate-400" />
                    {n.label}
                  </Link>
                ))}
                <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <IconHome className="h-5 w-5 text-slate-400" />
                  بازگشت به فروشگاه
                </Link>
                <form action={logoutAction}>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
                    <IconLogOut className="h-5 w-5" />
                    خروج از حساب
                  </button>
                </form>
              </nav>
            </div>
          </aside>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
