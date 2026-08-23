import { prisma } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata = { title: 'محصول جدید' };

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }] })
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">محصول جدید</h1>
      <ProductForm product={null} options={{ brands, categories }} />
    </div>
  );
}
