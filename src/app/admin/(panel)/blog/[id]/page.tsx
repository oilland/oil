import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { BlogForm } from '@/components/admin/BlogForm';

export const metadata = { title: 'ویرایش مقاله' };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({ where: { id } }),
    prisma.blogCategory.findMany({ orderBy: { name: 'asc' } })
  ]);
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">ویرایش مقاله</h1>
      <BlogForm post={post} categories={categories} />
    </div>
  );
}
