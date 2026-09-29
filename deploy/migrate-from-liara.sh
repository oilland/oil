#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  روغن‌لند — انتقال کامل دیتا و عکس‌ها از لیارا به سرور جدید
#
#  این اسکریپت را روی «سرور جدید» اجرا کن، بعد از اینکه فقط
#  سرویس دیتابیس بالا آمده باشد و قبل از روشن‌کردن اپ.
#
#  استفاده:
#     bash deploy/migrate-from-liara.sh "DATABASE_URL_لیارا"
#
#  آدرس دیتابیس لیارا را از کنسول لیارا بردار. مثال شکل آن:
#     postgresql://root:PASSWORD@HOST:PORT/DBNAME
#
#  هشدار: آدرس دیتابیس رمز دارد؛ فقط روی سرور خودت اجرا کن،
#         جایی paste نکن و در گیت‌هاب/چت نگذار.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SRC="${1:-}"
COMPOSE="docker compose -f docker-compose.vps.yml"

if [ -z "$SRC" ]; then
  echo "✖ آدرس دیتابیس لیارا را بده:"
  echo "   bash deploy/migrate-from-liara.sh \"postgresql://root:PASS@HOST:PORT/DB\""
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "▶ نصب ابزار pg_dump…"
  sudo apt-get update -y && sudo apt-get install -y postgresql-client
fi

echo "▶ ۱/۳ گرفتن نسخهٔ کامل از دیتابیس لیارا (شامل همهٔ عکس‌ها)…"
pg_dump --no-owner --no-privileges --clean --if-exists "$SRC" > /tmp/oilland.sql
echo "   حجم فایل: $(du -h /tmp/oilland.sql | cut -f1)"

echo "▶ ۲/۳ بالا آوردن فقط دیتابیس روی سرور جدید…"
$COMPOSE up -d db
echo "   کمی صبر تا دیتابیس آماده شود…"
sleep 8

echo "▶ ۳/۳ وارد کردن داده‌ها به دیتابیس جدید…"
$COMPOSE exec -T db psql -U oilshop -d oilshop < /tmp/oilland.sql

echo ""
echo "✅ انتقال کامل شد. حالا کل سایت را روشن کن:"
echo "   $COMPOSE up -d --build"
