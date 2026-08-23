import Link from 'next/link';
import { loginAction } from '@/actions/auth';
import { getSettings } from '@/lib/settings';
import { Flash } from '@/components/ui';

export const metadata = { title: 'ورود' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const settings = await getSettings();
  return (
    <div className="container-x section">
      <div className="mx-auto max-w-md">
        <div className="card p-8">
          <span className="mx-auto mb-4 flex h-16 w-auto items-center justify-center rounded-xl bg-slate-50 px-4 py-2">
            <img src={settings.logoUrl || '/images/logo.png'} alt={settings.storeName} className="h-16 w-auto" />
          </span>
          <h1 className="mb-1 text-center text-xl font-extrabold text-slate-900">ورود به حساب کاربری</h1>
          <p className="mb-6 text-center text-sm text-slate-500">برای مشاهده سفارش‌ها و مدیریت حساب خود وارد شوید</p>

          <Flash searchParams={sp} />

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">ایمیل</label>
              <input id="email" name="email" type="email" dir="ltr" required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">رمز عبور</label>
              <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full !py-3">ورود</button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            حساب کاربری ندارید؟{' '}
            <Link href="/register" className="font-bold text-brand-700 hover:text-brand-900">ثبت‌نام کنید</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
