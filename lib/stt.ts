/**
 * Speech-to-text provider abstraction.
 * Default: OpenAI Whisper (fast, inexpensive, reliable).
 * Swap implementations without changing API routes or UI.
 */

export type TranscribeOptions = {
  language?: string;
  mimeType?: string;
  filename?: string;
};

export type SttProvider = {
  transcribe(audio: Buffer, options?: TranscribeOptions): Promise<string>;
};

function getOpenAiSttApiKey(): string {
  const key = process.env.STT_API_KEY;
  if (!key) {
    throw new Error("STT_API_KEY is not configured");
  }
  return key;
}

/**
 * OpenAI Whisper transcription.
 * Uses STT_API_KEY so it can differ from the LLM key.
 */
export function createOpenAiWhisperProvider(): SttProvider {
  return {
    async transcribe(audio, options = {}) {
      const apiKey = getOpenAiSttApiKey();
      const mimeType = options.mimeType ?? "audio/webm";
      const filename = options.filename ?? guessFilename(mimeType);

      const form = new FormData();
      const blob = new Blob([new Uint8Array(audio)], { type: mimeType });
      form.append("file", blob, filename);
      form.append("model", "whisper-1");
      // Prefer English for the learner's side of Crosstalk.
      form.append("language", options.language ?? "en");
      form.append("response_format", "json");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
        signal: AbortSignal.timeout(45_000),
      });

      if (!response.ok) {
        console.error("STT provider error:", response.status, await response.text());
        throw new Error("Speech recognition failed");
      }

      const data = (await response.json()) as { text?: string };
      const text = data.text?.trim() ?? "";
      return text;
    },
  };
}

function guessFilename(mimeType: string): string {
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "recording.m4a";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "recording.mp3";
  if (mimeType.includes("wav")) return "recording.wav";
  if (mimeType.includes("ogg")) return "recording.ogg";
  return "recording.webm";
}

let cachedProvider: SttProvider | null = null;

export function getSttProvider(): SttProvider {
  if (!cachedProvider) {
    cachedProvider = createOpenAiWhisperProvider();
  }
  return cachedProvider;
}

export async function transcribeAudio(
  audio: Buffer,
  options?: TranscribeOptions,
): Promise<string> {
  return getSttProvider().transcribe(audio, options);
}
