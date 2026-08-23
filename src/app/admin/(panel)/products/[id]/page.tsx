import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata = { title: 'ویرایش محصول' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } }, specs: { orderBy: { sortOrder: 'asc' } } }
    }),
    prisma.brand.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }] })
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">ویرایش محصول</h1>
      <ProductForm product={product} options={{ brands, categories }} />
    </div>
  );
}
