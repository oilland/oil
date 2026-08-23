import { SessionPayload } from './jwt';

export const SUPER_ROLES = ['SUPER_ADMIN'];

export function hasPermission(session: SessionPayload | null, perm: string): boolean {
  if (!session) return false;
  if (SUPER_ROLES.includes(session.role)) return true;
  return session.perms.includes(perm);
}

export function requirePermission(session: SessionPayload | null, perm: string) {
  if (!hasPermission(session, perm)) {
    throw new Error('FORBIDDEN');
  }
}
