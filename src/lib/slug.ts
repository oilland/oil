/** Decode a URL-encoded slug param safely (no-op if already decoded). */
export function decodeSlug(slug: string): string {
  try {
    const d = decodeURIComponent(slug);
    return d;
  } catch {
    return slug;
  }
}

/** Slugify a title — keeps latin, digits and Persian letters, replaces separators. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '') // keep word chars, Persian range, spaces, dashes
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  prefix = ''
): Promise<string> {
  let slug = `${prefix}${slugify(base)}`.replace(/^-|-$/g, '') || `item-${Date.now()}`;
  if (!(await exists(slug))) return slug;
  let i = 2;
  while (await exists(`${slug}-${i}`)) i += 1;
  return `${slug}-${i}`;
}
