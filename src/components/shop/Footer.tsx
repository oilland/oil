import Link from 'next/link';
import {
  IconPhone,
  IconMail,
  IconMapPin,
  IconInstagram,
  IconSend,
  IconMessage,
  IconShield,
  IconTruck,
  IconLock
} from '@/components/icons';
import { NewsletterForm } from './NewsletterForm';
import type { NavCategory } from './Header';

export function Footer({
  categories,
  settings
}: {
  categories: NavCategory[];
  settings: {
    storeName: string;
    footerAbout: string;
    phone: string;
    email: string;
    address: string;
    workingHours: string;
    instagram: string;
    telegram: string;
    whatsapp: string;
    logoUrl?: string;
  };
}) {
  return (
    <footer className="mt-16 bg-gradient-to-b from-brand-950 to-[#0a1a36] text-slate-300">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-1 gap-4 py-6 sm:grid-cols-3">
          {[
            { icon: IconShield, title: 'ضمانت اصالت کالا', desc: 'تمامی محصولات دارای کد اصالت' },
            { icon: IconTruck, title: 'ارسال سریع', desc: 'به سراسر کشور با پست و تیپاکس' },
            { icon: IconLock, title: 'پرداخت امن', desc: 'درگاه پرداخت معتبر بانکی' }
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-400">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="text-xs text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x grid grid-cols-1 gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 inline-flex rounded-xl bg-white/95 p-2.5">
            <img src={settings.logoUrl || '/images/logo.png'} alt={settings.storeName} className="h-12 w-auto" />
          </div>
          <p className="mb-4 text-lg font-extrabold text-white">{settings.storeName}</p>
          <p className="text-sm leading-7 text-slate-400">{settings.footerAbout}</p>
          <div className="mt-5 flex items-center gap-2">
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white" aria-label="اینستاگرام">
                <IconInstagram className="h-4.5 w-4.5" />
              </a>
            )}
            {settings.telegram && (
              <a href={settings.telegram} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white" aria-label="تلگرام">
                <IconSend className="h-4.5 w-4.5" />
              </a>
            )}
            {settings.whatsapp && (
              <a href={settings.whatsapp} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white" aria-label="واتساپ">
                <IconMessage className="h-4.5 w-4.5" />
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold text-white">دسترسی سریع</p>
          <ul className="space-y-2.5 text-sm">
            {[
              ['همه محصولات', '/products'],
              ['تخفیف‌های ویژه', '/products?offer=1'],
              ['انتخاب روغن خودرو', '/vehicle'],
              ['وبلاگ', '/blog'],
              ['درباره ما', '/page/about-us'],
              ['تماس با ما', '/page/contact-us']
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-slate-400 transition hover:text-accent-300">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold text-white">دسته‌بندی‌ها</p>
          <ul className="space-y-2.5 text-sm">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link href={`/products?cat=${c.slug}`} className="text-slate-400 transition hover:text-accent-300">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-bold text-white">تماس با ما</p>
          <ul className="space-y-3.5 text-sm text-slate-400">
            <li className="flex items-start gap-2.5">
              <IconMapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-400" />
              {settings.address}
            </li>
            <li className="flex items-center gap-2.5">
              <IconPhone className="h-4.5 w-4.5 shrink-0 text-accent-400" />
              <span dir="ltr">{settings.phone}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <IconMail className="h-4.5 w-4.5 shrink-0 text-accent-400" />
              <span dir="ltr">{settings.email}</span>
            </li>
          </ul>
          <div className="mt-5">
            <p className="mb-2 text-sm font-bold text-white">خبرنامه</p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {new Intl.DateTimeFormat('fa-IR').format(new Date())} {settings.storeName} — تمامی حقوق محفوظ است.</p>
          <div className="flex items-center gap-4">
            <Link href="/page/terms" className="hover:text-slate-300">شرایط استفاده</Link>
            <Link href="/page/privacy" className="hover:text-slate-300">حریم خصوصی</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
