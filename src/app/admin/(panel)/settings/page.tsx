import { getSettings } from '@/lib/settings';
import { saveSettings } from '@/actions/admin-settings';
import { Flash } from '@/components/ui';
import { ImageUploader } from '@/components/admin/ImageUploader';

export const metadata = { title: 'تنظیمات' };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const input = 'input h-10 rounded-lg';

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">تنظیمات فروشگاه</h1>
      <Flash searchParams={sp} />

      <form action={saveSettings} className="space-y-6">
        <div className="card p-6">
          <h2 className="mb-5 text-base font-extrabold text-slate-900">اطلاعات فروشگاه</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="نام فروشگاه" name="storeName" value={s.storeName} input={input} />
            <Field label="شعار فروشگاه" name="storeSlogan" value={s.storeSlogan} input={input} />
            <Field label="واحد پول" name="currencyLabel" value={s.currencyLabel} input={input} />
            <Field label="تلفن" name="phone" value={s.phone} input={input} ltr />
            <Field label="ایمیل" name="email" value={s.email} input={input} ltr />
            <Field label="ساعات کاری" name="workingHours" value={s.workingHours} input={input} />
            <Field label="آدرس" name="address" value={s.address} input={input} full />
            <Field label="آستانه ارسال رایگان (تومان)" name="freeShippingThreshold" value={String(s.freeShippingThreshold)} input={input} type="number" />
            <Field label="متن درباره ما (فوتر)" name="footerAbout" value={s.footerAbout} input={input} full />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-5 text-base font-extrabold text-slate-900">برندینگ (لوگو و فاوآیکون)</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="label">لوگوی سایت (هدر، فوتر و پنل)</label>
              <ImageUploader name="logoUrl" defaultValue={s.logoUrl} label="لوگو" />
            </div>
            <div>
              <label className="label">فاوآیکون (آیکون تب مرورگر)</label>
              <ImageUploader name="faviconUrl" defaultValue={s.faviconUrl} label="فاوآیکون" />
            </div>
            <div>
              <label className="label" htmlFor="primaryColor">رنگ اصلی سایت</label>
              <input id="primaryColor" name="primaryColor" type="color" defaultValue={s.primaryColor} className="h-10 w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-1" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-5 text-base font-extrabold text-slate-900">پرداخت کارت به کارت</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="نام بانک (مثلاً بانک ملت)" name="cardBankName" value={s.cardBankName} input={input} />
            <Field label="نام و نام خانوادگی صاحب کارت" name="cardHolderName" value={s.cardHolderName} input={input} />
            <Field label="شماره کارت (۱۶ رقم)" name="cardNumber" value={s.cardNumber} input={input} ltr />
            <Field label="شماره شبا" name="cardSheba" value={s.cardSheba} input={input} ltr />
            <Field label="اپلیکیشن دریافت فیش (واتساپ/تلگرام/ایتا…)" name="receiptApp" value={s.receiptApp} input={input} />
            <Field label="شمارهٔ دریافت فیش" name="receiptNumber" value={s.receiptNumber} input={input} ltr />
            <Field label="توضیح برای مشتری (اختیاری)" name="cardNote" value={s.cardNote} input={input} full />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-5 text-base font-extrabold text-slate-900">سئو</h2>
          <div className="grid grid-cols-1 gap-4">
            <Field label="عنوان پیش‌فرض سایت" name="metaTitle" value={s.metaTitle} input={input} full />
            <Field label="توضیحات متا" name="metaDescription" value={s.metaDescription} input={input} full />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-5 text-base font-extrabold text-slate-900">شبکه‌های اجتماعی</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="اینستاگرام" name="instagram" value={s.instagram} input={input} ltr />
            <Field label="تلگرام" name="telegram" value={s.telegram} input={input} ltr />
            <Field label="واتساپ" name="whatsapp" value={s.whatsapp} input={input} ltr />
            <Field label="آپارات" name="aparat" value={s.aparat} input={input} ltr />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-5 text-base font-extrabold text-slate-900">سایر</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="maintenanceMode" defaultChecked={s.maintenanceMode} className="h-4 w-4 accent-brand-700" />
            حالت تعمیر و نگهداری (سایت فقط برای مدیران در دسترس باشد)
          </label>
        </div>

        <button type="submit" className="btn-primary !px-10">ذخیره همه تنظیمات</button>
      </form>
    </div>
  );
}

function Field({ label, name, value, input, full, ltr, type }: { label: string; name: string; value: string; input: string; full?: boolean; ltr?: boolean; type?: string }) {
  return (
    <div className={full ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type ?? 'text'} defaultValue={value} className={input} dir={ltr ? 'ltr' : undefined} />
    </div>
  );
}
