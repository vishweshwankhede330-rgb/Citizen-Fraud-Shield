import { Router } from "express";
import { z } from "zod";
import { analyzeLimiter } from "../middlewares/rateLimiter";

const analyzeRequestSchema = z.object({
  text: z.string().min(1),
  follow_up_answers: z.array(z.string()).optional(),
});

const router = Router();

const VALID_CRIME_CATEGORIES = [
  "Digital Arrest / Government Impersonation Scam",
  "Financial Fraud / Payment Scam",
  "Phishing (OTP / Banking Details Theft)",
  "Job or Investment Scam",
  "Not a Recognized Scam Pattern",
] as const;

type CrimeCategory = typeof VALID_CRIME_CATEGORIES[number];

const SYSTEM_PROMPT = `You are a fraud detection system specializing in Indian digital arrest scams and financial fraud.

ANALYSIS MODE:
When follow_up_answers are NOT provided in the user message: Evaluate the input and decide if you have enough information for a confident classification.
- If the input contains clear fraud indicators OR is clearly not a scam → return "final_verdict" directly.
- If the input is genuinely ambiguous AND 1-2 targeted questions would significantly change your classification → return "need_more_info" with those questions.
- Default to "final_verdict" unless confidence would be below 65%. Do NOT ask follow-up questions for clearly high-risk or clearly low-risk inputs.

When the user message includes "Follow-up answers:" → Always return "final_verdict". Never return "need_more_info" when follow-up answers are present.

FRAUD PATTERNS TO DETECT:
- Impersonation of law enforcement or government agencies (CBI, ED, Customs, Police, RBI, TRAI, FCI, Narcotics, Income Tax)
- Urgency and threat language: arrest, warrant, account freezing, legal action, FIR, disconnection
- Requests for money transfer, gift cards, or "verification" payments to "safe accounts"
- Requests to stay on a video call or isolate the victim from family members
- Fake case numbers, fake officer names or badge numbers
- Requests for OTP, banking credentials, Aadhaar number, PAN number
- Parcel or courier scam variants (illegal items intercepted)
- "Digital arrest" — telling victims they are under house arrest via phone/video

CRIME CATEGORY CLASSIFICATION:
You must classify the input into EXACTLY ONE of these categories. Use the exact string, character-for-character:
- "Digital Arrest / Government Impersonation Scam" — caller/message pretends to be CBI, police, ED, TRAI, customs, court, or any official body; threatens arrest, legal action, or account freezing
- "Financial Fraud / Payment Scam" — demands direct money transfer, gift cards, UPI payment, or payment to a "safe account"; includes parcel/courier scams with payment demands
- "Phishing (OTP / Banking Details Theft)" — attempts to steal OTP, bank login credentials, card details, Aadhaar, or PAN through fake links, calls, or forms
- "Job or Investment Scam" — fake job offers, work-from-home schemes, investment platforms promising high returns, or part-time task scams
- "Not a Recognized Scam Pattern" — no clear fraud pattern detected; input appears legitimate or is too vague to classify as a known scam

RESPONSE FORMAT:
Respond with ONLY valid JSON. No markdown, no preamble, no text outside the JSON.

Shape 1 — when genuinely more context is needed (use sparingly, max once per session):
{
  "mode": "need_more_info",
  "questions": ["specific yes/no or short-answer question?", "second question if needed?"]
}
Maximum 2 questions. Keep them short and concrete.

Shape 2 — final verdict (use for all confident cases and all follow-up rounds):
{
  "mode": "final_verdict",
  "risk_level": "High" | "Low" | "Uncertain",
  "confidence": <integer 0-100>,
  "crime_category": <one of the 5 exact category strings above>,
  "reasons": ["concise reason under 15 words", "concise reason under 15 words", "concise reason under 15 words"],
  "recommended_actions": ["practical action 1", "practical action 2"],
  "simple_explanation": "<1-2 plain-language sentences written for a person who may be scared or panicking. Be calm, reassuring, and direct. Example for high risk: 'This is very likely NOT a real government official. Real police and agencies never ask for money or OTPs over a call — it is completely safe to hang up now.' Example for low risk: 'This appears to be a legitimate message. There are no signs of fraud here, but always stay cautious with unexpected requests.'"
}`;

router.post("/analyze", analyzeLimiter, async (req, res) => {
  const parsed = analyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request: text field is required." });
    return;
  }

  const { text, follow_up_answers } = parsed.data;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    req.log.error("GROQ_API_KEY is not configured");
    res.status(500).json({ error: "Analysis service is not configured. Please contact support." });
    return;
  }

  // Build the user message — include follow-up answers if present
  const userContent = follow_up_answers && follow_up_answers.length > 0
    ? `Original submission:\n${text}\n\nFollow-up answers:\n${follow_up_answers.join("\n")}`
    : text;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      req.log.error({ status: groqRes.status, body: errText }, "Groq API error");
      res.status(500).json({ error: "Analysis service unavailable. Please try again shortly." });
      return;
    }

    const groqData = (await groqRes.json()) as {
      choices: { message: { content: string } }[];
    };

    const raw = groqData.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      req.log.error({ groqData }, "Empty content from Groq");
      res.status(500).json({ error: "Received an empty response from the analysis service." });
      return;
    }

    // Log raw response at debug level only — it can contain user-submitted text (potential PII)
    req.log.debug({ raw: raw.slice(0, 500) }, "Raw Groq response (truncated to 500 chars)");

    // Strip optional markdown fences (```json ... ``` or ``` ... ```)
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let result: unknown;
    try {
      result = JSON.parse(cleaned);
    } catch {
      req.log.error({ raw }, "Failed to parse Groq JSON — raw response logged above");
      res.status(500).json({ error: "Could not parse analysis result. Please try again." });
      return;
    }

    const obj = result as Record<string, unknown>;

    // Validate shape — handle need_more_info
    if (obj.mode === "need_more_info") {
      if (!Array.isArray(obj.questions) || obj.questions.length === 0) {
        req.log.error({ obj }, "need_more_info missing questions");
        res.status(500).json({ error: "Analysis result was malformed. Please try again." });
        return;
      }
      res.json({ mode: "need_more_info", questions: obj.questions });
      return;
    }

    // Validate shape — handle final_verdict
    if (obj.mode === "final_verdict") {
      // Coerce confidence to number — Groq occasionally returns it as a string (e.g. "100").
      // Only accept an actual number or a string that represents a finite decimal integer.
      // Reject null, "", "  ", or anything that isn't a real numeric value.
      const rawConfidence = obj.confidence;
      const isNumericInput =
        typeof rawConfidence === "number" ||
        (typeof rawConfidence === "string" && /^\d+(\.\d+)?$/.test(rawConfidence.trim()));
      const confidence = isNumericInput ? Number(rawConfidence) : NaN;

      // Normalise crime_category — trim and remap if model added minor punctuation variance
      const rawCategory = typeof obj.crime_category === "string"
        ? obj.crime_category.trim()
        : "";
      const crimeCategory: CrimeCategory = (VALID_CRIME_CATEGORIES as readonly string[]).includes(rawCategory)
        ? rawCategory as CrimeCategory
        : "Not a Recognized Scam Pattern";

      if (
        !["High", "Low", "Uncertain"].includes(obj.risk_level as string) ||
        !Number.isFinite(confidence) ||
        confidence < 0 ||
        confidence > 100 ||
        !Array.isArray(obj.reasons) ||
        !Array.isArray(obj.recommended_actions) ||
        typeof obj.simple_explanation !== "string"
      ) {
        req.log.error({ obj }, "final_verdict response has unexpected shape");
        res.status(500).json({ error: "Analysis result was malformed. Please try again." });
        return;
      }

      res.json({ ...obj, confidence: Math.round(confidence), crime_category: crimeCategory });
      return;
    }

    req.log.error({ obj }, "Unknown mode in Groq response — expected 'need_more_info' or 'final_verdict'");
    res.status(500).json({ error: "Analysis result was malformed. Please try again." });
  } catch (err) {
    req.log.error({ err }, "Unexpected error calling Groq API");
    res.status(500).json({ error: "Unable to analyze right now. Please try again in a moment." });
  }
});

export default router;
