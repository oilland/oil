// Next.js instrumentation — runs ONCE when the server boots.
// Triggers the self-contained DB bootstrap (create tables + seed products)
// so no console/CLI step is ever needed.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupDatabase } = await import('@/lib/db-setup');
    // fire-and-forget: server starts immediately, DB is ready a few seconds later
    setupDatabase().catch(() => {});
  }
}
