import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const fail = [];
const ok = (msg) => console.log('  OK  ' + msg);
const bad = (msg) => { fail.push(msg); console.log('  FAIL ' + msg); };

console.log('=== verify-accounting: accounting completeness ===');

const app = read('js/app.js');
const html = read('index.html');
const rules = read('firebase.rules.json');
const pkg = JSON.parse(read('package.json'));

// 1. Core engine present
[
  'async function postAccountingEntry',
  'function accountingEntryFromSale',
  'function accountingEntryFromPurchase',
  'function accountingEntryFromDebtPayment',
  'function accountingEntryFromCustomerDebtPayment',
  'function accountingEntryFromExpense',
  'function accountingEntryFromRevenue',
  'function accountingEntryFromReturn',
  'function removeAccountingEntriesBySource',
  'function loadAccountingEntries',
  'function trialBalance',
  'function profitAndLoss',
  'function ledgerLines',
  'function normalizeAccountCode',
  'function showAccountingPage',
  'const CHART_OF_ACCOUNTS'
].forEach((token) => (app.includes(token) ? ok('engine: ' + token) : bad('missing engine token: ' + token)));

// 2. Posting coverage: every financial writer must post
const postCalls = (app.match(/postAccountingEntry\(/g) || []).length;
postCalls >= 9 ? ok('postAccountingEntry call sites = ' + postCalls) : bad('too few posting call sites: ' + postCalls);

// 3. Reversal coverage
['removeAccountingEntriesBySource(\'expense\'', 'removeAccountingEntriesBySource(\'revenue\''].forEach((t) =>
  app.includes(t) ? ok('reversal wired: ' + t) : bad('reversal missing: ' + t));

// 4. Nav + route
html.includes("showPage('accounting')") ? ok('nav button wired in index.html') : bad('no accounting nav button');
app.includes("case 'accounting':") ? ok('showPage route for accounting') : bad('no accounting route');

// 5. Backup coverage
app.includes("'returns','accountingEntries','orders']") ? ok('backup includes accountingEntries + orders') : bad('backup keys do not include accountingEntries');

// 6. Rules coverage
rules.includes('"accountingEntries"') && rules.includes('.indexOn') ? ok('rules cover accountingEntries with indexOn') : bad('rules missing accountingEntries/indexOn');

const ruleCols=['products','customers','suppliers','categories','sales','purchases','expenses','revenues','debts','supplierDebts','cashbox','returns','branches','settings','orders','activity','accountingEntries'];
const missingCols=ruleCols.filter(c=>!rules.includes('"'+c+'"'));
missingCols.length===0?ok('rules cover all 17 collections'):bad('rules missing: '+missingCols.join(','));

// 7. Balanced double entry in every builder (debit literal !== credit literal)
const builders = app.match(/debitAccount:[^,]+,\s*creditAccount:[^,]+/g) || [];
builders.length >= 5 ? ok('double-entry builders found = ' + builders.length) : bad('unbalanced/absent builders: ' + builders.length);
const oneSided = builders.filter((b) => {
  const d = (b.match(/debitAccount:([^,]+),/) || [])[1] || '';
  const c = (b.match(/creditAccount:([^,]+),?/) || [])[1] || '';
  return d.trim() === c.trim();
});
oneSided.length === 0 ? ok('no self-referencing (unbalanced) entries') : bad('self-referencing entries: ' + oneSided.length);

// 8. Currency + operationId on entries
app.includes('operationId:entry.operationId') || app.includes('operationId,createdAt') ? ok('entries carry operationId') : bad('entries missing operationId');

console.log('=== result ===');
if (fail.length) { console.log('ACCOUNTING_FAIL=' + fail.length); process.exit(1); }
console.log('ACCOUNTING_OK');
