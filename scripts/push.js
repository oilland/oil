#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  ارسال خودکار تغییرات به گیت‌هاب
//
//  استفاده:
//    npm run push                        ← پیام خودکار با تاریخ
//    npm run push -- "پیام دلخواه"       ← پیام کامیت دلخواه
//
//  کارها: تنظیم ریموت در صورت نیاز → git add -A → commit → push
//  هوک post-commit هم بعد از هر کامیت (حتی دستی) push می‌کند.
// ─────────────────────────────────────────────────────────────────────────────
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_REMOTE = 'https://github.com/oilland/oil.git';

const sh = (cmd, opts = {}) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8', cwd: ROOT, ...opts }).trim();
const run = (cmd, extraEnv = {}) =>
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, env: { ...process.env, SKIP_AUTO_PUSH: '1', ...extraEnv } });

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

try {
  sh('git --version');
} catch {
  fail('git نصب نیست. از https://git-scm.com نصبش کن.');
}

try {
  sh('git rev-parse --is-inside-work-tree');
} catch {
  console.log('ℹ ریپوی گیت پیدا نشد — در حال ساخت…');
  run('git init');
  run('git branch -M main');
}

try {
  sh('git config user.name');
} catch {
  run('git config user.name "OilLand"');
}
try {
  sh('git config user.email');
} catch {
  run('git config user.email "oilland@users.noreply.github.com"');
}

let remote = '';
try {
  remote = sh('git remote get-url origin');
} catch {
  console.log(`ℹ ریموت origin نبود — اضافه شد: ${DEFAULT_REMOTE}`);
  run(`git remote add origin ${DEFAULT_REMOTE}`);
  remote = DEFAULT_REMOTE;
}

try {
  run('node scripts/install-hooks.js');
} catch {
  /* هوک اختیاری است */
}

const msg =
  process.argv.slice(2).join(' ').trim() ||
  `به‌روزرسانی سایت — ${new Date().toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}`;

run('git add -A');

const staged = sh('git status --porcelain');
if (!staged) {
  console.log('ℹ تغییری برای کامیت نیست — فقط push می‌کنم…');
} else {
  try {
    run(`git commit -m "${msg.replace(/"/g, "'")}"`);
  } catch {
    fail(
      'کامیت ناموفق بود. اگر بار اول است، نام/ایمیل گیت را تنظیم کن:\n  git config user.name  "نام تو"\n  git config user.email "you@example.com"'
    );
  }
}

const branch = sh('git rev-parse --abbrev-ref HEAD') || 'main';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

console.log(`\n▶ push به ${remote} (شاخه ${branch})…`);
try {
  if (token && /github\.com/.test(remote)) {
    const auth = remote.replace('https://', `https://x-access-token:${token}@`);
    run(`git push -u ${auth} ${branch}`);
  } else {
    run(`git push -u origin ${branch}`);
  }
} catch {
  fail(`push ناموفق بود. موارد رایج:
  • لاگین نبودن به گیت‌هاب → یک Personal Access Token بساز
    (github.com → Settings → Developer settings → Tokens)
    و موقع سوال رمز، توکن را وارد کن.
    یا:  GITHUB_TOKEN=ghp_xxx npm run push
  • ریموت جلوتر است → اول:  git pull --rebase origin ${branch}
  • فعلاً می‌توانی زیپ لیارا را درگ کنی — محتوا/عکس‌های پنل در دیتابیس می‌مانند.`);
}

console.log(`
✅ تغییرات رفت روی گیت‌هاب!
   پیام کامیت: ${msg}
   ${remote.includes('github.com') ? '🚀 اگر لیارا به این ریپو وصل باشد، دیپلوی خودکار تا چند دقیقه دیگر انجام می‌شود.' : ''}
`);
