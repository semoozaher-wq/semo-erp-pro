/* SeMo0o Gemini client: the API key stays in Firebase Functions Secret Manager. */
(() => {
  let callable = null;

  function getCallable() {
    if (callable) return callable;
    const runtime = window.SemoFirebaseRuntime;
    if (!runtime?.app || typeof firebase?.functions !== "function") return null;
    const functions = firebase.app().functions("us-central1");
    callable = functions.httpsCallable("askGemini");
    return callable;
  }

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  // Build a full snapshot of the business so the assistant never misses a module.
  function buildContext() {
    const state = window.AppState || {};
    const products = Array.isArray(state.products) ? state.products : [];
    const sales = Array.isArray(state.sales) ? state.sales : [];
    const customers = Array.isArray(state.customers) ? state.customers : [];
    const suppliers = Array.isArray(state.suppliers) ? state.suppliers : [];
    const categories = Array.isArray(state.categories) ? state.categories : [];
    const cashbox = Array.isArray(state.cashbox) ? state.cashbox : [];
    const debts = Array.isArray(state.debts) ? state.debts : [];
    const supplierDebts = Array.isArray(state.supplierDebts) ? state.supplierDebts : [];
    const users = Array.isArray(state.users) ? state.users : [];
    const marketers = Array.isArray(state.marketers) ? state.marketers : [];
    const returns = Array.isArray(state.returns) ? state.returns : [];

    const lowStock = products.filter((p) => num(p.quantity) <= num(p.minStock || 5));
    const totalSales = sales.reduce((sum, s) => sum + num(s.totalAmount || s.total), 0);
    const totalCost = sales.reduce(
      (sum, s) => sum + (Array.isArray(s.items) ? s.items.reduce((a, i) => a + num(i.costPrice) * num(i.quantity), 0) : 0),
      0,
    );
    const customerDebt = customers.reduce((sum, c) => sum + num(c.balance), 0);
    const supplierDebt = supplierDebts.reduce((sum, d) => sum + num(d.amount || d.balance), 0);
    const cashIn = cashbox.filter((c) => c.type === "income").reduce((s, c) => s + num(c.amount), 0);
    const cashOut = cashbox.filter((c) => c.type === "expense").reduce((s, c) => s + num(c.amount), 0);

    // Best sellers by quantity sold.
    const soldByProduct = {};
    sales.forEach((s) => {
      (Array.isArray(s.items) ? s.items : []).forEach((i) => {
        const key = i.name || i.productId || "?";
        soldByProduct[key] = (soldByProduct[key] || 0) + num(i.quantity);
      });
    });
    const topProducts = Object.entries(soldByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, qty]) => ({ name, qty }));

    return JSON.stringify({
      business: state.settings?.name || "SeMo0o FRP",
      currency: state.currentUser?.currency || "LYD",
      counts: {
        products: products.length,
        categories: categories.length,
        customers: customers.length,
        suppliers: suppliers.length,
        marketers: marketers.length,
        users: users.length,
        sales: sales.length,
        returns: returns.length,
      },
      totals: {
        sales: totalSales,
        estimatedCost: totalCost,
        estimatedProfit: totalSales - totalCost,
        customerDebt,
        supplierDebt,
        cashIncome: cashIn,
        cashExpense: cashOut,
        cashBalance: cashIn - cashOut,
      },
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock.slice(0, 12).map((p) => ({ name: p.name, quantity: num(p.quantity), minStock: num(p.minStock) })),
      topProducts,
      topDebtors: customers
        .filter((c) => num(c.balance) > 0)
        .sort((a, b) => num(b.balance) - num(a.balance))
        .slice(0, 8)
        .map((c) => ({ name: c.name, balance: num(c.balance) })),
      recentSales: sales.slice(-5).map((s) => ({ customer: s.customerName || "", total: num(s.totalAmount || s.total), date: s.date })),
    });
  }

  window.askSeMoGemini = async function askSeMoGemini(message) {
    const fn = getCallable();
    if (!fn) throw new Error("خدمة Gemini غير مهيأة. تحقق من نشر Firebase Functions.");
    const result = await fn({ message: String(message || "").slice(0, 4000), context: buildContext() });
    return result?.data?.text || "لم يصل رد من Gemini.";
  };
})();
