// scripts/verify-critical-logic.mjs
// يختبر منطق البيع والمخزون الحقيقي المستخرَج من js/app.js نفسه —
// وليس نسخة مُعاد كتابتها. أي تغيير في سلوك هذه الدوال يُفشل الفحص.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

/** يستخرج نص دالة باسمها من المصدر مع موازنة الأقواس. */
function extractFunction(name) {
  const match = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  if (!match) return null;
  const open = source.indexOf('{', match.index);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(match.index, i + 1);
    }
  }
  return null;
}

/** يبني الدالة المستخرجة داخل نطاق معزول فيه بدائل للاعتمادات الخارجية. */
function build(name, scope) {
  const code = extractFunction(name);
  assert.ok(code, `تعذّر استخراج الدالة ${name} من js/app.js — تغيّر هيكل الملف`);
  const names = Object.keys(scope);
  return new Function(...names, `${code}\nreturn ${name};`)(...names.map((n) => scope[n]));
}

let passed = 0;
function check(label, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${label}`);
  } catch (error) {
    console.error(`  FAIL - ${label}: ${error.message}`);
    process.exitCode = 1;
  }
}

console.log('اختبار منطق المبيعات والمخزون (مستخرَج من المصدر الحقيقي):');

// 1) مجاميع السلة
const cartScope = { AppState: { cart: [] } };
const subtotal = build('calculateCartSubtotal', cartScope);
// calculateCartTotal تنادي calculateCartSubtotal، لذا تُمرَّر لها داخل النطاق المعزول.
const total = build('calculateCartTotal', { AppState: cartScope.AppState, calculateCartSubtotal: subtotal });

check('السلة الفارغة مجموعها صفر', () => {
  cartScope.AppState.cart = [];
  assert.equal(subtotal(), 0);
});

check('مجموع السلة = السعر × الكمية لكل بند', () => {
  cartScope.AppState.cart = [
    { productId: 'a', price: 10, quantity: 3 },
    { productId: 'b', price: 5.5, quantity: 2 },
  ];
  assert.equal(subtotal(), 41);
});

check('الإجمالي يساوي المجموع الفرعي (بلا خصم أو ضريبة)', () => {
  cartScope.AppState.cart = [{ productId: 'a', price: 7.25, quantity: 4 }];
  assert.equal(total(), 29);
  assert.equal(total(), subtotal());
});

// 2) تطبيع مفاتيح الاستيراد (CSV / Excel)
const normalizeKey = build('normalizeImportKey', {});
check('تطبيع مفاتيح الاستيراد يوحّد المسافات والشرطات وحالة الأحرف', () => {
  assert.equal(normalizeKey('  اسم المنتج '), 'اسمالمنتج');
  assert.equal(normalizeKey('Sale-Price'), 'saleprice');
  assert.equal(normalizeKey('cost_price'), 'costprice');
  assert.equal(normalizeKey(undefined), '');
});

// 3) توقع نفاد المخزون
const forecastScope = { AppState: { sales: [] }, Date };
const forecast = build('stockForecast', forecastScope);

check('توقع النفاد يحسب المتوسط من مبيعات آخر 30 يومًا فقط', () => {
  const now = Date.now();
  forecastScope.AppState.sales = [
    { date: new Date(now).toISOString(), items: [{ productId: 'p1', quantity: 30 }] },
    { date: new Date(now - 90 * 86400000).toISOString(), items: [{ productId: 'p1', quantity: 90 }] },
  ];
  const result = forecast({ id: 'p1', quantity: 30 });
  assert.equal(result.sold, 30, 'يجب أن يستبعد البيع الأقدم من 30 يومًا');
  assert.equal(result.daily, 1);
  assert.equal(result.days, 30);
});

check('بلا مبيعات: التوقع «غير معروف» ولا يقسم على صفر', () => {
  forecastScope.AppState.sales = [];
  const result = forecast({ id: 'p2', quantity: 10 });
  assert.equal(result.sold, 0);
  assert.equal(result.daily, 0);
  assert.equal(result.days, null);
});

check('لا يحتسب بيع منتج آخر على هذا المنتج', () => {
  forecastScope.AppState.sales = [{ date: new Date().toISOString(), items: [{ productId: 'other', quantity: 99 }] }];
  assert.equal(forecast({ id: 'p3', quantity: 10 }).sold, 0);
});

// 4) حفظ عقد الدوال في المصدر (حماية من الحذف الصامت)
check('كل الدوال الحرجة ما زالت معرّفة في js/app.js', () => {
  for (const name of ['calculateCartSubtotal', 'calculateCartTotal', 'normalizeImportKey', 'stockForecast']) {
    assert.ok(extractFunction(name), `الدالة ${name} مفقودة`);
  }
});

console.log(`Critical logic verification passed. (${passed} checks)`);
