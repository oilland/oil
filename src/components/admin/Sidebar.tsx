'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType } from 'react';
import {
  IconGrid,
  IconPackage,
  IconList,
  IconTag,
  IconCar,
  IconMegaphone,
  IconInbox,
  IconUsers,
  IconPercent,
  IconFileText,
  IconTruck,
  IconMessage,
  IconSettings,
  IconShield,
  IconClock,
  IconHome,
  IconUser,
  IconLogOut,
  IconX,
  IconMenu
} from '@/components/icons';

type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }>; perm?: string };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  { title: 'اصلی', items: [{ href: '/admin', label: 'داشبورد', icon: IconGrid, perm: 'dashboard.view' }] },
  {
    title: 'فروشگاه',
    items: [
      { href: '/admin/products', label: 'محصولات', icon: IconPackage, perm: 'products.view' },
      { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: IconList, perm: 'categories.manage' },
      { href: '/admin/brands', label: 'برندها', icon: IconTag, perm: 'brands.manage' },
      { href: '/admin/vehicles', label: 'سازگاری خودرو', icon: IconCar, perm: 'vehicles.manage' },
      { href: '/admin/banners', label: 'بنرها', icon: IconMegaphone, perm: 'banners.manage' }
    ]
  },
  {
    title: 'سفارشات',
    items: [
      { href: '/admin/orders', label: 'سفارش‌ها', icon: IconInbox, perm: 'orders.view' },
      { href: '/admin/customers', label: 'مشتریان', icon: IconUsers, perm: 'customers.view' },
      { href: '/admin/coupons', label: 'کدهای تخفیف', icon: IconPercent, perm: 'coupons.manage' },
      { href: '/admin/shipping', label: 'روش‌های ارسال', icon: IconTruck, perm: 'settings.manage' }
    ]
  },
  {
    title: 'محتوا',
    items: [
      { href: '/admin/homepage', label: 'صفحه اصلی', icon: IconHome, perm: 'content.manage' },
      { href: '/admin/blog', label: 'وبلاگ', icon: IconFileText, perm: 'blog.manage' },
      { href: '/admin/pages', label: 'صفحات', icon: IconFileText, perm: 'content.manage' },
      { href: '/admin/testimonials', label: 'نظرات مشتریان', icon: IconMessage, perm: 'content.manage' },
      { href: '/admin/faq', label: 'سوالات متداول', icon: IconMessage, perm: 'content.manage' },
      { href: '/admin/reviews', label: 'دیدگاه محصولات', icon: IconMessage, perm: 'reviews.moderate' }
    ]
  },
  {
    title: 'سیستم',
    items: [
      { href: '/admin/settings', label: 'تنظیمات', icon: IconSettings, perm: 'settings.manage' },
      { href: '/admin/roles', label: 'نقش‌ها', icon: IconShield, perm: 'roles.manage' },
      { href: '/admin/activity', label: 'گزارش فعالیت', icon: IconClock, perm: 'activity.view' }
    ]
  }
];

export function Sidebar({
  perms,
  isSuper,
  userName,
  logoUrl
}: {
  perms: string[];
  isSuper: boolean;
  userName: string;
  logoUrl: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const can = (perm?: string) => !perm || isSuper || perms.includes(perm);
  const visibleGroups = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => can(i.perm)) })).filter(
    (g) => g.items.length > 0
  );

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-white/10 p-5">
        <span className="flex h-11 w-auto items-center justify-center rounded-xl bg-white/95 px-2 py-1.5">
          <img src={logoUrl || '/images/logo.png'} alt="لوگو" className="h-12 w-auto" />
        </span>
        <div>
          <p className="text-sm font-extrabold text-white">پنل مدیریت</p>
          <p className="text-[11px] text-slate-400">{userName}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {visibleGroups.map((g) => (
          <div key={g.title} className="mb-4">
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{g.title}</p>
            {g.items.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? 'bg-gradient-to-l from-accent-400 to-accent-500 text-brand-950 shadow-lg shadow-accent-900/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link href="/admin/profile" className="mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white">
          <IconUser className="h-5 w-5" /> پروفایل و رمز عبور
        </Link>
        <Link href="/" className="mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white">
          <IconHome className="h-5 w-5" /> مشاهده فروشگاه
        </Link>
        <form action="/api/logout" method="post">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10">
            <IconLogOut className="h-5 w-5" /> خروج
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 bg-gradient-to-b from-brand-950 to-[#0b1c38] lg:block">{content}</aside>

      {/* Mobile topbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-gradient-to-l from-brand-950 to-brand-800 p-4 lg:hidden">
        <span className="text-sm font-extrabold text-white">پنل مدیریت</span>
        <button onClick={() => setOpen(true)} className="text-white" aria-label="منو">
          <IconMenu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-b from-brand-950 to-[#0b1c38] shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute left-3 top-3 text-slate-400" aria-label="بستن">
              <IconX className="h-5 w-5" />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
