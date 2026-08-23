#!/bin/sh
# Container entrypoint: sync/migrate DB + idempotent seed, then start the app.
set -e
cd /app

echo "==> DATABASE_URL = ${DATABASE_URL}"

case "$DATABASE_URL" in
  postgres://*|postgresql://*)
    echo "==> [PostgreSQL] applying migrations…"
    npx prisma migrate deploy
    ;;
  *)
    echo "==> [SQLite] syncing schema…"
    npx prisma db push --skip-generate --accept-data-loss
    ;;
esac

echo "==> Seeding (idempotent — skips when data exists)…"
npx tsx prisma/seed.ts || echo "(!) seed skipped"

echo "==> Starting app on 0.0.0.0:3000"
exec npx next start -H 0.0.0.0 -p 3000
