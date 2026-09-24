/**
 * User-facing practice settings for Crosstalk.
 * Structured so more languages can be added later without rewriting the UI.
 */

export type LearnerLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type PartnerPersona = {
  name: string;
  city: string;
  country: string;
  age: number;
  occupation: string;
  interests: string[];
  hometownNote: string;
};

export type TargetLanguageId = "es";
export type SpanishRegion = "spain" | "latin_america";
export type VoiceGender = "male" | "female";

export type PracticeSettings = {
  level: LearnerLevel;
  /** Only Spanish is available in the MVP UI; kept for future languages. */
  language: TargetLanguageId;
  region: SpanishRegion;
  voiceGender: VoiceGender;
  /** Google TTS speakingRate, typically 0.7–1.15 */
  voiceSpeed: number;
  /** Daily Crosstalk practice goal in minutes */
  dailyGoalMinutes: number;
  /** Immersion-style continuous conversation (auto listen / auto send) */
  continuousConversation: boolean;
  /** Seconds of silence after speech before auto-sending */
  silenceDelaySeconds: number;
};

export const LEARNER_LEVELS: LearnerLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LANGUAGE_OPTIONS: Array<{
  id: TargetLanguageId;
  label: string;
  available: boolean;
}> = [{ id: "es", label: "Spanish", available: true }];

export const REGION_OPTIONS: Array<{ id: SpanishRegion; label: string }> = [
  { id: "spain", label: "Spain" },
  { id: "latin_america", label: "Latin America" },
];

export const DAILY_GOAL_OPTIONS = [10, 15, 20, 30, 45, 60] as const;
export const SILENCE_DELAY_OPTIONS = [1, 1.5, 2, 2.5, 3] as const;

export const DEFAULT_SETTINGS: PracticeSettings = {
  level: "A1",
  language: "es",
  region: "spain",
  voiceGender: "male",
  voiceSpeed: 0.88,
  dailyGoalMinutes: 20,
  continuousConversation: true,
  silenceDelaySeconds: 1.5,
};

export const SETTINGS_STORAGE_KEY = "spanish-crosstalk-settings";

const PARTNERS: Record<SpanishRegion, Record<VoiceGender, PartnerPersona>> = {
  spain: {
    male: {
      name: "Mateo",
      city: "Valencia",
      country: "Spain",
      age: 28,
      occupation: "barista and photography hobbyist",
      interests: ["coffee", "the beach", "fútbol", "cooking simple meals", "weekend trips"],
      hometownNote:
        "He grew up near the Mercado Central, knows good tortilla spots, quiet plazas, easy day trips to the coast, and talks like any Spaniard his age — vale, quedar, ir de cañas, complaining about the piso.",
    },
    female: {
      name: "Lucía",
      city: "Valencia",
      country: "Spain",
      age: 27,
      occupation: "graphic designer who loves morning walks",
      interests: ["design", "cafés", "the beach", "reading", "weekend markets"],
      hometownNote:
        "She knows sunny terraces near the Turia gardens, simple lunch spots, calm evening paseos by the sea, and the same Spain café chat you'd hear in Madrid or Valencia.",
    },
  },
  latin_america: {
    male: {
      name: "Diego",
      city: "Mexico City",
      country: "Mexico",
      age: 29,
      occupation: "café worker and weekend musician",
      interests: ["coffee", "music", "street food", "fútbol", "city walks"],
      hometownNote:
        "He knows great tacos al pastor nearby, parks for weekend walks, and easy metro tips for exploring the city.",
    },
    female: {
      name: "Camila",
      city: "Mexico City",
      country: "Mexico",
      age: 27,
      occupation: "teacher who loves weekend mercados",
      interests: ["cooking", "markets", "movies", "hiking nearby", "coffee"],
      hometownNote:
        "She knows friendly neighborhood cafés, weekend market finds, and simple spots for chilaquiles after a long week.",
    },
  },
};

/** Google Cloud neural voices mapped by region + gender. */
const VOICE_MAP: Record<
  SpanishRegion,
  Record<VoiceGender, { languageCode: string; voiceName: string }>
> = {
  spain: {
    male: { languageCode: "es-ES", voiceName: "es-ES-Neural2-B" },
    female: { languageCode: "es-ES", voiceName: "es-ES-Neural2-A" },
  },
  latin_america: {
    male: { languageCode: "es-US", voiceName: "es-US-Neural2-B" },
    female: { languageCode: "es-US", voiceName: "es-US-Neural2-A" },
  },
};

export function getPartnerForSettings(settings: PracticeSettings): PartnerPersona {
  return PARTNERS[settings.region][settings.voiceGender];
}

export function getVoiceForSettings(settings: PracticeSettings): {
  languageCode: string;
  voiceName: string;
  ssmlGender: "MALE" | "FEMALE";
  speakingRate: number;
} {
  const voice = VOICE_MAP[settings.region][settings.voiceGender];
  return {
    ...voice,
    ssmlGender: settings.voiceGender === "male" ? "MALE" : "FEMALE",
    speakingRate: clampVoiceSpeed(settings.voiceSpeed),
  };
}

export function clampVoiceSpeed(speed: number): number {
  if (Number.isNaN(speed)) return DEFAULT_SETTINGS.voiceSpeed;
  return Math.min(1.15, Math.max(0.7, speed));
}

/** Suggested TTS rate when the learner switches CEFR level (still user-overridable). */
export function defaultVoiceSpeedForLevel(level: LearnerLevel): number {
  switch (level) {
    case "A1":
      return 0.82;
    case "A2":
      return 0.88;
    case "B1":
      return 0.94;
    case "B2":
      return 1.0;
    case "C1":
      return 1.06;
    case "C2":
      return 1.12;
  }
}

export function levelGuidance(level: LearnerLevel): string {
  switch (level) {
    case "A1":
      return `ABSOLUTE BEGINNER input.
- Words: only the most common everyday lexicon (hola, café, casa, trabajo, hoy, bien, sí, no, me gusta).
- Grammar: present tense almost only. Avoid subjunctive, conditionals, perfect tenses, and long subordinate clauses.
- Length: 1 short sentence, sometimes 2. No stacked ideas.
- Clarity: enunciate fully — never slang, never slang truncations (no pa', to', na'), no idioms.
- Sound: patient café Spanish a tourist can follow. If a word is hard, pick an easier synonym.`;
    case "A2":
      return `ELEMENTARY.
- Still short and clear, but you may use pretérito perfecto / indefinido lightly and "voy a + infinitive".
- Occasional porque / entonces / también. Still avoid slang and reductions.
- 1–2 short sentences. Prefer concrete topics (food, weekend, work, weather).
- Do not sound like a textbook list — still human, just easy.`;
    case "B1":
      return `INTERMEDIATE.
- Natural everyday chat with a bit more detail and connectors (aunque, además, la verdad, pues).
- Mix present + past freely. Light imperfect is fine.
- Light colloquial flavor only: vale, tío/tía (sparingly), guay, quedar — always still understandable.
- 2–3 sentences. Avoid dense idioms and fast reductions.`;
    case "B2":
      return `UPPER-INTERMEDIATE — clearly harder than B1.
- Comfortable spoken Spanish with richer vocabulary and opinions.
- Use common Spain colloquialisms when region is Spain: mazo, currar, molar, flipar, en plan, a tope, un montón.
- Occasional spoken reductions are OK (pa' when natural) but keep turns followable.
- 2–4 sentences. Do NOT water this down to A2 clarity.`;
    case "C1":
      return `ADVANCED — must feel clearly harder than B2.
- Fluent, nuanced, opinionated café talk. Irony, soft sarcasm, and asides are welcome.
- Dense colloquial register for Spain: en plan, o sea, vamos, mira, a ver, currar, quedar, mazo, pasta (money), piso, colega, truncar, estar de resaca, ir de cañas.
- Link clauses the way locals do; do not over-enunciate or "teachery" slow down.
- Prefer spoken rhythm over perfect essay Spanish. Mild intensifiers OK (madre mía, qué fuerte, jolín) — avoid heavy vulgarity.
- 3–5 sentences when the topic needs it. Never simplify just to be helpful.`;
    case "C2":
      return `NATIVE-LIKE — this must NOT feel easy for a US learner.
- Talk like a local friend from your city after work: fast mental pace, assumed shared culture, unfinished thoughts, interruptions of yourself ("o sea…", "en plan…", "vamos, que…").
- Heavy peninsular colloquial Spanish when region is Spain: vale, tío/tía, mazo, currar, quedar, molar, flipar, a tope, de puta madre (mild, not constant), pasta, pasta gansa, ir de cañas, el after, quedamos en…, me pilla lejos, estoy hecho polvo, menuda historia, ni de coña, qué fuerte, flipando en colores.
- Spoken reductions and blending ON PURPOSE: pa', to', na', pa qué, ¿sabes?, ¿no?, ese plan, lo de… — write the way people actually say it, not dictionary forms every time.
- Cultural shorthand US learners miss: cañas vs cerveza, terraza, el indulto del puente, el AVE, el piso compartido, quedar vs reunirse, "te paso la ubicación".
- Longer turns OK (a small rant or story). Do NOT translate yourself, do NOT gloss slang, do NOT switch to English, do NOT slow into textbook Spanish.
- If you catch yourself sounding like a clear tutor, rewrite more colloquial and denser.`;
  }
}

export function dialectGuidance(region: SpanishRegion, level: LearnerLevel = "A1"): string {
  const advanced = level === "B2" || level === "C1" || level === "C2";
  const nativeLike = level === "C1" || level === "C2";

  if (region === "spain") {
    const base =
      "Speak peninsular Spanish from Spain (Valencia / broader Spain everyday register — the same colloquial layer people hear in Madrid cafés and group chats). Prefer tú with friends; use vosotros when addressing a group naturally.";
    if (!advanced) {
      return `${base} Keep wording clear; save dense slang for higher levels.`;
    }
    if (!nativeLike) {
      return `${base} Lean into common Spain colloquialisms US learners often miss (vale, quedar, currar, mazo, molar, en plan) without becoming unintelligible.`;
    }
    return `${base} At this level sound like a local, not a dubbing script: fillers (o sea, en plan, a ver, vamos), Madrid/Spain street phrases, and reduced spoken forms. Reference Spanish daily life (cañas, terrazas, el piso, el AVE, quedar) as a local would.`;
  }

  const latamBase =
    "Speak Latin American Spanish (Mexico City–friendly). Prefer ustedes over vosotros. Avoid Spain-only slang (no vale as a tic, no vosotros, no mazo).";
  if (!advanced) {
    return `${latamBase} Keep wording clear.`;
  }
  if (!nativeLike) {
    return `${latamBase} Use common Mexican colloquialisms (órale, qué onda, chido, Padre, ahorita, güey sparingly) while staying friendly.`;
  }
  return `${latamBase} Native-like CDMX café chat: fillers, reductions, and local shorthand (la neta, está cañón, me late, ni madres, ¿qué pex?, el tráfico de la ciudad) without tutoring the learner.`;
}

export function parseSettings(raw: unknown): PracticeSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };
  const value = raw as Partial<PracticeSettings>;
  const level = LEARNER_LEVELS.includes(value.level as LearnerLevel)
    ? (value.level as LearnerLevel)
    : DEFAULT_SETTINGS.level;
  const region =
    value.region === "spain" || value.region === "latin_america"
      ? value.region
      : DEFAULT_SETTINGS.region;
  const voiceGender =
    value.voiceGender === "male" || value.voiceGender === "female"
      ? value.voiceGender
      : DEFAULT_SETTINGS.voiceGender;

  const dailyGoalMinutes = DAILY_GOAL_OPTIONS.includes(
    value.dailyGoalMinutes as (typeof DAILY_GOAL_OPTIONS)[number],
  )
    ? (value.dailyGoalMinutes as number)
    : DEFAULT_SETTINGS.dailyGoalMinutes;

  const silenceDelaySeconds = SILENCE_DELAY_OPTIONS.includes(
    value.silenceDelaySeconds as (typeof SILENCE_DELAY_OPTIONS)[number],
  )
    ? (value.silenceDelaySeconds as number)
    : DEFAULT_SETTINGS.silenceDelaySeconds;

  return {
    level,
    language: "es",
    region,
    voiceGender,
    voiceSpeed: clampVoiceSpeed(
      typeof value.voiceSpeed === "number" ? value.voiceSpeed : DEFAULT_SETTINGS.voiceSpeed,
    ),
    dailyGoalMinutes,
    continuousConversation:
      typeof value.continuousConversation === "boolean"
        ? value.continuousConversation
        : DEFAULT_SETTINGS.continuousConversation,
    silenceDelaySeconds,
  };
}

export function loadSettingsFromStorage(): PracticeSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return parseSettings(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettingsToStorage(settings: PracticeSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/** Shared validation shape for API bodies. */
export function parseSettingsFromRequest(raw: unknown): PracticeSettings {
  return parseSettings(raw);
}
