/**
 * Client-side Firebase Auth: Google popup + email magic link.
 */

import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getOrCreateUserId, peekAnonymousUserId } from "@/lib/anonymousUser";
import { getClientAuth, isFirebaseClientConfigured } from "@/lib/firebaseClient";

export { peekAnonymousUserId };
export const EMAIL_FOR_SIGN_IN_KEY = "spanish-crosstalk-email-for-sign-in";

export function authConfigured(): boolean {
  return isFirebaseClientConfigured();
}

export function watchAuthState(callback: (user: User | null) => void): () => void {
  if (!isFirebaseClientConfigured()) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(getClientAuth(), callback);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  if (!isFirebaseClientConfigured()) return null;
  const user = getClientAuth().currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getClientAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function sendMagicLink(email: string): Promise<void> {
  const auth = getClientAuth();
  const trimmed = email.trim();
  if (!trimmed) throw new Error("Enter your email address.");

  await sendSignInLinkToEmail(auth, trimmed, {
    url: `${window.location.origin}/signin`,
    handleCodeInApp: true,
  });
  window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, trimmed);
}

export function isMagicLinkReturn(href = window.location.href): boolean {
  if (!isFirebaseClientConfigured()) return false;
  return isSignInWithEmailLink(getClientAuth(), href);
}

export async function completeMagicLinkSignIn(
  emailHint?: string,
  href = window.location.href,
): Promise<User> {
  const auth = getClientAuth();
  const stored = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
  const email = (emailHint ?? stored ?? "").trim();
  if (!email) {
    throw new Error("Confirm the email address you used for the magic link.");
  }
  const result = await signInWithEmailLink(auth, email, href);
  window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  // Drop the oobCode from the URL without a full reload.
  if (window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  return result.user;
}

export async function signOut(): Promise<void> {
  if (!isFirebaseClientConfigured()) return;
  await firebaseSignOut(getClientAuth());
}

/**
 * Active account id: Firebase UID when signed in, otherwise the anonymous local id.
 */
export function getActiveUserId(firebaseUid: string | null | undefined): string {
  if (firebaseUid) return firebaseUid;
  return getOrCreateUserId();
}

export async function syncSignedInAccount(anonymousUserId: string | null): Promise<void> {
  const token = await getIdToken();
  if (!token) throw new Error("Not signed in.");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Always write name/email onto the user doc for Firestore readability.
  const meRes = await fetch("/api/me", {
    method: "POST",
    headers,
    body: "{}",
    signal: AbortSignal.timeout(20_000),
  });
  const meJson = (await meRes.json()) as { error?: string };
  if (!meRes.ok) {
    throw new Error(meJson.error ?? "Couldn't save your profile.");
  }

  if (!anonymousUserId) return;

  const res = await fetch("/api/migrate", {
    method: "POST",
    headers,
    body: JSON.stringify({ anonymousUserId }),
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Couldn't migrate practice history.");
  }
}
