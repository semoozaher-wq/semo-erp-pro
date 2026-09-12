import fs from 'node:fs/promises';

const rules = JSON.parse(await fs.readFile(new URL('../firebase.rules.json', import.meta.url)));
const storage = await fs.readFile(new URL('../storage.rules', import.meta.url), 'utf8');
const userRules = rules.rules.users?.$uid;
if (!userRules || !String(userRules['.read']).includes('auth.uid') || !String(userRules['.write']).includes('auth.uid')) {
  throw new Error('User workspace rules must be scoped to auth.uid');
}
for (const collection of ['products','customers','sales','expenses','cashbox']) {
  if (!userRules[collection] || !String(userRules[collection]['.read']).includes('auth.uid === $uid') || !String(userRules[collection]['.write']).includes('auth.uid === $uid')) {
    throw new Error(`Missing UID isolation for ${collection}`);
  }
}
if (!storage.includes('users/{userId}/product-images') || !storage.includes('request.auth.uid == userId')) {
  throw new Error('Storage product images are not UID-scoped');
}
console.log('Security rules verification passed.');
