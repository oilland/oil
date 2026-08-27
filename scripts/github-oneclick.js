#!/usr/bin/env node
// صفحهٔ یک‌کلیکی ارسال به گیت‌هاب — بدون ترمینال
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const TOKEN_FILE = path.join(ROOT, '.git-push-token');
const PORT = Number(process.env.PORT || 3847);

function readToken() {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch {
    return '';
  }
}

function writeToken(token) {
  fs.writeFileSync(TOKEN_FILE, token.trim() + '\n', { mode: 0o600 });
}

const PAGE = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ارسال به گیت‌هاب — روغن‌لند</title>
<style>
  :root { --brand:#0b554d; --accent:#d4a017; --bg:#f4f7f6; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: Tahoma, Vazirmatn, sans-serif; background: linear-gradient(160deg, #0b1c38, var(--brand));
    padding: 24px; color: #0f172a;
  }
  .card {
    width: 100%; max-width: 440px; background: #fff; border-radius: 24px;
    padding: 32px 28px; box-shadow: 0 24px 60px rgba(0,0,0,.25);
  }
  h1 { margin: 0 0 8px; font-size: 22px; color: var(--brand); }
  p.sub { margin: 0 0 24px; color: #64748b; font-size: 13px; line-height: 1.9; }
  label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; }
  input {
    width: 100%; height: 46px; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 0 12px; font-size: 14px; direction: ltr; text-align: left;
  }
  input:focus { outline: 2px solid var(--brand); border-color: transparent; }
  .hint { font-size: 11px; color: #94a3b8; margin: 8px 0 0; line-height: 1.8; }
  .hint a { color: var(--brand); }
  button {
    margin-top: 22px; width: 100%; height: 56px; border: 0; border-radius: 16px;
    background: linear-gradient(90deg, #0b554d, #0e7a6d); color: #fff;
    font-family: inherit; font-size: 18px; font-weight: 800; cursor: pointer;
    box-shadow: 0 10px 24px rgba(11,85,77,.35);
  }
  button:disabled { opacity: .6; cursor: wait; }
  button:hover:not(:disabled) { filter: brightness(1.06); }
  #out {
    margin-top: 16px; display: none; white-space: pre-wrap; font-size: 12px;
    background: #f8fafc; border-radius: 12px; padding: 12px; line-height: 1.8; direction: rtl;
  }
  #out.ok { display: block; color: #166534; background: #f0fdf4; }
  #out.err { display: block; color: #991b1b; background: #fef2f2; }
  .ok-pill { display: inline-block; background: #ecfdf5; color: #047857; font-size: 11px; padding: 2px 8px; border-radius: 999px; margin-bottom: 12px; }
</style>
</head>
<body>
  <div class="card">
    <span class="ok-pill" id="saved" style="display:none">توکن ذخیره شده — فقط یک کلیک کافی است</span>
    <h1>ارسال به گیت‌هاب</h1>
    <p class="sub">با یک کلیک همهٔ تغییرات روغن‌لند روی ریپوی <b dir="ltr">oilland/oil</b> ثبت می‌شود.</p>
    <form id="f">
      <label for="token">توکن گیت‌هاب <span id="opt"></span></label>
      <input id="token" name="token" type="password" autocomplete="off" placeholder="ghp_xxxxxxxx" />
      <p class="hint">
        فقط بار اول لازم است. بساز از
        <a href="https://github.com/settings/tokens/new?scopes=repo&description=oilland" target="_blank" rel="noreferrer">این لینک</a>
        → تیک <b>repo</b> → Generate token → کپی و اینجا بچسبان.
        توکن را در چت نفرست.
      </p>
      <button type="submit" id="btn">ارسال به گیت‌هاب</button>
    </form>
    <div id="out"></div>
  </div>
  <script>
    const f = document.getElementById('f');
    const btn = document.getElementById('btn');
    const out = document.getElementById('out');
    const token = document.getElementById('token');
    fetch('/status').then(r => r.json()).then(s => {
      if (s.hasToken) {
        document.getElementById('saved').style.display = 'inline-block';
        document.getElementById('opt').textContent = '(اختیاری — قبلاً ذخیره شده)';
        token.placeholder = '••••••••  ذخیره شده';
      }
    }).catch(() => {});
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'در حال ارسال…';
      out.className = '';
      out.style.display = 'none';
      try {
        const res = await fetch('/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token.value })
        });
        const data = await res.json();
        out.textContent = data.message || (res.ok ? 'ارسال شد' : 'خطا');
        out.className = res.ok ? 'ok' : 'err';
        if (res.ok) {
          document.getElementById('saved').style.display = 'inline-block';
          token.value = '';
        }
      } catch (err) {
        out.textContent = 'ارتباط با سرور برقرار نشد.';
        out.className = 'err';
      }
      btn.disabled = false;
      btn.textContent = 'ارسال به گیت‌هاب';
    });
  </script>
</body>
</html>`;

function send(res, code, body, headers = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': typeof body === 'string' ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8',
    ...headers
  });
  res.end(data);
}

function runPush(token) {
  return new Promise((resolve) => {
    const env = { ...process.env, SKIP_AUTO_PUSH: '1' };
    if (token) env.GITHUB_TOKEN = token;
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'push.js')], {
      cwd: ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let out = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.stderr.on('data', (d) => {
      out += d.toString();
    });
    child.on('close', (code) => {
      resolve({ ok: code === 0, out });
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return send(res, 200, PAGE);
  }
  if (req.method === 'GET' && url.pathname === '/status') {
    return send(res, 200, { hasToken: Boolean(readToken()) });
  }
  if (req.method === 'POST' && url.pathname === '/push') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body = {};
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      body = {};
    }
    let token = String(body.token || '').trim();
    if (token) writeToken(token);
    else token = readToken();
    if (!token) {
      return send(res, 400, {
        message: 'بار اول توکن گیت‌هاب را در کادر بالا بچسبان، بعد دکمه را بزن.'
      });
    }
    const result = await runPush(token);
    const text = result.out.replace(/x-access-token:[^@]+@/g, 'x-access-token:***@').slice(-4000);
    if (result.ok) {
      return send(res, 200, { message: '✅ تغییرات روی گیت‌هاب ثبت شد.\n\n' + text });
    }
    return send(res, 500, {
      message:
        'ارسال ناموفق بود. توکن را چک کن (دسترسی repo) و اگر ریپو روی گیت‌هاب جلوتر است اول همگام شود.\n\n' + text
    });
  }
  send(res, 404, 'Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GitHub one-click listening on 0.0.0.0:${PORT}`);
});
