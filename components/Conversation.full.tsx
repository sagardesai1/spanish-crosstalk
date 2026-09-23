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
          setSettings((prev) => ({ ...prev, dailyGoalMinutes: snapshot.dailyGoalMinutes }));
          skipNextSaveRef.current = true;
          if (conversation.messages.length > 0) {
            setMessages(conversation.messages.map((message) => ({ id: message.id, role: message.role, content: message.content, speakerName: message.speakerName })));
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
          if (!cancelled) setProgressError(error instanceof Error ? error.message : "Couldn't load today's progress.");
        })
        .finally(() => {
          if (!cancelled) { setProgressLoading(false); setThreadReady(true); }
        });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(id); };
  }, [authReady, authUserId, migrating]);

  useEffect(() => {
    settingsRef.current = settings;
    if (persistSettingsRef.current) saveSettingsToStorage(settings);
  }, [settings]);

  useEffect(() => {
    if (!threadReady || !userId) return;
    if (skipNextSaveRef.current) { skipNextSaveRef.current = false; return; }
    const id = window.setTimeout(() => {
      void saveTodayConversationClient(userId, messages.map((message) => ({ id: message.id, role: message.role, content: message.content, speakerName: message.speakerName }))).catch(console.error);
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
        .then((snapshot) => { setSecondsToday(snapshot.secondsToday); setProgressError(null); })
        .catch((error: unknown) => {
          console.error(error);
          sessionCreditedRef.current = Math.max(0, elapsedSec - delta);
          setProgressError(error instanceof Error ? error.message : "Couldn't save practice time.");
        });
    }, 5000);
    return () => window.clearInterval(id);
  }, [sessionStarted, startedAt, userId]);

  useEffect(() => { historyRef.current = messages.map(({ role, content }) => ({ role, content })); }, [messages]);
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, status]);
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const fail = useCallback((message: string) => { setStatus("error"); setErrorMessage(message); }, []);

  const unlockAudioPlayback = useCallback(async () => {
    if (audioUnlockedRef.current) return;
    try {
      const silent = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      const audio = new Audio(silent);
      audioRef.current = audio;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audioUnlockedRef.current = true;
    } catch { /* autoplay blocked */ }
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
        const onEnded = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error("playback failed")); };
        const cleanup = () => { audio.removeEventListener("ended", onEnded); audio.removeEventListener("error", onError); };
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

  const speakReply = useCallback(async (reply: string) => {
    const speechRes = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reply, settings: settingsRef.current }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!speechRes.ok) {
      const speechJson = (await speechRes.json().catch(() => null)) as { error?: string } | null;
      fail(speechJson?.error ?? "Couldn't play the reply audio. The text is still above.");
      return false;
    }
    const arrayBuffer = await speechRes.arrayBuffer();
    const contentType = speechRes.headers.get("Content-Type") || "audio/mpeg";
    const speechBlob = new Blob([arrayBuffer], { type: contentType });
    const played = await playAudioBlob(speechBlob);
    if (played) setStatus("ready");
    return played;
  }, [fail, playAudioBlob]);

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
      setMessages([{ id: createId(), role: "assistant", content: reply, speakerName: currentPartner.name }]);
      const played = await speakReply(reply);
      if (played) scheduleAutoListen(500);
    } catch (error) {
      console.error(error);
      if (error instanceof DOMException && error.name === "TimeoutError") {
        fail("That took too long. Please try again.");
        return;
      }
      fail("Couldn't start the conversation. Please try again.");
    }
  }, [fail, scheduleAutoListen, speakReply, unlockAudioPlayback]);

  const runConversationTurn = useCallback(async (audioBlob: Blob) => {
    setErrorMessage(null);
    setNeedsTapToPlay(false);
    setStatus("transcribing");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData, signal: AbortSignal.timeout(60_000) });
      const transcribeJson = (await transcribeRes.json()) as { text?: string; error?: string };
      if (!transcribeRes.ok || !transcribeJson.text) {
        if (autoContinueRef.current && settingsRef.current.continuousConversation && transcribeRes.status === 422) {
          setStatus("ready");
          setErrorMessage("Didn't catch that — listening again…");
          scheduleAutoListen(600);
          return;
        }
        fail(transcribeJson.error ?? "Couldn't understand that. Please try again.");
        return;
      }
      const userText = transcribeJson.text;
      const priorHistory = historyRef.current;
      setMessages((prev) => [...prev, { id: createId(), role: "user", content: userText }]);
      setStatus("thinking");
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: priorHistory, settings: settingsRef.current }),
        signal: AbortSignal.timeout(60_000),
      });
      const chatJson = (await chatRes.json()) as { reply?: string; error?: string };
      if (!chatRes.ok || !chatJson.reply) {
        fail(chatJson.error ?? "Couldn't get a reply. Please try again.");
        return;
      }
      const reply = chatJson.reply;
      const currentPartner = getPartnerForSettings(settingsRef.current);
      setMessages((prev) => [...prev, { id: createId(), role: "assistant", content: reply, speakerName: currentPartner.name }]);
      const played = await speakReply(reply);
      if (played) scheduleAutoListen(500);
    } catch (error) {
      console.error(error);
      if (error instanceof DOMException && error.name === "TimeoutError") {
        fail("That took too long. Please try again.");
        return;
      }
      fail("Something went wrong. Please try again.");
    }
  }, [fail, scheduleAutoListen, speakReply]);

  useEffect(() => { runConversationTurnRef.current = runConversationTurn; }, [runConversationTurn]);

  const startListening = useCallback(async () => {
    if (!sessionStarted && !hasThread) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") return;
    if (startedAt == null) {
      setStartedAt(Date.now());
      setSessionStarted(true);
      sessionCreditedRef.current = 0;
    }
    autoContinueRef.current = true;
    setErrorMessage(null);
    setNeedsTapToPlay(false);
    setStatus("connecting");
    await unlockAudioPlayback();
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      fail("This browser doesn't support microphone recording.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      fail("This browser doesn't support MediaRecorder.");
      return;
    }
    if (!window.isSecureContext) {
      fail("Microphone access needs a secure context (localhost or HTTPS).");
      return;
    }
    try {
      audioRef.current?.pause();
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        new Promise<MediaStream>((_, reject) => {
          window.setTimeout(() => {
            reject(Object.assign(new Error("Microphone request timed out"), { name: "TimeoutError" }));
          }, 12_000);
        }),
      ]);
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onerror = () => { stopTracks(); fail("Recording failed. Please try again."); };
      recorder.onstop = () => {
        silenceWatcherRef.current?.stop();
        silenceWatcherRef.current = null;
        const shouldDiscard = discardRecordingRef.current;
        discardRecordingRef.current = false;
        stopTracks();
        mediaRecorderRef.current = null;
        if (shouldDiscard) {
          chunksRef.current = [];
          setErrorMessage(null);
          setStatus("ready");
          return;
        }
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size === 0) {
          if (autoContinueRef.current && settingsRef.current.continuousConversation) {
            setStatus("ready");
            setErrorMessage("Didn't catch audio — listening again…");
            scheduleAutoListen(600);
            return;
          }
          fail("The recording was empty. Hold the mic a moment longer and try again.");
          return;
        }
        void runConversationTurnRef.current(blob);
      };
      recorder.start(250);
      setStatus("listening");
      if (settingsRef.current.continuousConversation) {
        const delayMs = Math.round(settingsRef.current.silenceDelaySeconds * 1000);
        silenceWatcherRef.current = startSilenceWatcher(stream, {
          silenceDelayMs: delayMs,
          onSilence: () => {
            const active = mediaRecorderRef.current;
            if (active && active.state !== "inactive") active.stop();
          },
          onMaxDuration: () => {
            const active = mediaRecorderRef.current;
            if (active && active.state !== "inactive") active.stop();
          },
        });
      }
    } catch (error) {
      stopTracks();
      const name = error instanceof DOMException ? error.name : error && typeof error === "object" && "name" in error ? String((error as { name: unknown }).name) : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") { fail("Microphone permission denied. Allow the mic, then try again."); return; }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") { fail("No microphone found. Plug one in and try again."); return; }
      if (name === "TimeoutError") { fail("Microphone permission timed out. Allow the mic in your browser, then try again."); return; }
      fail("Couldn't access the microphone. Please try again.");
    }
  }, [fail, hasThread, scheduleAutoListen, sessionStarted, startedAt, stopTracks, unlockAudioPlayback]);

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  const cancelListeningWithoutSending = () => {
    autoContinueRef.current = false;
    silenceWatcherRef.current?.stop();
    silenceWatcherRef.current = null;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      discardRecordingRef.current = true;
      recorder.stop();
      return;
    }
    discardRecordingRef.current = false;
    stopTracks();
    setErrorMessage(null);
    setStatus("ready");
  };

  const handleMicClick = () => {
    if (!sessionStarted && !hasThread) return;
    if (status === "listening" || status === "connecting") { cancelListeningWithoutSending(); return; }
    if (status === "ready" || status === "error") { autoContinueRef.current = true; void startListening(); }
  };

  const handleReplay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrlRef.current) return;
    try {
      setErrorMessage(null);
      setNeedsTapToPlay(false);
      audio.currentTime = 0;
      setStatus("speaking");
      await new Promise<void>((resolve, reject) => {
        const onEnded = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error("playback failed")); };
        const cleanup = () => { audio.removeEventListener("ended", onEnded); audio.removeEventListener("error", onError); };
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);
        void audio.play().then(undefined, onError);
      });
      setStatus("ready");
    } catch {
      setNeedsTapToPlay(true);
      fail(`Couldn't play ${partner.name}'s reply. Tap play again.`);
    }
  };

  const flushPracticeTime = useCallback(() => {
    if (!sessionStarted || startedAt == null || !userIdRef.current) return;
    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
    const delta = elapsedSec - sessionCreditedRef.current;
    if (delta <= 0) return;
    sessionCreditedRef.current = elapsedSec;
    void postProgress({ userId: userIdRef.current, addSeconds: delta })
      .then((snapshot) => setSecondsToday(snapshot.secondsToday))
      .catch(console.error);
  }, [sessionStarted, startedAt]);

  const handlePauseSession = () => {
    cancelListeningWithoutSending();
    flushPracticeTime();
    audioRef.current?.pause();
    setStartedAt(null);
    setNeedsTapToPlay(false);
    setErrorMessage(null);
    setStatus("ready");
  };

  const handleClearChat = () => {
    flushPracticeTime();
    audioRef.current?.pause();
    stopTracks();
    setMessages([]);
    setErrorMessage(null);
    setCanReplay(false);
    setNeedsTapToPlay(false);
    setSessionStarted(false);
    setStartedAt(null);
    setStatus("ready");
    if (userIdRef.current) void clearTodayConversationClient(userIdRef.current).catch(console.error);
  };

  const handleSettingsChange = (next: PracticeSettings) => {
    const goalChanged = next.dailyGoalMinutes !== settings.dailyGoalMinutes;
    setSettings(next);
    if (goalChanged) void saveDailyGoal(next.dailyGoalMinutes);
  };

  const saveDailyGoal = (dailyGoalMinutes: number) => {
    setSettings((prev) => ({ ...prev, dailyGoalMinutes }));
    if (!userIdRef.current) return;
    void postProgress({ userId: userIdRef.current, dailyGoalMinutes })
      .then((snapshot) => {
        setSecondsToday(snapshot.secondsToday);
        setSettings((prev) => ({ ...prev, dailyGoalMinutes: snapshot.dailyGoalMinutes }));
        setProgressError(null);
      })
      .catch((error: unknown) => {
        console.error(error);
        setProgressError(error instanceof Error ? error.message : "Couldn't save daily goal.");
      });
  };

  const micDisabled = (!sessionStarted && !hasThread) || status === "transcribing" || status === "thinking" || status === "speaking";

  const helperText = !hasThread
    ? `${partner.name} will greet you first, then the mic stays open for a natural back-and-forth.`
    : status === "listening"
      ? settings.continuousConversation
        ? `Listening… pause ${settings.silenceDelaySeconds}s after you finish and it sends automatically.`
        : "Tap again when you finish speaking."
      : status === "connecting"
        ? "Waiting for microphone permission…"
        : needsTapToPlay
          ? `${partner.name}'s reply is ready — tap play to hear them.`
          : startedAt
            ? settings.continuousConversation
              ? "Continuous mode on — tap the mic to stop without sending, or Pause to take a break."
              : "Today's chat is saved — refresh anytime and continue."
            : "Today's chat was restored. Tap the mic to keep going.";

  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col overflow-hidden px-4 pb-4 pt-4 sm:max-w-4xl sm:px-6 sm:pb-5 sm:pt-5 lg:max-w-5xl lg:px-8">
      <header className="relative mb-3 shrink-0">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <ViewTabs view={view} onChange={onViewChange} />
          <h1 className="hidden min-w-0 flex-1 truncate text-center font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--foreground)] sm:block">
            <Link href="/" className="transition hover:text-[var(--accent)]">Spanish Crosstalk</Link>
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            {headerRight}
            <button type="button" onClick={() => setSettingsOpen(true)} className="rounded-lg border border-[var(--level-border)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]" aria-label="Open settings">Settings</button>
          </div>
        </div>
        <h1 className="mt-2 text-center font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--foreground)] sm:hidden">
          <Link href="/" className="transition hover:text-[var(--accent)]">Spanish Crosstalk</Link>
        </h1>
        <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center gap-2.5 sm:min-w-0 sm:flex-1">
            <p className="inline-flex items-center rounded-md border border-[var(--level-border)] px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">{settings.level}</p>
            <SessionTimer running={startedAt != null} startedAt={startedAt} />
            <p className="text-sm text-[var(--muted)]">with {partner.name} · {partner.city}</p>
          </div>
          <div className="w-full sm:max-w-xs sm:shrink-0 lg:max-w-sm">
            <DailyProgressCard compact secondsToday={secondsToday} dailyGoalMinutes={settings.dailyGoalMinutes} loading={progressLoading} onGoalChange={saveDailyGoal} />
          </div>
        </div>
        {progressError ? <p className="mt-2 text-xs text-[var(--danger)]">{progressError}</p> : null}
      </header>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.35rem] border border-[var(--panel-border)] bg-[var(--panel)]/85 shadow-[0_20px_60px_rgba(28,42,36,0.06)] backdrop-blur-sm" aria-label="Conversation transcript">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 sm:py-7 lg:px-10">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-5 text-center">
              <p className="max-w-lg text-[1.1rem] leading-relaxed text-[var(--muted)] sm:text-[1.15rem]">
                Start a session and {partner.name} will open in Spanish. Then keep talking naturally — after a short silence your turn sends automatically. Use Translate anytime you need the English meaning.
              </p>
              <button type="button" onClick={() => void startConversation()} disabled={status === "thinking" || status === "speaking" || status === "transcribing" || status === "connecting" || status === "listening"} className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
                {status === "thinking" || status === "speaking" ? `${partner.name} is joining…` : "Start conversation"}
              </button>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} role={message.role} content={message.content} speakerName={message.speakerName ?? partner.name} />
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      </section>
      <div className="mt-3 flex shrink-0 flex-col items-center gap-3 sm:gap-3.5">
        <StatusIndicator status={status} errorMessage={errorMessage} partnerName={partner.name} />
        <MicrophoneButton isListening={status === "listening" || status === "connecting"} disabled={micDisabled} onClick={handleMicClick} />
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
          <button type="button" onClick={() => void handleReplay()} disabled={!canReplay || status === "listening" || micDisabled} className={["underline-offset-4 hover:text-[var(--foreground)] hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40", needsTapToPlay ? "font-semibold text-[var(--partner)]" : ""].join(" ")}>
            {needsTapToPlay ? `Play ${partner.name}'s reply` : "Replay last reply"}
          </button>
          <span aria-hidden className="hidden sm:inline">·</span>
          <button type="button" onClick={handlePauseSession} disabled={!startedAt || status === "listening" || status === "connecting"} className="underline-offset-4 hover:text-[var(--foreground)] hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40">Pause</button>
          <span aria-hidden className="hidden sm:inline">·</span>
          <button type="button" onClick={handleClearChat} disabled={!hasThread || status === "listening" || status === "connecting"} className="underline-offset-4 hover:text-[var(--foreground)] hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40">Clear chat</button>
        </div>
        <p className="max-w-lg text-center text-xs leading-relaxed text-[var(--muted)]">{helperText}</p>
      </div>
      <SettingsPanel open={settingsOpen} settings={settings} onChange={handleSettingsChange} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
