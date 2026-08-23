import { redirect } from 'next/navigation';

export function redirectWithFlash(path: string, message: string, isError = false) {
  const key = isError ? 'err' : 'flash';
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}${key}=${encodeURIComponent(message)}`);
}
