import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

// Keyless fallback: Pollinations.ai exposes an OpenAI-compatible endpoint with
// no API key, used only if the Lovable AI gateway is unavailable / out of credits.
const FALLBACK_URL = "https://text.pollinations.ai/openai";
const FALLBACK_MODEL = "openai";

const metricsSchema = z.object({
  water: z.number(),
  trust: z.number(),
  diplomacy: z.number(),
  infrastructure: z.number(),
});

const optionSchema = z.object({
  text: z.string(),
  category: z.string(),
  apCost: z.number(),
  impact: z.object({
    water: z.number().optional(),
    trust: z.number().optional(),
    diplomacy: z.number().optional(),
    infrastructure: z.number().optional(),
  }),
  feedback: z.string(),
});

const roundSchema = z.object({
  situation: z.string(),
  locationName: z.string(),
  location: z.tuple([z.number(), z.number()]),
  mapZoom: z.number(),
  deepIntel: z.string(),
  options: z.array(optionSchema).min(2).max(4),
});

// Input schemas with strict runtime validation and bounded lengths to limit
// prompt-injection surface and resource exhaustion.
const langSchema = z.enum(["tr", "en"]);

const generateScenarioInput = z.object({
  threat: z.string().trim().min(1).max(200),
  lastMove: z.string().trim().min(1).max(500),
  metrics: metricsSchema,
  lang: langSchema,
});

const generateOperatorChoiceInput = z.object({
  situation: z.string().trim().min(1).max(2000),
  options: z
    .array(z.object({ text: z.string().trim().min(1).max(500) }))
    .min(1)
    .max(8),
  metrics: metricsSchema,
  lang: langSchema,
});

async function callAIRaw(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`AI upstream ${res.status}: ${text.slice(0, 200)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json();
}

async function callAI(body: Record<string, unknown>) {
  const apiKey = process.env.LOVABLE_API_KEY;

  // Primary: Lovable AI gateway
  if (apiKey) {
    try {
      return await callAIRaw(GATEWAY_URL, { Authorization: `Bearer ${apiKey}` }, body);
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      console.error("Lovable AI failed, trying keyless fallback:", status, (e as Error).message);
      // Only fall back on quota/credit/rate issues or 5xx; surface other errors
      if (status && status !== 429 && status !== 402 && status < 500) throw e;
    }
  } else {
    console.warn("LOVABLE_API_KEY missing, using keyless fallback directly");
  }

  // Fallback: keyless Pollinations.ai (OpenAI-compatible)
  const fallbackBody = { ...body, model: FALLBACK_MODEL };
  return await callAIRaw(FALLBACK_URL, {}, fallbackBody);
}

export const generateScenario = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => generateScenarioInput.parse(data))
  .handler(async ({ data }) => {
    const { threat, lastMove, metrics, lang } = data;

    const systemPrompt =
      lang === "tr"
        ? `Sen Stratejik Kriz Simülasyonunda Red Team (Saldırgan/Kriz) yapay zekasısın. Türkçe yanıt ver. Sadece tool_call ile yanıt ver.`
        : `You are the Red Team (Attacker/Crisis) AI in a Strategic Crisis Simulation. Respond in English. Reply only via the tool_call.`;

    const userPrompt =
      lang === "tr"
        ? `Tema: ${threat}.
Mavi Takım'ın son hamlesi: "${lastMove}".
Güncel ulusal metrikler: Su:%${metrics.water}, Güven:%${metrics.trust}, Diplomasi:%${metrics.diplomacy}, Altyapı:%${metrics.infrastructure}.

Görev: Mavi Takım'ın hamlesine yanıt olarak yeni bir kriz gelişmesi üret. 2-4 karar seçeneği sun. apCost 1-3 arası, kategori örn: KINETIC, CYBER, DIPLOMATIC, MEDIA. Etki değerleri -25 ile +25 arası tamsayı.`
        : `Theme: ${threat}.
Blue Team's last move: "${lastMove}".
Current national metrics: Water:${metrics.water}%, Trust:${metrics.trust}%, Diplomacy:${metrics.diplomacy}%, Infrastructure:${metrics.infrastructure}%.

Task: Generate a new crisis escalation in response to Blue Team's move. Provide 2-4 decision options. apCost 1-3, category e.g. KINETIC, CYBER, DIPLOMATIC, MEDIA. Impact values are integers between -25 and +25.`;

    const response = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_scenario",
            description: "Emit the next crisis round.",
            parameters: {
              type: "object",
              properties: {
                situation: { type: "string", description: "Dramatic tactical summary" },
                locationName: { type: "string" },
                location: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  maxItems: 2,
                  description: "[latitude, longitude]",
                },
                mapZoom: { type: "number" },
                deepIntel: { type: "string" },
                options: {
                  type: "array",
                  minItems: 2,
                  maxItems: 4,
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      category: { type: "string" },
                      apCost: { type: "number" },
                      impact: {
                        type: "object",
                        properties: {
                          water: { type: "number" },
                          trust: { type: "number" },
                          diplomacy: { type: "number" },
                          infrastructure: { type: "number" },
                        },
                      },
                      feedback: { type: "string" },
                    },
                    required: ["text", "category", "apCost", "impact", "feedback"],
                  },
                },
              },
              required: ["situation", "locationName", "location", "mapZoom", "deepIntel", "options"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_scenario" } },
    });

    const toolCall = response?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI did not return a structured scenario");

    const parsed = roundSchema.parse(JSON.parse(toolCall.function.arguments));
    return parsed;
  });

export const generateOperatorChoice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => generateOperatorChoiceInput.parse(data))
  .handler(async ({ data }) => {
    // Use inline auth so failures are regular Error objects, not raw Responses.
    await getAuthedSupabase();
    const { situation, options, metrics, lang } = data;

    const systemPrompt =
      lang === "tr"
        ? `Sen Stratejik Kriz Masası yöneticisi olan Sanal Operatörsün. Hedefin metrikleri 0'ın altına düşürmeden krizi yönetmek.`
        : `You are the Virtual Operator running the Strategic Crisis Desk. Goal: keep all metrics above zero.`;

    const userPrompt =
      lang === "tr"
        ? `Metrikler: Su:%${metrics.water}, Güven:%${metrics.trust}, Diplomasi:%${metrics.diplomacy}, Altyapı:%${metrics.infrastructure}.
Durum: ${situation}
Seçenekler:
${options.map((o: { text: string }, i: number) => `${i}: ${o.text}`).join("\n")}

En mantıklı seçeneğin indeks numarasını seç.`
        : `Metrics: Water:${metrics.water}%, Trust:${metrics.trust}%, Diplomacy:${metrics.diplomacy}%, Infrastructure:${metrics.infrastructure}%.
Situation: ${situation}
Options:
${options.map((o: { text: string }, i: number) => `${i}: ${o.text}`).join("\n")}

Pick the index of the most reasonable option.`;

    const response = await callAI({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "pick_option",
            description: "Pick the index of the chosen option",
            parameters: {
              type: "object",
              properties: { choice: { type: "number" } },
              required: ["choice"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "pick_option" } },
    });

    const toolCall = response?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return { choice: 0 };
    const parsed = z.object({ choice: z.number().int().min(0) }).parse(JSON.parse(toolCall.function.arguments));
    const safe = Math.min(parsed.choice, options.length - 1);
    return { choice: safe };
  });
