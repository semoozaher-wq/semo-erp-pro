import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ region: "us-central1", maxInstances: 5 });

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const allowedModels = new Set(["gemini-2.5-flash", "gemini-2.5-flash-lite"]);

function cleanText(value, maxLength = 4000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export const askGemini = onCall(
  { secrets: [geminiApiKey], enforceAppCheck: false },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "يجب تسجيل الدخول لاستخدام المساعد الذكي.");
    }

    const message = cleanText(request.data?.message);
    if (!message) {
      throw new HttpsError("invalid-argument", "اكتب سؤالًا للمساعد.");
    }

    const model = allowedModels.has(request.data?.model)
      ? request.data.model
      : "gemini-2.5-flash";
    const context = cleanText(request.data?.context, 6000);
    const prompt = [
      "أنت مساعد أعمال عربي ذكي داخل نظام SeMo0o FRP، وهو نظام ERP متكامل لإدارة المبيعات والمخزون والحسابات.",
      "وحدات النظام التي يجب أن تعرفها وتجيب عنها جميعاً: المنتجات والمخزون، الفئات، العملاء وكشوف حساباتهم الدائمة، الموردون والمسوقون (البضاعة الأمانة)، المبيعات (نقدي/آجل/عميل طياري)، المشتريات، المصروفات والإيرادات، الصندوق، الديون، المرتجعات، الفروع، المستخدمون (المدير والموظفون والصلاحيات)، التقارير والمحاسبة (ميزان المراجعة والأرباح والخسائر)، والنسخ الاحتياطي.",
      "أجب دائماً بالعربية بوضوح واختصار، واستخدم الأرقام من السياق المرفق إن وُجدت، ولا تخترع أرقاماً غير موجودة.",
      "لا تنفذ أي عملية مالية أو حذف أو تعديل؛ اكتفِ بالشرح واقتراح الخطوات داخل التطبيق.",
      context ? `سياق النظام الحالي (استخدمه للإجابة على أي سؤال عن الأرقام):\n${context}` : "",
      `سؤال المستخدم:\n${message}`,
    ].filter(Boolean).join("\n\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey.value())}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Gemini request failed", response.status, detail.slice(0, 500));
      throw new HttpsError("internal", "تعذر الوصول إلى Gemini حاليًا.");
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) throw new HttpsError("internal", "عاد Gemini برد فارغ.");
    return { text };
  },
);
