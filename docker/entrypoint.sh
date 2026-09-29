#!/bin/sh
# Container entrypoint: sync/migrate DB + idempotent seed, then start the app.
set -e
cd /app

echo "==> DATABASE_URL = ${DATABASE_URL}"

case "$DATABASE_URL" in
  postgres://*|postgresql://*)
    echo "==> [PostgreSQL] applying migrations…"
    if ! npx prisma migrate deploy > /tmp/mig.log 2>&1; then
      cat /tmp/mig.log
      if grep -q "P3005" /tmp/mig.log; then
        echo "==> پایگاه‌داده از قبل جدول دارد (db push). baseline می‌کنیم…"
        for d in prisma/migrations/*/; do
          [ -d "$d" ] || continue
          npx prisma migrate resolve --applied "$(basename "$d")" || true
        done
        npx prisma migrate deploy
      else
        exit 1
      fi
    else
      cat /tmp/mig.log
    fi
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
