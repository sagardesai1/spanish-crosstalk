export type ConversationRole = "user" | "assistant";

export type ConversationMessage = {
  role: ConversationRole;
  content: string;
};

export type StoredChatMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  speakerName?: string;
};

export type AudioData = {
  audio: Buffer;
  mimeType: string;
};

export type AppStatus =
  | "ready"
  | "connecting"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "error";
