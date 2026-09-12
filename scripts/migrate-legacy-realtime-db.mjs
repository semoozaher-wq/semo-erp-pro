import fs from 'node:fs/promises';
import process from 'node:process';
import admin from 'firebase-admin';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const targetUid = process.env.TARGET_UID;
if (!serviceAccountPath || !targetUid) {
  throw new Error('Set FIREBASE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json and TARGET_UID=google-uid');
}
const credentials = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(credentials), databaseURL: 'https://semo-erp-pro13-default-rtdb.firebaseio.com' });
const db = admin.database();
const collections = ['products','customers','suppliers','categories','sales','purchases','expenses','revenues','debts','supplierDebts','cashbox','returns','branches','settings','orders','activity','accountingEntries'];
const root = await db.ref('/').once('value');
const legacy = root.val() || {};
const updates = {};
for (const collection of collections) {
  if (legacy[collection] && typeof legacy[collection] === 'object') {
    updates[`users/${targetUid}/${collection}`] = legacy[collection];
  }
}
if (!Object.keys(updates).length) {
  console.log('No legacy collections found.');
  process.exit(0);
}
await db.ref('/').update(updates);
console.log(`Migrated ${Object.keys(updates).length} collections to users/${targetUid}/. Legacy data was not deleted.`);
