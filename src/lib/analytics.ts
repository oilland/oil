import { randomBytes } from 'node:crypto';
import { prisma } from './db';

export function tehranDayStr(): string {
  return new Date().toLocaleString('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function addDaysStr(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function ensureAnalyticsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AnalyticsDaily" (
      "id" TEXT NOT NULL,
      "day" DATE NOT NULL,
      "kind" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "views" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "AnalyticsDaily_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsDaily_day_kind_key_key" ON "AnalyticsDaily"("day", "kind", "key")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "AnalyticsDaily_day_kind_idx" ON "AnalyticsDaily"("day", "kind")`
  );
}

function nid() {
  return randomBytes(12).toString('hex');
}

export function cleanPath(raw: string): string | null {
  let p = (raw || '/').split('?')[0].split('#')[0].trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 180) p = p.slice(0, 180);
  if (/^\/(admin|api|account|_next|uploads)\b/.test(p)) return null;
  return p || '/';
}

export function cleanRefHost(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (!host || host.endsWith('oilland.shop') || host === 'localhost') return null;
    return host.slice(0, 80);
  } catch {
    return null;
  }
}

export function isBot(ua: string): boolean {
  return /bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram|pingdom|lighthouse/i.test(ua);
}

async function bump(day: string, kind: string, key: string, increment = 1) {
  await prisma.$executeRaw`
    INSERT INTO "AnalyticsDaily" (id, day, kind, key, views)
    VALUES (${nid()}, CAST(${day} AS DATE), ${kind}, ${key}, ${increment})
    ON CONFLICT (day, kind, key) DO UPDATE SET views = "AnalyticsDaily".views + EXCLUDED.views
  `;
}

export async function recordVisit(opts: { path: string; referrer?: string; visitorId: string }) {
  await ensureAnalyticsTable();
  const path = cleanPath(opts.path);
  if (!path) return;
  const day = tehranDayStr();
  await bump(day, 'path', path, 1);
  const ref = cleanRefHost(opts.referrer || '');
  if (ref) await bump(day, 'ref', ref, 1);
  await prisma.$executeRaw`
    INSERT INTO "AnalyticsDaily" (id, day, kind, key, views)
    VALUES (${nid()}, CAST(${day} AS DATE), ${'uniq'}, ${opts.visitorId}, 1)
    ON CONFLICT (day, kind, key) DO NOTHING
  `;
}

export async function analyticsRange(from: string, to: string) {
  await ensureAnalyticsTable();
  const rows = await prisma.$queryRaw<{ kind: string; key: string; views: number; day: Date }[]>`
    SELECT kind, key, views, day FROM "AnalyticsDaily"
    WHERE day >= CAST(${from} AS DATE) AND day <= CAST(${to} AS DATE)
  `;
  return rows;
}
