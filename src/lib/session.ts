// Node-runtime session helpers (server components, actions, route handlers)
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { signSession, verifySession, SESSION_COOKIE, SessionPayload } from './jwt';

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // SameSite=None + Secure → the cookie must work inside a cross-site iframe
    // (the live preview runs the app embedded in the platform UI).
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
