/**
 * Lightweight translation helper (Spanish → English for Crosstalk support).
 * Uses the same inexpensive LLM as chat.
 */

function getLlmApiKey(): string {
  const key = process.env.LLM_API_KEY;
  if (!key) {
    throw new Error("LLM_API_KEY is not configured");
  }
  return key;
}

export async function translateToEnglish(text: string): Promise<string> {
  const apiKey = getLlmApiKey();
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "Translate the user's Spanish text into clear, natural English. Return only the English translation — no quotes, labels, or explanations.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    console.error("Translate provider error:", response.status, await response.text());
    throw new Error("Translation failed");
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("Empty translation");
  }
  return content;
}
