/**
 * LLM provider abstraction for conversational Spanish replies.
 * Default: OpenAI gpt-4o-mini (inexpensive + fast).
 */

import type { ConversationMessage } from "./types";
import { buildSystemPrompt } from "./prompts";

export type ChatOptions = {
  systemPrompt?: string;
  history?: ConversationMessage[];
  userMessage: string;
};

export type LlmProvider = {
  chat(options: ChatOptions): Promise<string>;
};

function getLlmApiKey(): string {
  const key = process.env.LLM_API_KEY;
  if (!key) {
    throw new Error("LLM_API_KEY is not configured");
  }
  return key;
}

export function createOpenAiChatProvider(
  model = process.env.LLM_MODEL ?? "gpt-4o-mini",
): LlmProvider {
  return {
    async chat({ systemPrompt, history = [], userMessage }) {
      const apiKey = getLlmApiKey();
      const system = systemPrompt ?? buildSystemPrompt();

      const messages = [
        { role: "system" as const, content: system },
        ...history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user" as const, content: userMessage },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 220,
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (!response.ok) {
        console.error("LLM provider error:", response.status, await response.text());
        throw new Error("Conversation response failed");
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) {
        throw new Error("Empty conversation response");
      }
      return content;
    },
  };
}

let cachedProvider: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (!cachedProvider) {
    cachedProvider = createOpenAiChatProvider();
  }
  return cachedProvider;
}

export async function generateReply(options: ChatOptions): Promise<string> {
  return getLlmProvider().chat(options);
}
