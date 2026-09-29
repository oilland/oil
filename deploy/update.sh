#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  روغن‌لند — به‌روزرسانی سایت روی سرور با یک دستور
#
#  استفاده (روی سرور):   bash ~/oil/deploy/update.sh
#  یا از کامپیوتر خودت:  ssh root@IP "bash ~/oil/deploy/update.sh"
#
#  کار: آخرین کد را از گیت‌هاب می‌گیرد، دوباره build و اجرا می‌کند.
#  دیتا و عکس‌ها (در دیتابیس) دست‌نخورده می‌مانند.
# ─────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."   # → پوشهٔ پروژه (~/oil)

COMPOSE="docker-compose.vps.yml"

echo "▶ گرفتن آخرین تغییرات از گیت‌هاب…"
git fetch origin
git reset --hard origin/main      # سرور دقیقاً برابر گیت‌هاب می‌شود

echo "▶ ساخت و اجرای مجدد (دیتا حفظ می‌شود)…"
docker compose -f "$COMPOSE" up -d --build

echo "▶ آخرین لاگ:"
sleep 5
docker compose -f "$COMPOSE" logs --tail=15 app

echo ""
echo "✅ به‌روزرسانی انجام شد."
