import { prisma } from '@/lib/db';
import { RoleEditor } from '@/components/admin/RoleEditor';
import { Flash } from '@/components/ui';

export const metadata = { title: 'نقش‌ها و دسترسی‌ها' };

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ flash?: string; err?: string }> }) {
  const sp = await searchParams;
  const [roles, permissions, rolePerms] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: 'asc' } }),
    prisma.permission.findMany({ orderBy: { slug: 'asc' } }),
    prisma.rolePermission.findMany()
  ]);

  const selectedFor = (roleId: string) =>
    rolePerms.filter((rp) => rp.roleId === roleId).map((rp) => rp.permissionId);

  return (
    <div>
      <h1 className="mb-6 text-xl font-extrabold text-slate-900">نقش‌ها و دسترسی‌ها</h1>
      <Flash searchParams={sp} />
      <div className="space-y-4">
        {roles.map((r) => (
          <RoleEditor key={r.id} role={r} permissions={permissions} selected={selectedFor(r.id)} />
        ))}
      </div>
    </div>
  );
}
