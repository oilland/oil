#!/usr/bin/env node
// خروجی کامل: زیپ لیارا + ارسال همان تغییرات به گیت‌هاب
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const ZIP = '/home/user/oilland-liara.zip';

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', ...opts });
}

const msg =
  process.argv.slice(2).join(' ').trim() ||
  `به‌روزرسانی سایت — ${new Date().toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}`;

console.log('▶ ساخت زیپ لیارا…');
try {
  if (fs.existsSync(ZIP)) fs.unlinkSync(ZIP);
} catch {
  /* ignore */
}
run(
  `zip -rq ${ZIP} . -x "node_modules/*" ".next/*" ".git/*" ".env" "*.log" "tsconfig.tsbuildinfo" "package-lock.json" ".git-push-token"`
);
const size = fs.statSync(ZIP).size;
console.log(`✅ زیپ آماده: ${ZIP} (${(size / 1024 / 1024).toFixed(1)}M)`);

console.log('\n▶ ارسال به گیت‌هاب…');
try {
  execSync(`node scripts/push.js "${msg.replace(/"/g, "'")}"`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, SKIP_AUTO_PUSH: '1' }
  });
  console.log('\n✅ زیپ + گیت‌هاب هر دو انجام شد.');
} catch {
  console.error('\n⚠ زیپ ساخته شد، ولی گیت‌هاب بدون توکن نرفت.');
  console.error('یک‌بار npm run github را باز کن و دکمه سبز را بزن.');
  process.exit(2);
}
