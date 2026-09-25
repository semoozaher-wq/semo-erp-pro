// scripts/browser-smoke.mjs — فحص تشغيلي حقيقي: يشغّل الموقع محليًا ويرصد أخطاء المتصفح.
// إذا لم تكن Playwright مثبّتة، يتخطّى الفحص بنجاح (exit 0) مع تنبيه — حتى لا يكسر CI بلا سبب.
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('تنبيه: Playwright غير مثبّت، تم تخطّي الفحص التشغيلي. للتشغيل: npm install && npx playwright install chromium');
  process.exit(0);
}

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (fs.existsSync(filePath + '.html')) filePath += '.html';
    else { res.writeHead(404); res.end(path.basename(filePath) + ' not found'); return; }
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(4173, resolve));
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
const failedRequests = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
page.on('requestfailed', (req) => failedRequests.push(req.url() + ' :: ' + (req.failure()?.errorText || 'failed')));

await page.goto('http://localhost:4173/index.html', { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => errors.push('goto: ' + e.message));
await page.waitForTimeout(2500);

const probe = await page.evaluate(() => {
  const seen = {};
  const check = (label, fn) => { try { seen[label] = fn(); } catch (e) { seen[label] = 'THREW: ' + e.message; } };
  check('runtime_present', () => Boolean(window.SemoFirebaseRuntime));
  check('db_present', () => Boolean(window.SemoFirebaseRuntime?.db));
  check('auth_present', () => Boolean(window.SemoFirebaseRuntime?.auth));
  check('gemini_bridge', () => typeof window.askSeMoGemini);
  check('global_auth_is_defined', () => typeof auth);
  check('login_button', () => document.querySelectorAll('[onclick*="handleGoogleLogin"]').length);
  check('stylesheet_applied', () => {
    const link = [...document.querySelectorAll('link[rel=stylesheet]')].some((l) => (l.getAttribute('href') || '').includes('css/main.css'));
    const bg = getComputedStyle(document.body).backgroundColor;
    return { link, bodyBackground: bg };
  });
  check('manifest_linked', () => Boolean(document.querySelector('link[rel=manifest]')));
  check('runtime_elements_wired', () => {
    // يتحقق من أن معالجات الأحداث المستخدمة في index.html كلها معرّفة فعليًا (منع أزرار ميتة).
    const handlers = [...document.querySelectorAll('[onclick],[onchange],[onsubmit]')];
    const missing = new Set();
    for (const el of handlers) {
      const code = el.getAttribute('onclick') || el.getAttribute('onchange') || el.getAttribute('onsubmit') || '';
      for (const m of code.matchAll(/([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)) {
        const name = m[1];
        if (['function', 'if', 'for', 'while', 'return', 'prompt', 'alert', 'confirm', 'document', 'window', 'JSON', 'Number', 'String', 'Boolean', 'Array', 'Object', 'parseInt', 'parseFloat', 'setTimeout', 'console', 'URL', 'encodeURIComponent'].includes(name)) continue;
        try { if (typeof eval(name) === 'undefined') missing.add(name); } catch { missing.add(name); }
      }
    }
    return { wired: handlers.length, missing: [...missing] };
  });
  check('service_worker_supported', () => 'serviceWorker' in navigator);
  return seen;
});

const swCache = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
  return reg?.active?.scriptURL || null;
});

console.log(JSON.stringify({ probe, swCache, errors, failedRequests }, null, 2));
await browser.close();
server.close();
