import Link from 'next/link';
import { registerAction } from '@/actions/auth';
import { getSettings } from '@/lib/settings';
import { Flash } from '@/components/ui';

export const metadata = { title: 'ثبت‌نام' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const settings = await getSettings();
  return (
    <div className="container-x section">
      <div className="mx-auto max-w-md">
        <div className="card p-8">
          <span className="mx-auto mb-4 flex h-16 w-auto items-center justify-center rounded-xl bg-slate-50 px-4 py-2">
            <img src={settings.logoUrl || '/images/logo.png'} alt={settings.storeName} className="h-16 w-auto" />
          </span>
          <h1 className="mb-1 text-center text-xl font-extrabold text-slate-900">ساخت حساب کاربری</h1>
          <p className="mb-6 text-center text-sm text-slate-500">ثبت‌نام کمتر از یک دقیقه طول می‌کشد</p>

          <Flash searchParams={sp} />

          <form action={registerAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">نام و نام خانوادگی</label>
              <input id="name" name="name" required className="input" placeholder="علی رضایی" />
            </div>
            <div>
              <label className="label" htmlFor="email">ایمیل</label>
              <input id="email" name="email" type="email" dir="ltr" required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="phone">شماره موبایل</label>
              <input id="phone" name="phone" dir="ltr" required className="input" placeholder="09121234567" />
            </div>
            <div>
              <label className="label" htmlFor="password">رمز عبور (حداقل ۶ کاراکتر)</label>
              <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full !py-3">ثبت‌نام</button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link href="/login" className="font-bold text-brand-700 hover:text-brand-900">وارد شوید</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
