import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { updateAdminProfile, changeAdminPassword } from '@/actions/admin-profile';
import { Flash } from '@/components/ui';
import { IconUser, IconLock } from '@/components/icons';

export const metadata = { title: 'پروفایل من' };

export default async function AdminProfilePage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  const user = await prisma.user.findUnique({ where: { id: session!.sub } });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-xl font-extrabold text-slate-900">پروفایل من</h1>
      <p className="mb-6 text-sm text-slate-500">اطلاعات حساب مدیریتی خود را تغییر دهید.</p>
      <Flash searchParams={sp} />

      {/* Profile */}
      <div className="card mb-6 p-6">
        <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-slate-900">
          <IconUser className="h-5 w-5 text-brand-600" />
          اطلاعات حساب
        </h2>
        <form action={updateAdminProfile} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">نام</label>
            <input id="name" name="name" defaultValue={user?.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">ایمیل (برای ورود)</label>
            <input id="email" name="email" type="email" defaultValue={user?.email} className="input" dir="ltr" />
          </div>
          <button type="submit" className="btn-primary">ذخیره اطلاعات</button>
        </form>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-slate-900">
          <IconLock className="h-5 w-5 text-brand-600" />
          تغییر رمز عبور
        </h2>
        <form action={changeAdminPassword} className="space-y-4">
          <div>
            <label className="label" htmlFor="current">رمز عبور فعلی</label>
            <input id="current" name="current" type="password" required className="input" dir="ltr" />
          </div>
          <div>
            <label className="label" htmlFor="next">رمز عبور جدید (حداقل ۶ کاراکتر)</label>
            <input id="next" name="next" type="password" required className="input" dir="ltr" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">تکرار رمز عبور جدید</label>
            <input id="confirm" name="confirm" type="password" required className="input" dir="ltr" />
          </div>
          <button type="submit" className="btn-primary">تغییر رمز عبور</button>
          <p className="text-xs text-slate-400">
            پس از تغییر رمز، از حساب خارج می‌شوید و باید با رمز جدید وارد شوید.
          </p>
        </form>
      </div>
    </div>
  );
}
