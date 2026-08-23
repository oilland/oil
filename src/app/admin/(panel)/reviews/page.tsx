import { prisma } from '@/lib/db';
import { moderateReview, deleteReview } from '@/actions/admin-other';
import { formatDate } from '@/lib/format';
import { Flash, Stars, StatusPill } from '@/components/ui';
import { REVIEW_STATUSES } from '@/lib/constants';
import { IconTrash } from '@/components/icons';

export const metadata = { title: 'دیدگاه‌ها' };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { product: { select: { id: true, name: true } } }
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">مدیریت دیدگاه‌ها</h1>
      <Flash searchParams={sp} />

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-800">{r.name}</span>
                <StatusPill value={r.status} items={REVIEW_STATUSES} />
                <Stars rating={r.rating} className="h-3.5 w-3.5" />
                <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
              </div>
              <p className="text-xs text-slate-500">محصول: <span className="font-medium text-slate-700">{r.product.name}</span></p>
              {r.title && <p className="mt-1 text-sm font-semibold text-slate-700">{r.title}</p>}
              <p className="mt-1 text-sm leading-7 text-slate-600">{r.body}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {r.status !== 'approved' && (
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="approved" />
                  <button className="btn-primary h-9 !py-1.5 text-xs">تایید</button>
                </form>
              )}
              {r.status !== 'rejected' && (
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button className="btn-outline h-9 !py-1.5 text-xs">رد</button>
                </form>
              )}
              <form action={deleteReview}>
                <input type="hidden" name="id" value={r.id} />
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="حذف">
                  <IconTrash className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="card p-8 text-center text-sm text-slate-400">دیدگاهی ثبت نشده است.</p>}
      </div>
    </div>
  );
}
