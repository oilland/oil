// Bootstrap: runs the self-contained DB setup (create tables + seed) once,
// then exits. Called by scripts/start.js before booting Next.js.
import { setupDatabase } from '../src/lib/db-setup';
import { prisma } from '../src/lib/db';

async function main() {
  const result = await setupDatabase();
  if (result.ok) {
    let products = -1;
    try {
      products = await prisma.product.count();
    } catch {
      /* ignore */
    }
    console.log(`[bootstrap] ✅ دیتابیس آماده است — ${products} محصول`);
    await prisma.$disconnect();
    process.exit(0);
  } else {
    console.error(`[bootstrap] ✖ ${result.error}`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
