import { prisma } from '@/lib/db';
import { BlogForm } from '@/components/admin/BlogForm';

export const metadata = { title: 'مقاله جدید' };

export default async function NewBlogPostPage() {
  const categories = await prisma.blogCategory.findMany({ orderBy: { name: 'asc' } });
  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">مقاله جدید</h1>
      <BlogForm post={null} categories={categories} />
    </div>
  );
}
