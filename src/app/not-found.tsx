import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import { IconAlert } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <EmptyState icon={<IconAlert className="h-7 w-7" />} title="صفحه موردنظر یافت نشد" message="آدرس وارد شده وجود ندارد یا جابه‌جا شده است.">
          <Link href="/" className="btn-primary">بازگشت به صفحه اصلی</Link>
        </EmptyState>
      </div>
    </div>
  );
}
