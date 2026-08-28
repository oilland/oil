import Link from 'next/link';
import { saveBlogPost } from '@/actions/admin-marketing';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { IconArrowRight } from '@/components/icons';

type Post = {
  id?: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  categoryId: string | null;
  tags: string | null;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export function BlogForm({
  post,
  categories
}: {
  post: Post | null;
  categories: { id: string; name: string }[];
}) {
  return (
    <form action={saveBlogPost} className="space-y-6">
      {post?.id && <input type="hidden" name="id" value={post.id} />}

      <div className="card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">عنوان مقاله *</label>
            <input name="title" defaultValue={post?.title} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">خلاصه</label>
            <input name="excerpt" defaultValue={post?.excerpt ?? ''} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">متن مقاله</label>
            <textarea
              name="content"
              rows={16}
              defaultValue={post?.content ?? ''}
              className="input resize-y leading-7"
              placeholder="متن را با پاراگراف بنویسید. بین پاراگراف‌ها یک خط خالی بگذارید. HTML هم قبول است."
            />
          </div>
          <div>
            <label className="label">دسته‌بندی</label>
            <select name="categoryId" defaultValue={post?.categoryId ?? ''} className="input">
              <option value="">بدون دسته</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">تصویر کاور</label>
            <ImageUploader name="coverImage" defaultValue={post?.coverImage ?? ''} label="کاور مقاله" />
          </div>
          <div>
            <label className="label">برچسب‌ها (با ویرگول جدا کنید)</label>
            <input name="tags" defaultValue={post?.tags ?? ''} className="input" placeholder="روغن موتور, راهنما" />
          </div>
          <div>
            <label className="label">وضعیت</label>
            <select name="status" defaultValue={post?.status ?? 'draft'} className="input">
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشر شده</option>
            </select>
          </div>
          <div>
            <label className="label">عنوان سئو</label>
            <input name="seoTitle" defaultValue={post?.seoTitle ?? ''} className="input" />
          </div>
          <div>
            <label className="label">توضیحات متا</label>
            <input name="seoDescription" defaultValue={post?.seoDescription ?? ''} className="input" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/admin/blog" className="btn-ghost"><IconArrowRight className="h-4 w-4" /> بازگشت</Link>
        <button type="submit" className="btn-primary !px-8">ذخیره مقاله</button>
      </div>
    </form>
  );
}
