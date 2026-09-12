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
      "أنت مساعد أعمال عربي داخل نظام SeMo0o FRP لإدارة المبيعات والمخزون.",
      "أجب بالعربية بوضوح واختصار، ولا تنفذ أي عملية مالية أو حذف أو تعديل؛ اقترح الخطوات فقط.",
      context ? `سياق النظام الحالي:\n${context}` : "",
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
