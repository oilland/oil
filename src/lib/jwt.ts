// Edge-safe JWT helpers (used by middleware and server code)
import { SignJWT, jwtVerify } from 'jose';

const secret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me-in-production');

export interface SessionPayload {
  sub: string;
  name: string;
  role: string;
  perms: string[];
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ name: payload.name, role: payload.role, perms: payload.perms })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: (payload.sub as string) || '',
      name: (payload.name as string) || '',
      role: (payload.role as string) || '',
      perms: Array.isArray(payload.perms) ? (payload.perms as string[]) : []
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'session';
