#!/usr/bin/env node
// نصب هوک گیت داخل خود ریپو (.githooks) تا بعد از هر کامیت خودکار push شود.
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const HOOKS = path.join(ROOT, '.githooks');
const POST = path.join(HOOKS, 'post-commit');

const hookBody = `#!/bin/sh
# بعد از هر کامیت، خودکار به origin پوش می‌شود.
# برای جلوگیری از حلقه، push.js متغیر SKIP_AUTO_PUSH=1 می‌گذارد.
if [ "$SKIP_AUTO_PUSH" = "1" ]; then
  exit 0
fi
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
git remote get-url origin >/dev/null 2>&1 || exit 0
git push -u origin "$branch" >/dev/null 2>&1 || true
`;

try {
  execSync('git rev-parse --is-inside-work-tree', { cwd: ROOT, stdio: 'pipe' });
} catch {
  process.exit(0);
}

fs.mkdirSync(HOOKS, { recursive: true });
fs.writeFileSync(POST, hookBody, { mode: 0o755 });
try {
  fs.chmodSync(POST, 0o755);
} catch {
  /* windows */
}

execSync('git config core.hooksPath .githooks', { cwd: ROOT, stdio: 'pipe' });
console.log('✅ هوک گیت نصب شد (.githooks/post-commit) — بعد از هر کامیت خودکار push می‌شود.');
