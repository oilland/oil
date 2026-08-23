import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { updateProfileAction, changePasswordAction } from '@/actions/auth';
import { Flash } from '@/components/ui';

export const metadata = { title: 'اطلاعات حساب' };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  const user = await prisma.user.findUnique({ where: { id: session!.sub } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">اطلاعات حساب</h1>
      <Flash searchParams={sp} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-5 text-base font-extrabold text-slate-900">اطلاعات شخصی</h2>
          <form action={updateProfileAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">نام و نام خانوادگی</label>
              <input id="name" name="name" defaultValue={user?.name} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="email">ایمیل</label>
              <input id="email" value={user?.email} readOnly className="input bg-slate-50 text-slate-400" dir="ltr" />
            </div>
            <div>
              <label className="label" htmlFor="phone">شماره موبایل</label>
              <input id="phone" name="phone" defaultValue={user?.phone ?? ''} className="input" dir="ltr" />
            </div>
            <button type="submit" className="btn-primary">ذخیره تغییرات</button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="mb-5 text-base font-extrabold text-slate-900">تغییر رمز عبور</h2>
          <form action={changePasswordAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="current">رمز عبور فعلی</label>
              <input id="current" name="current" type="password" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="next">رمز عبور جدید</label>
              <input id="next" name="next" type="password" required className="input" />
            </div>
            <button type="submit" className="btn-outline">تغییر رمز عبور</button>
          </form>
        </div>
      </div>
    </div>
  );
}
