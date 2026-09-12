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

  function buildContext() {
    const state = window.AppState || {};
    const products = Array.isArray(state.products) ? state.products : [];
    const sales = Array.isArray(state.sales) ? state.sales : [];
    const lowStock = products.filter((p) => Number(p.quantity || 0) <= Number(p.minStock || 5));
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || sale.total || 0), 0);
    return JSON.stringify({
      productsCount: products.length,
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock.slice(0, 12).map((p) => ({ name: p.name, quantity: p.quantity, minStock: p.minStock })),
      salesCount: sales.length,
      totalSales,
      currency: state.currentUser?.currency || "LYD",
    });
  }

  window.askSeMoGemini = async function askSeMoGemini(message) {
    const fn = getCallable();
    if (!fn) throw new Error("خدمة Gemini غير مهيأة. تحقق من نشر Firebase Functions.");
    const result = await fn({ message: String(message || "").slice(0, 4000), context: buildContext() });
    return result?.data?.text || "لم يصل رد من Gemini.";
  };
})();
