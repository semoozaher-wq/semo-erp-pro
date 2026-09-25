// scripts/verify-placeholders.mjs
// يفشل الفحص إذا بقي أي قيمة بديلة (placeholder) داخل ملفات تُنشر للمستخدم.
// هذه هي الطريقة الوحيدة التي اكتشفنا بها أن مفتاح VAPID لم يُستبدل أبدًا في js/app.js.
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;

// ملفات تُنشر فعلًا إلى المستخدم النهائي.
const shipped = [
  'index.html',
  'js/config.js',
  'js/firebase.js',
  'js/gemini.js',
  'js/app.js',
  'service-worker.js',
  'firebase-messaging-sw.js',
];

// أنماط القيم البديلة التي لا يجوز وصولها للإنتاج.
const PLACEHOLDERS = [
  /YOUR_VAPID_KEY_HERE/,
  /YOUR_API_KEY/,
  /YOUR_[A-Z_]{3,}/,
  /REPLACE_ME/i,
  /<YOUR_[^>]+>/,
  /PASTE_[A-Z_]+/,
  /\bxxxxx+/i,
  /INSERT_[A-Z_]+/,
];

const hits = [];
for (const file of shipped) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of PLACEHOLDERS) {
      if (pattern.test(line)) {
        hits.push(`${file}:${index + 1} → ${line.trim().slice(0, 120)}`);
        break;
      }
    }
  });
}

if (hits.length) {
  console.error('قيم بديلة (placeholders) متبقية في ملفات تُنشر:');
  hits.forEach((hit) => console.error('  ' + hit));
  process.exitCode = 1;
} else {
  console.log(`Placeholder verification passed. (scanned ${shipped.length} shipped files)`);
}
