"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  authConfigured,
  completeMagicLinkSignIn,
  getActiveUserId,
  isMagicLinkReturn,
  peekAnonymousUserId,
  sendMagicLink,
  signInWithGoogle,
  signOut as clientSignOut,
  syncSignedInAccount,
  watchAuthState,
} from "@/lib/authClient";

type AuthContextValue = {
  configured: boolean;
  ready: boolean;
  user: User | null;
  userId: string;
  migrating: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInGoogle: () => Promise<void>;
  sendLink: (email: string) => Promise<void>;
  finishMagicLink: (email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  needsMagicEmail: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : "";
  const message = error instanceof Error ? error.message : "";

  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Google sign-in was cancelled.";
  }
  if (code === "auth/popup-blocked") {
    return "Your browser blocked the Google sign-in popup. Allow popups and try again.";
  }
  if (code === "auth/operation-not-allowed") {
    return "That sign-in method isn't enabled yet in Firebase Auth.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain isn't authorized for Firebase Auth. Add it under Authentication → Settings → Authorized domains.";
  }
  if (code === "auth/invalid-email") {
    return "That email address doesn't look valid.";
  }
  if (code === "auth/invalid-action-code") {
    return "This magic link is invalid or already used. Request a new one.";
  }
  if (message.includes("Firebase Auth isn't configured")) {
    return message;
  }
  return message || "Something went wrong with sign-in.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = authConfigured();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsMagicEmail, setNeedsMagicEmail] = useState(false);
  const syncedForUidRef = useRef<string | null>(null);
  const syncGenerationRef = useRef(0);

  useEffect(() => {
    if (!configured) {
      const id = window.setTimeout(() => {
        setUserId(getActiveUserId(null));
        setReady(true);
      }, 0);
      return () => window.clearTimeout(id);
    }

    // Complete email-link return before attaching the normal listener.
    if (isMagicLinkReturn()) {
      void completeMagicLinkSignIn()
        .then(() => setNeedsMagicEmail(false))
        .catch((error: unknown) => {
          const code =
            error && typeof error === "object" && "code" in error
              ? String((error as { code?: string }).code)
              : "";
          if (
            code === "auth/argument-error" ||
            (error instanceof Error && /email/i.test(error.message))
          ) {
            setNeedsMagicEmail(true);
          } else {
            setAuthError(friendlyAuthError(error));
          }
        });
    }

    const unsub = watchAuthState((next) => {
      setUser(next);
      setUserId(getActiveUserId(next?.uid ?? null));
      setReady(true);
    });
    return unsub;
  }, [configured]);

  // Save profile + migrate guest progress once per signed-in UID.
  // Do not depend on `migrating` — that caused Syncing… to stick forever
  // when the effect re-ran and cancelled the in-flight finally handler.
  useEffect(() => {
    if (!user) {
      syncedForUidRef.current = null;
      const clearId = window.setTimeout(() => setMigrating(false), 0);
      return () => window.clearTimeout(clearId);
    }
    if (syncedForUidRef.current === user.uid) return;

    const uid = user.uid;
    const generation = ++syncGenerationRef.current;
    const anonymousId = peekAnonymousUserId();
    const shouldMigrate = !!anonymousId && anonymousId !== uid;

    const startId = window.setTimeout(() => {
      setMigrating(true);
      void syncSignedInAccount(shouldMigrate ? anonymousId : null)
        .catch((error: unknown) => {
          console.error(error);
          if (syncGenerationRef.current === generation) {
            setAuthError(friendlyAuthError(error));
          }
        })
        .finally(() => {
          if (syncGenerationRef.current !== generation) return;
          syncedForUidRef.current = uid;
          setMigrating(false);
          setUserId(uid);
        });
    }, 0);

    return () => {
      window.clearTimeout(startId);
      // Invalidate in-flight work from a superseded effect run (e.g. Strict Mode).
      syncGenerationRef.current += 1;
    };
  }, [user]);

  useEffect(() => {
    if (!needsMagicEmail) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/signin") return;
    const search = window.location.search;
    window.location.replace(`/signin${search}`);
  }, [needsMagicEmail]);

  const signInGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError(friendlyAuthError(error));
      throw error;
    }
  }, []);

  const sendLink = useCallback(async (email: string) => {
    setAuthError(null);
    try {
      await sendMagicLink(email);
    } catch (error) {
      setAuthError(friendlyAuthError(error));
      throw error;
    }
  }, []);

  const finishMagicLink = useCallback(async (email?: string) => {
    setAuthError(null);
    try {
      await completeMagicLinkSignIn(email);
      setNeedsMagicEmail(false);
    } catch (error) {
      setAuthError(friendlyAuthError(error));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    syncedForUidRef.current = null;
    await clientSignOut();
    setUserId(getActiveUserId(null));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      ready,
      user,
      userId,
      migrating,
      authError,
      clearAuthError: () => setAuthError(null),
      signInGoogle,
      sendLink,
      finishMagicLink,
      signOut,
      needsMagicEmail,
    }),
    [
      configured,
      ready,
      user,
      userId,
      migrating,
      authError,
      signInGoogle,
      sendLink,
      finishMagicLink,
      signOut,
      needsMagicEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
