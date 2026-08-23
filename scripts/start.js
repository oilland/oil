// ─────────────────────────────────────────────────────────────────────────────
//  Auto-start: boots the DB (via the embedded, CLI-free bootstrap) and then
//  starts the Next.js server. No prisma CLI needed at runtime.
// ─────────────────────────────────────────────────────────────────────────────
const { execSync, spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const bin = (name) => path.join(process.cwd(), 'node_modules', '.bin', name);
const cmdFor = (name) => {
  const local = bin(name);
  return fs.existsSync(local) ? `"${local}"` : `npx ${name}`;
};

function maskUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username}:***@${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return url ? '(invalid)' : '(NOT SET)';
  }
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { /* block briefly */ }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  console.log('═══════════════════════════════════════');
  console.log('▶ OIL SHOP auto-start');
  console.log(`▶ DATABASE_URL = ${maskUrl(dbUrl)}`);
  console.log('═══════════════════════════════════════');

  // 1) bootstrap DB (retry up to 6 times — DB may be warming up)
  let ready = false;
  for (let i = 1; i <= 6 && !ready; i++) {
    console.log(`\n▶ آماده‌سازی دیتابیس (تلاش ${i}/6)…`);
    try {
      execSync(`${cmdFor('tsx')} scripts/bootstrap.ts`, { stdio: 'inherit' });
      ready = true;
    } catch (e) {
      console.error(`✖ آماده‌سازی دیتابیس ناموفق (تلاش ${i}/6)`);
      if (i < 6) {
        console.log('⏳ 5 ثانیه صبر…');
        sleep(5000);
      }
    }
  }

  if (!ready) {
    console.error('\n✖ دیتابیس آماده نشد — سرور بالا می‌آید تا خطا قابل مشاهده باشد.');
  }

  // 2) start Next.js
  const port = process.env.PORT || '3000';
  console.log(`\n▶ شروع Next.js روی 0.0.0.0:${port}`);
  const child = spawn(cmdFor('next'), ['start', '-H', '0.0.0.0', '-p', port], {
    stdio: 'inherit',
    shell: true
  });
  child.on('exit', (code) => process.exit(code ?? 0));
  child.on('error', (err) => {
    console.error('خطا در شروع سرور:', err);
    process.exit(1);
  });
}

main();
