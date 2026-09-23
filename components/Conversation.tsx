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

  const stopTracks = useCallback(() => {
    silenceWatcherRef.current?.stop();
    silenceWatcherRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const scheduleAutoListen = useCallback((delayMs = 400) => {
    if (!autoContinueRef.current) return;
    if (!settingsRef.current.continuousConversation) return;
    window.setTimeout(() => {
      if (!autoContinueRef.current) return;
      if (!settingsRef.current.continuousConversation) return;
      void startListeningRef.current();
    }, delayMs);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const loaded = loadSettingsFromStorage();
      settingsRef.current = loaded;
      setSettings(loaded);
      persistSettingsRef.current = true;
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Load progress + today's chat for the signed-in account.
  useEffect(() => {
    if (!authReady || !authUserId || migrating) return;

    let cancelled = false;
    const id = window.setTimeout(() => {
      setProgressLoading(true);
      setThreadReady(false);
      userIdRef.current = authUserId;
      setUserId(authUserId);

      void Promise.all([fetchProgress(authUserId), fetchTodayConversation(authUserId)])
        .then(([snapshot, conversation]) => {
          if (cancelled) return;
          setSecondsToday(snapshot.secondsToday);
          setSettings((prev) => ({
            ...prev,
            dailyGoalMinutes: snapshot.dailyGoalMinutes,
          }));
          skipNextSaveRef.current = true;
          if (conversation.messages.length > 0) {
            setMessages(
              conversation.messages.map((message) => ({
                id: message.id,
                role: message.role,
                content: message.content,
                speakerName: message.speakerName,
              })),
            );
            setSessionStarted(true);
          } else {
            setMessages([]);
            setSessionStarted(false);
            setStartedAt(null);
          }
          setProgressError(null);
        })
        .catch((error: unknown) => {
          console.error(error);
          if (!cancelled) {
            setProgressError(
              error instanceof Error ? error.message : "Couldn't load today's progress.",
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setProgressLoading(false);
            setThreadReady(true);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [authReady, authUserId, migrating]);

  useEffect(() => {
    settingsRef.current = settings;
    if (persistSettingsRef.current) {
      saveSettingsToStorage(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (!threadReady || !userId) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const id = window.setTimeout(() => {
      void saveTodayConversationClient(
        userId,
        messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          speakerName: message.speakerName,
        })),
      ).catch((error: unknown) => {
        console.error(error);
      });
    }, 500);

    return () => window.clearTimeout(id);
  }, [messages, threadReady, userId]);

  useEffect(() => {
    if (!sessionStarted || startedAt == null || !userId) return;

    sessionCreditedRef.current = 0;

    const id = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      const delta = elapsedSec - sessionCreditedRef.current;
      if (delta < 5) return;

      sessionCreditedRef.current = elapsedSec;
      void postProgress({ userId, addSeconds: delta })
        .then((snapshot) => {
          setSecondsToday(snapshot.secondsToday);
          setProgressError(null);
        })
        .catch((error: unknown) => {
          console.error(error);
          sessionCreditedRef.current = Math.max(0, elapsedSec - delta);
          setProgressError(
            error instanceof Error ? error.message : "Couldn't save practice time.",
          );
        });
    }, 5000);

    return () => window.clearInterval(id);
  }, [sessionStarted, startedAt, userId]);

  useEffect(() => {
    historyRef.current = messages.map(({ role, content }) => ({ role, content }));
  }, [messages]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const fail = useCallback((message: string) => {
    setStatus("error");
    setErrorMessage(message);
  }, []);

  const unlockAudioPlayback = useCallback(async () => {
    if (audioUnlockedRef.current) return;
    try {
      const silent =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      const audio = new Audio(silent);
      audioRef.current = audio;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audioUnlockedRef.current = true;
    } catch {
      // User can tap play if autoplay stays blocked.
    }
  }, []);

  const playAudioBlob = useCallback(async (blob: Blob): Promise<boolean> => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const mimeType = blob.type || "audio/mpeg";
    const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
    const url = URL.createObjectURL(typedBlob);
    audioUrlRef.current = url;
    setCanReplay(true);
    setNeedsTapToPlay(false);

    const audio = new Audio(url);
    audioRef.current = audio;

    setStatus("speaking");
    try {
      await new Promise<void>((resolve, reject) => {
        const onEnded = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error("playback failed"));
        };
        const cleanup = () => {
          audio.removeEventListener("ended", onEnded);
          audio.removeEventListener("error", onError);
        };
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);
        void audio.play().then(undefined, onError);
      });
      setNeedsTapToPlay(false);
      return true;
    } catch {
      setNeedsTapToPlay(true);
      setStatus("ready");
      return false;
    }
  }, []);

  const speakReply = useCallback(
    async (reply: string) => {
      const speechRes = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, settings: settingsRef.current }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!speechRes.ok) {
        const speechJson = (await speechRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        fail(speechJson?.error ?? "Couldn't play the reply audio. The text is still above.");
        return false;
      }

      const arrayBuffer = await speechRes.arrayBuffer();
      const contentType = speechRes.headers.get("Content-Type") || "audio/mpeg";
      const speechBlob = new Blob([arrayBuffer], { type: contentType });
      const played = await playAudioBlob(speechBlob);
      if (played) {
        setStatus("ready");
      }
      return played;
    },
    [fail, playAudioBlob],
  );

  const startConversation = useCallback(async () => {
    setErrorMessage(null);
    setNeedsTapToPlay(false);
    autoContinueRef.current = true;
    setStatus("thinking");
    await unlockAudioPlayback();

    setStartedAt(Date.now());
    setSessionStarted(true);

    try {
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: true, settings: settingsRef.current }),
        signal: AbortSignal.timeout(60_000),
      });
      const chatJson = (await chatRes.json()) as { reply?: string; error?: string };

      if (!chatRes.ok || !chatJson.reply) {
        fail(chatJson.error ?? "Couldn't start the conversation. Please try again.");
        return;
      }

      const reply = chatJson.reply;
      const currentPartner = getPartnerForSettings(settingsRef.current);
      setMessages([
        {
          id: createId(),
          role: "assistant",
          content: reply,
          speakerName: currentPartner.name,
        },
      ]);
      const played = await speakReply(reply);
      if (played) {
        scheduleAutoListen(500);
      }
    } catch (error) {
      console.error(error);
      if (error instanceof DOMException && error.name === "TimeoutError") {
        fail("That took too long. Please try again.");
        return;
      }
      fail("Couldn't start the conversation. Please try again.");
    }
  }, [fail, scheduleAutoListen, speakReply, unlockAudioPlayback]);

  // CONTINUED_IN_PART2
  return null;
}
