# ─────────────────────────────────────────────────────────────
#  روغن‌لند — نصب «یک‌کلیک» از ویندوز روی سرور
#
#  این فایل را روی کامپیوتر خودت اجرا کن (نه روی سرور).
#  ازت می‌پرسد: آی‌پی سرور + رمز root + آدرس دیتابیس لیارا + دامنه (اختیاری)
#  بعد خودش به سرور وصل می‌شود و کل نصب را انجام می‌دهد.
#
#  اجرا: روی فایل oneclick.cmd دابل‌کلیک کن (ساده‌ترین راه)
#        یا: راست‌کلیک روی این فایل → Run with PowerShell
# ─────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
chcp 65001 > $null   # پشتیبانی از فارسی در کنسول

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   نصب یک‌کلیک فروشگاه روغن‌لند روی سرور" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── گرفتن اطلاعات از کاربر ──────────────────────────────────
$IP = Read-Host "۱) آی‌پی سرور (مثلاً 87.107.160.106)"
if ([string]::IsNullOrWhiteSpace($IP)) { Write-Host "آی‌پی خالی است. لغو شد." -ForegroundColor Red; Read-Host "Enter بزن"; exit 1 }

$PwSecure = Read-Host "۲) رمز root سرور" -AsSecureString
$Pw = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($PwSecure))

$Db = Read-Host "۳) آدرس دیتابیس لیارا (postgresql://... — یا Enter برای رد شدن)"
$Domain = Read-Host "۴) دامنه (مثلاً oilland.shop — یا Enter برای بعداً)"

# ── آماده‌سازی ابزار اتصال (plink) ─────────────────────────
$plink = Join-Path $env:TEMP "plink.exe"
if (-not (Test-Path $plink)) {
  Write-Host ""
  Write-Host "در حال دانلود ابزار اتصال (plink)..." -ForegroundColor Yellow
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe" -OutFile $plink
  } catch {
    Write-Host "دانلود plink ناموفق بود. اینترنتت را چک کن یا VPN را عوض کن." -ForegroundColor Red
    Read-Host "Enter بزن"; exit 1
  }
}

# ── ساخت دستور نصب که روی سرور اجرا می‌شود ─────────────────
$remote = "export NONINTERACTIVE=1; export LIARA_DB_URL='$Db'; export DOMAIN='$Domain'; curl -fsSL https://raw.githubusercontent.com/oilland/oil/main/deploy/install.sh | bash"

Write-Host ""
Write-Host "در حال اتصال به سرور و نصب کامل..." -ForegroundColor Green
Write-Host "(این کار چند دقیقه طول می‌کشد — صبور باش و پنجره را نبند)" -ForegroundColor DarkGray
Write-Host ""

# "y" برای پذیرش کلید امنیتی سرور در اولین اتصال
"y" | & $plink -ssh -pw $Pw "root@$IP" $remote
$code = $LASTEXITCODE

Write-Host ""
if ($code -eq 0) {
  Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
  Write-Host " ✅ نصب تمام شد!" -ForegroundColor Green
  Write-Host "    سایت را باز کن:  http://$IP:3000" -ForegroundColor Green
  Write-Host "    پنل ادمین:       http://$IP:3000/admin" -ForegroundColor Green
  Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
} else {
  Write-Host "⚠ اتصال/نصب کامل نشد (کد $code)." -ForegroundColor Yellow
  Write-Host "  محتمل‌ترین دلیل‌ها:" -ForegroundColor Yellow
  Write-Host "   • سرور هنوز «Network Suspended» است → اول با مبین‌هاست حلش کن." -ForegroundColor Yellow
  Write-Host "   • رمز root اشتباه است." -ForegroundColor Yellow
  Write-Host "   • VPN روشن است → خاموشش کن و دوباره اجرا کن." -ForegroundColor Yellow
}
Write-Host ""
Read-Host "برای بستن، Enter بزن"
