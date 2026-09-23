"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { DailyProgressCard } from "@/components/DailyProgressCard";
import { Message } from "@/components/Message";
import { MicrophoneButton } from "@/components/MicrophoneButton";
import { SessionTimer } from "@/components/SessionTimer";
import { SettingsPanel } from "@/components/SettingsPanel";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ViewTabs, type AppView } from "@/components/ViewTabs";
import {
  clearTodayConversationClient,
  fetchTodayConversation,
  saveTodayConversationClient,
} from "@/lib/conversation";
import { fetchProgress, postProgress } from "@/lib/progress";
import {
  DEFAULT_SETTINGS,
  getPartnerForSettings,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  type PracticeSettings,
} from "@/lib/settings";
import { startSilenceWatcher, type SilenceWatcher } from "@/lib/silenceDetect";
import type { AppStatus, ConversationMessage } from "@/lib/types";

type UiMessage = ConversationMessage & { id: string; speakerName?: string };

type ConversationProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
  headerRight?: ReactNode;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export function Conversation({ view, onViewChange, headerRight }: ConversationProps) {
  const { ready: authReady, userId: authUserId, migrating } = useAuth();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [status, setStatus] = useState<AppStatus>("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canReplay, setCanReplay] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [settings, setSettings] = useState<PracticeSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [secondsToday, setSecondsToday] = useState(0);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [threadReady, setThreadReady] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioUnlockedRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<ConversationMessage[]>([]);
  const settingsRef = useRef(settings);
  const persistSettingsRef = useRef(false);
  const sessionCreditedRef = useRef(0);
  const userIdRef = useRef("");
  const skipNextSaveRef = useRef(false);
  const silenceWatcherRef = useRef<SilenceWatcher | null>(null);
  const autoContinueRef = useRef(true);
  const discardRecordingRef = useRef(false);
  const startListeningRef = useRef<() => Promise<void>>(async () => undefined);
  const runConversationTurnRef = useRef<(blob: Blob) => Promise<void>>(async () => undefined);

  const partner = getPartnerForSettings(settings);
  const hasThread = messages.length > 0;

  // PLACEHOLDER_BODY - will be replaced
  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col overflow-hidden px-4 pb-4 pt-4 sm:max-w-4xl sm:px-6 sm:pb-5 sm:pt-5 lg:max-w-5xl lg:px-8">
      <header className="relative mb-3 shrink-0">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <ViewTabs view={view} onChange={onViewChange} />
          <h1 className="hidden min-w-0 flex-1 truncate text-center font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--foreground)] sm:block">
            <Link href="/" className="transition hover:text-[var(--accent)]">Spanish Crosstalk</Link>
          </h1>
          <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
        </div>
      </header>
      <p className="text-sm text-[var(--muted)]">Loading practice UI…</p>
    </div>
  );
}
