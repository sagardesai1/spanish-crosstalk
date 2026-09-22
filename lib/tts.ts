/**
 * Text-to-speech provider abstraction.
 * Default: Google Cloud Text-to-Speech (neural Spanish voices, low cost).
 */

import type { AudioData } from "./types";
import { ensureGcpCredentials, getGcpProjectId } from "./gcp";
import { DEFAULT_SETTINGS, getVoiceForSettings, type PracticeSettings } from "./settings";

export type SpeechOptions = {
  languageCode?: string;
  voiceName?: string;
  ssmlGender?: "MALE" | "FEMALE";
  speakingRate?: number;
  pitch?: number;
  settings?: PracticeSettings;
};

export type TtsProvider = {
  generateSpeech(text: string, options?: SpeechOptions): Promise<AudioData>;
};

type TextToSpeechClient = {
  synthesizeSpeech: (request: unknown) => Promise<[unknown]>;
};

let clientPromise: Promise<TextToSpeechClient> | null = null;

async function getGoogleTtsClient(): Promise<TextToSpeechClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      ensureGcpCredentials();
      const projectId = getGcpProjectId();
      const { TextToSpeechClient } = await import("@google-cloud/text-to-speech");
      return new TextToSpeechClient({ projectId }) as unknown as TextToSpeechClient;
    })();
  }
  return clientPromise;
}

export function createGoogleCloudTtsProvider(): TtsProvider {
  return {
    async generateSpeech(text, options = {}) {
      const client = await getGoogleTtsClient();
      const fromSettings = getVoiceForSettings(options.settings ?? DEFAULT_SETTINGS);
      const languageCode = options.languageCode ?? fromSettings.languageCode;
      const name =
        options.voiceName ?? process.env.TTS_VOICE_NAME ?? fromSettings.voiceName;
      const ssmlGender = options.ssmlGender ?? fromSettings.ssmlGender;
      const speakingRate = options.speakingRate ?? fromSettings.speakingRate;
      const pitch = options.pitch ?? (ssmlGender === "MALE" ? -1.0 : 0);

      const [response] = (await client.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode,
          name,
          ssmlGender,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate,
          pitch,
        },
      })) as [{ audioContent?: Uint8Array | string | null }];

      const content = response.audioContent;
      if (!content) {
        throw new Error("Speech synthesis returned no audio");
      }

      const audio =
        typeof content === "string"
          ? Buffer.from(content, "base64")
          : Buffer.from(content);

      return {
        audio,
        mimeType: "audio/mpeg",
      };
    },
  };
}

let cachedProvider: TtsProvider | null = null;

export function getTtsProvider(): TtsProvider {
  if (!cachedProvider) {
    cachedProvider = createGoogleCloudTtsProvider();
  }
  return cachedProvider;
}

export async function generateSpeech(
  text: string,
  options?: SpeechOptions,
): Promise<AudioData> {
  return getTtsProvider().generateSpeech(text, options);
}
