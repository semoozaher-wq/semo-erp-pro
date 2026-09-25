// scripts/verify-deploy-assets.mjs
// يتحقق من أن ملفات النشر سليمة فعليًا:
//  1) Hosting لا ينشر ملفات داخلية (scripts/functions/package.json/README/DEPLOY/CHANGES).
//  2) ترويسات الأمان الأساسية موجودة على كل المسارات.
//  3) كل ملف محلي يحمّله index.html مذكور في APP_SHELL داخل service-worker.js.
//  4) كل ملفات APP_SHELL موجودة على القرص.
//  5) manifest.json صالح ومرتبط من index.html، وstart_url داخل النطاق.
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const firebase = JSON.parse(read('firebase.json'));
const ignore = firebase.hosting?.ignore || [];

/** هل يُستبعد مسار ما وفق قواعد ignore في firebase.json؟ */
function isIgnored(relativePath, patterns) {
  return patterns.some((pattern) => {
    if (pattern.startsWith('**/')) {
      const suffix = pattern.slice(3);
      return suffix.includes('*')
        ? relativePath.includes(suffix.replace('*', ''))
        : relativePath.includes(suffix) || relativePath.split('.').pop() === 'local';
    }
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*');
    return new RegExp(`^${escaped}$`).test(relativePath);
  });
}

const mustNotPublish = [
  'scripts/verify-security.mjs',
  'scripts/migrate-legacy-realtime-db.mjs',
  'functions/index.js',
  'functions/package-lock.json',
  'package.json',
  'package-lock.json',
  'README.md',
  'DEPLOY.md',
  'CHANGES.md',
  'verification-notes.md',
  'firebase.rules.json',
  'storage.rules'
];
const leaked = mustNotPublish.filter((file) => !isIgnored(file, ignore));
if (leaked.length) {
  throw new Error(`Hosting ينشر ملفات داخلية: ${leaked.join(', ')}`);
}

// 2) ترويسات الأمان
const headers = firebase.hosting?.headers || [];
const globalBlock = headers.find((h) => h.source === '**');
if (!globalBlock) throw new Error('لا توجد ترويسات أمان عامة (source: "**") في firebase.json');
const headerKeys = (globalBlock.headers || []).map((h) => h.key);
for (const required of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Permissions-Policy']) {
  if (!headerKeys.includes(required)) throw new Error(`ترويسة الأمان الناقصة: ${required}`);
}
// الكاميرا والميكروفون يجب ألا يُحجبا: قارئ الباركود والإدخال الصوتي يعتمدان عليهما.
const permissions = String((globalBlock.headers || []).find((h) => h.key === 'Permissions-Policy')?.value || '');
if (!/camera=\(self\)/.test(permissions) || !/microphone=\(self\)/.test(permissions)) {
  throw new Error('Permissions-Policy تحجب الكاميرا أو الميكروفون وتكسر قارئ الباركود/الإدخال الصوتي');
}

// 3) و 4) APP_SHELL وملفات الواجهة
const swCode = read('service-worker.js');
const shellMatch = swCode.match(/APP_SHELL\s*=\s*\[([\s\S]*?)\]/);
if (!shellMatch) throw new Error('لم يتم العثور على APP_SHELL في service-worker.js');
const shell = [...shellMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

const html = read('index.html');
const localRefs = [...html.matchAll(/(?:src|href)="((?!https?:|\/\/|#)[^"]+)"/g)]
  .map((m) => m[1].replace(/^\.\//, ''))
  .filter((ref) => /\.(?:js|css|png|json)$/.test(ref))
  .filter((ref) => !ref.startsWith('data:'));

const missingFromShell = localRefs.filter((ref) => !shell.some((entry) => entry.replace(/^\.\//, '') === ref));
if (missingFromShell.length) {
  throw new Error(`ملفات محلية غير مغطاة في APP_SHELL: ${missingFromShell.join(', ')}`);
}

const missingOnDisk = shell
  .map((entry) => entry.replace(/^\.\//, ''))
  .filter((entry) => entry && !fs.existsSync(path.join(root, entry)));
if (missingOnDisk.length) {
  throw new Error(`ملفات APP_SHELL غير موجودة على القرص: ${missingOnDisk.join(', ')}`);
}

// 5) manifest
const manifest = JSON.parse(read('manifest.json'));
if (!html.includes('rel="manifest"')) throw new Error('index.html لا يربط manifest.json');
for (const field of ['name', 'short_name', 'start_url', 'scope', 'display', 'icons']) {
  if (!manifest[field]) throw new Error(`manifest.json يفتقد الحقل: ${field}`);
}
if (!/^\.\//.test(manifest.start_url) || !/^\.\//.test(manifest.scope)) {
  throw new Error('start_url وscope يجب أن يكونا نسبيين ("./") ليعمل التثبيت خارج جذر النطاق');
}
for (const icon of manifest.icons) {
  if (!fs.existsSync(path.join(root, icon.src))) throw new Error(`أيقونة manifest غير موجودة: ${icon.src}`);
}

console.log(`Deploy assets verification passed. (shell=${shell.length}, localRefs=${localRefs.length}, ignore=${ignore.length}, securityHeaders=${headerKeys.length})`);
