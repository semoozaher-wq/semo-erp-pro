import fs from 'node:fs';

const files = ['js/config.js', 'js/firebase.js', 'js/app.js', 'firebase-messaging-sw.js'];
for (const file of files) {
  const code = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  try {
    new Function(code);
    console.log(`${file}: ok`);
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    process.exitCode = 1;
  }
}
