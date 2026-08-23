'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  IconSearch,
  IconUser,
  IconHeart,
  IconCart,
  IconMenu,
  IconX,
  IconChevronDown,
  IconPhone,
  IconClock,
  IconBolt
} from '@/components/icons';
import { useShop } from './CartProvider';
import { CategoryAccordion } from './CategoryAccordion';

export type NavCategory = { id: string; name: string; slug: string; children: NavCategory[] };

export function Header({
  categories,
  storeName,
  phone,
  workingHours,
  logoUrl,
  session
}: {
  categories: NavCategory[];
  storeName: string;
  phone: string;
  workingHours: string;
  logoUrl: string;
  session: { name: string } | null;
}) {
  const { count, wishlist } = useShop();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const links = [
    { href: '/products', label: 'همه محصولات' },
    { href: '/products?offer=1', label: 'تخفیف‌ها', accent: true },
    { href: '/vehicle', label: 'انتخاب روغن خودرو' },
    { href: '/blog', label: 'وبلاگ' }
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="hidden bg-gradient-to-l from-brand-950 to-brand-800 text-slate-200 md:block">
        <div className="container-x flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <IconPhone className="h-3.5 w-3.5" />
              <span dir="ltr">{phone}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <IconClock className="h-3.5 w-3.5" />
              {workingHours}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-accent-300">
              <IconBolt className="h-3.5 w-3.5" />
              ارسال سریع به سراسر کشور
            </span>
            <Link href="/page/about-us" className="hover:text-white">درباره ما</Link>
            <Link href="/page/contact-us" className="hover:text-white">تماس با ما</Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className={`bg-white transition-shadow ${scrolled ? 'shadow-soft' : 'border-b border-slate-100'}`}>
        <div className="container-x flex h-24 items-center gap-4 lg:h-28">
          {/* Mobile menu button */}
          <button
            className="btn-ghost -me-2 p-2 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="باز کردن منو"
          >
            <IconMenu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src={logoUrl || '/images/logo.png'}
              alt={storeName}
              className="h-20 w-auto lg:h-24"
            />
          </Link>

          {/* Desktop search */}
          <form action="/products" className="mx-auto hidden w-full max-w-xl flex-1 lg:block">
            <div className="relative">
              <input
                name="q"
                placeholder="جستجوی روغن موتور، برند، گرانروی…"
                className="input h-11 rounded-2xl bg-slate-50 pr-11"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-700"
                aria-label="جستجو"
              >
                <IconSearch className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Icons */}
          <div className="ms-auto flex items-center gap-1 lg:ms-0">
            <Link
              href={session ? '/account' : '/login'}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <IconUser className="h-5 w-5" />
              <span className="hidden xl:inline">{session ? session.name.split(' ')[0] : 'ورود | ثبت‌نام'}</span>
            </Link>
            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="علاقه‌مندی‌ها"
            >
              <IconHeart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {new Intl.NumberFormat('fa-IR').format(wishlist.length)}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="سبد خرید"
            >
              <IconCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-800 px-1 text-[10px] font-bold text-white">
                  {new Intl.NumberFormat('fa-IR').format(count)}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="container-x hidden items-center gap-1 pb-2.5 lg:flex">
          <div className="relative">
            <button
              onClick={() => setCatOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                catOpen ? 'bg-brand-800 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              دسته‌بندی محصولات
              <IconChevronDown className={`h-4 w-4 transition ${catOpen ? 'rotate-180' : ''}`} />
            </button>
            {catOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-card-hover animate-fade-in">
                  <CategoryAccordion categories={categories} onNavigate={() => setCatOpen(false)} />
                </div>
              </>
            )}
          </div>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                l.accent ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <span className="ms-auto flex items-center gap-1.5 rounded-xl bg-accent-50 px-3 py-2 text-xs font-semibold text-accent-700">
            <IconBolt className="h-4 w-4" />
            ضمانت اصالت کالا
          </span>
        </nav>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <img src={logoUrl || '/images/logo.png'} alt={storeName} className="h-14 w-auto" />
              <button onClick={() => setMenuOpen(false)} className="btn-ghost p-2" aria-label="بستن">
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <form action="/products" onSubmit={() => setMenuOpen(false)}>
                <div className="relative">
                  <input name="q" placeholder="جستجو…" className="input h-11 rounded-xl bg-slate-50 pr-10" />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="جستجو">
                    <IconSearch className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-6">
              <Link href="/" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                صفحه اصلی
              </Link>
              <p className="mt-3 px-3 text-xs font-bold uppercase text-slate-400">دسته‌بندی‌ها</p>
              <CategoryAccordion categories={categories} onNavigate={() => setMenuOpen(false)} />
              <p className="mt-3 px-3 text-xs font-bold uppercase text-slate-400">منو</p>
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-100 p-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <IconPhone className="h-4 w-4" />
                <span dir="ltr">{phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
