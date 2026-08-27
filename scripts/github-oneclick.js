#!/usr/bin/env node
// محیط CMD — یک کلیک = ارسال به گیت‌هاب
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
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CMD</title>
<style>
  html,body{height:100%;margin:0;background:#0c0c0c;color:#d4d4d4;
    font-family:Consolas,"Courier New",Tahoma,monospace}
  #box{min-height:100%;padding:20px 22px;cursor:pointer;white-space:pre-wrap;line-height:1.7;font-size:15px}
  .g{color:#4ec94e} .y{color:#e6d64e} .w{color:#fff} .dim{color:#6b7280}
  input{width:min(520px,90%);background:#111;border:1px solid #333;color:#4ec94e;
    font:inherit;padding:8px 10px;direction:ltr;text-align:left;margin-top:8px}
  button{margin-top:12px;padding:10px 18px;background:#222;color:#4ec94e;border:1px solid #4ec94e;
    font:inherit;cursor:pointer}
  button:disabled{opacity:.5;cursor:wait}
</style>
</head>
<body>
<div id="box">
<span class="g">Microsoft Windows [Version 10.0]</span>
<span class="dim">(روغن‌لند — ارسال به گیت‌هاب)</span>

C:\\oilland&gt; <span class="w">git add . &amp;&amp; git commit &amp;&amp; git push</span>

<span class="y">روی این صفحه کلیک کن تا تغییرات برود گیت‌هاب.</span>
<span id="need" class="dim"></span>
<div id="tok" style="display:none">
توکن گیت‌هاب را بچسبان (فقط بار اول) بعد دوباره کلیک کن:
<input id="token" type="password" autocomplete="off" placeholder="ghp_..."/>
</div>
<button id="btn" type="button">اجرا</button>
<div id="log"></div>
</div>
<script>
const box = document.getElementById('box');
const log = document.getElementById('log');
const btn = document.getElementById('btn');
const tok = document.getElementById('tok');
const token = document.getElementById('token');
let busy = false;
fetch('/status').then(r=>r.json()).then(s=>{
  if (!s.hasToken) {
    tok.style.display = 'block';
    document.getElementById('need').textContent = 'بار اول توکن لازم است. بعدش فقط کلیک.';
  }
}).catch(()=>{});
async function run() {
  if (busy) return;
  busy = true;
  btn.disabled = true;
  log.innerHTML = '\\n<span class="y">در حال اجرا...</span>';
  try {
    const res = await fetch('/push', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ token: token.value })
    });
    const data = await res.json();
    log.innerHTML = '\\n' + (res.ok
      ? '<span class="g">' + (data.message||'OK') + '</span>'
      : '<span class="y">' + (data.message||'خطا') + '</span>');
    if (res.ok) tok.style.display = 'none';
    if (!res.ok && /توکن/.test(data.message||'')) tok.style.display = 'block';
  } catch(e) {
    log.innerHTML = '\\n<span class="y">قطع شد. دوباره کلیک کن.</span>';
  }
  busy = false;
  btn.disabled = false;
}
btn.addEventListener('click', (e)=>{ e.stopPropagation(); run(); });
box.addEventListener('click', (e)=>{
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  run();
});
</script>
</body>
</html>`;

function send(res, code, body) {
  const isStr = typeof body === 'string';
  res.writeHead(code, {
    'Content-Type': isStr ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8'
  });
  res.end(isStr ? body : JSON.stringify(body));
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
    child.on('close', (code) => resolve({ ok: code === 0, out }));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://x');
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
      return send(res, 400, { message: 'توکن نیست. در کادر بچسبان و دوباره کلیک کن.' });
    }
    const result = await runPush(token);
    const text = result.out.replace(/x-access-token:[^@]+@/g, '***@').slice(-2500);
    if (result.ok) return send(res, 200, { message: 'C:\\oilland> OK\nتغییرات رفت روی گیت‌هاب.\n\n' + text });
    return send(res, 500, { message: 'ناموفق.\n' + text });
  }
  send(res, 404, 'Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CMD listening on 0.0.0.0:${PORT}`);
});
