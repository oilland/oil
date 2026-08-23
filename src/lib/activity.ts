import { prisma } from './db';

export async function logActivity(input: {
  userId?: string;
  adminName?: string;
  action: string;
  entity?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        adminName: input.adminName ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null
      }
    });
  } catch {
    /* never let logging break the main flow */
  }
}
