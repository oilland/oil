#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  روغن‌لند — نصب کاملاً خودکار روی VPS (اوبونتو)
#
#  فقط این یک دستور را روی سرور بزن:
#    bash <(curl -fsSL https://raw.githubusercontent.com/oilland/oil/main/deploy/install.sh)
#
#  خودش همه‌چیز را انجام می‌دهد:
#    Docker + فایروال + گرفتن پروژه + ساخت رمزها + آوردن دیتا از لیارا + روشن‌کردن سایت
#
#  تنها چیزی که وسط کار از تو می‌پرسد:
#    ۱) آدرس دیتابیس لیارا  (روی همین سرور paste می‌کنی، نه جای دیگر)
#    ۲) دامنه (اختیاری — می‌توانی خالی رد کنی و بعداً وصل کنی)
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REPO="https://github.com/oilland/oil.git"
DIR="${HOME}/oil"
COMPOSE_FILE="docker-compose.vps.yml"
say(){ printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
ok(){  printf "\033[1;32m✅ %s\033[0m\n" "$*"; }
warn(){ printf "\033[1;33m⚠ %s\033[0m\n" "$*"; }
ask(){ # ask "پرسش" -> مقدار در REPLY (از ترمینال می‌خواند حتی وقتی اسکریپت pipe شده)
  printf "\033[1;35m%s\033[0m " "$1" > /dev/tty
  read -r REPLY < /dev/tty
}
asksecret(){
  printf "\033[1;35m%s\033[0m " "$1" > /dev/tty
  read -rs REPLY < /dev/tty
  printf "\n" > /dev/tty
}

SUDO=""
[ "$(id -u)" -ne 0 ] && SUDO="sudo"

echo "════════════════════════════════════════════"
echo "  نصب خودکار فروشگاه روغن‌لند روی این سرور"
echo "════════════════════════════════════════════"

# ── ۱) بسته‌های پایه ────────────────────────────────────────
say "۱/۷ نصب ابزارهای پایه (git, curl, ufw, postgresql-client)…"
export DEBIAN_FRONTEND=noninteractive
$SUDO apt-get update -y
$SUDO apt-get install -y git curl ufw postgresql-client ca-certificates

# ── ۲) Docker ───────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  say "۲/۷ نصب Docker…"
  curl -fsSL https://get.docker.com | $SUDO sh
else
  ok "Docker از قبل نصب است."
fi

# ── ۳) فایروال ─────────────────────────────────────────────
say "۳/۷ باز کردن پورت‌های لازم (22, 80, 443, 3000)…"
$SUDO ufw allow 22/tcp   || true
$SUDO ufw allow 80/tcp   || true
$SUDO ufw allow 443/tcp  || true
$SUDO ufw allow 3000/tcp || true
$SUDO ufw --force enable || true

# ── ۴) گرفتن/به‌روزرسانی پروژه ──────────────────────────────
say "۴/۷ آماده‌سازی سورس پروژه…"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only || true
else
  git clone "$REPO" "$DIR"
fi
cd "$DIR"

# ── ۵) ساخت فایل .env با رمزهای تصادفی ─────────────────────
say "۵/۷ ساخت تنظیمات و رمزهای امن…"
if [ -f .env ]; then
  ok "فایل .env از قبل هست — دست نمی‌زنم."
else
  DB_PASS="$(openssl rand -hex 16)"
  SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
POSTGRES_PASSWORD=${DB_PASS}
AUTH_SECRET=${SECRET}
APP_URL=http://localhost:3000
SITE_ADDRESS=:80
EOF
  ok "رمزها ساخته و در .env ذخیره شدند."
fi

# ── ۶) آوردن دیتا و عکس‌ها از لیارا ─────────────────────────
say "۶/۷ انتقال دیتا و عکس‌ها از لیارا"
if [ -n "${LIARA_DB_URL:-}" ]; then
  LIARA_URL="$LIARA_DB_URL"   # از قبل داده شده (حالت یک‌کلیک)
elif [ "${NONINTERACTIVE:-0}" != "1" ] && [ -e /dev/tty ]; then
  echo "   (اگر قبلاً این کار را کرده‌ای، می‌توانی رد کنی.)" > /dev/tty
  ask "آدرس دیتابیس لیارا را paste کن (یا Enter برای رد شدن):"
  LIARA_URL="$REPLY"
else
  LIARA_URL=""
fi
if [ -n "$LIARA_URL" ]; then
  say "گرفتن نسخهٔ کامل از لیارا…"
  pg_dump --no-owner --no-privileges --clean --if-exists "$LIARA_URL" > /tmp/oilland.sql
  ok "دریافت شد: $(du -h /tmp/oilland.sql | cut -f1)"
  say "بالا آوردن دیتابیس روی سرور…"
  docker compose -f "$COMPOSE_FILE" up -d db
  sleep 8
  say "وارد کردن داده‌ها…"
  docker compose -f "$COMPOSE_FILE" exec -T db psql -U oilshop -d oilshop < /tmp/oilland.sql
  rm -f /tmp/oilland.sql
  ok "دیتا و همهٔ عکس‌ها منتقل شد."
else
  warn "انتقال دیتا رد شد. (اگر دیتابیس خالی بماند، سایت با داده‌های پیش‌فرض بالا می‌آید.)"
fi

# ── ۷) ساخت و روشن‌کردن کل سایت ────────────────────────────
say "۷/۷ ساخت و روشن‌کردن سایت (چند دقیقه طول می‌کشد)…"
docker compose -f "$COMPOSE_FILE" up -d --build

# ── دامنه (اختیاری) ────────────────────────────────────────
IP="$(curl -fsSL https://api.ipify.org 2>/dev/null || echo 'IP_SERVER')"
if [ -z "${DOMAIN:-}" ] && [ "${NONINTERACTIVE:-0}" != "1" ] && [ -e /dev/tty ]; then
  echo "" > /dev/tty
  ask "دامنه‌ات را بنویس (مثلاً oilland.shop) یا Enter برای بعداً:"
  DOMAIN="$REPLY"
fi
if [ -n "${DOMAIN:-}" ]; then
  sed -i "s|^SITE_ADDRESS=.*|SITE_ADDRESS=${DOMAIN}|" .env
  sed -i "s|^APP_URL=.*|APP_URL=https://${DOMAIN}|" .env
  docker compose -f "$COMPOSE_FILE" up -d
  ok "دامنه تنظیم شد. مطمئن شو رکورد A دامنه به ${IP} اشاره کند."
fi

echo ""
echo "════════════════════════════════════════════"
ok "نصب تمام شد! 🎉"
echo "   • تست با IP:     http://${IP}:3000"
[ -n "${DOMAIN:-}" ] && echo "   • دامنه:         https://${DOMAIN}  (چند دقیقه تا صدور HTTPS)"
echo "   • پنل ادمین:     http://${IP}:3000/admin"
echo "   • دیدن لاگ:      docker compose -f ${COMPOSE_FILE} logs -f app"
echo "════════════════════════════════════════════"
echo "  لیارا را تا اطمینان کامل از سرور جدید خاموش نکن."
echo "════════════════════════════════════════════"
