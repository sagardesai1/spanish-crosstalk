/**
 * Browser Firebase app (Auth only). Config is public by design.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

function readConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
  };
}

let app: FirebaseApp | null = null;

export function isFirebaseClientConfigured(): boolean {
  return readConfig() != null;
}

export function getFirebaseApp(): FirebaseApp {
  const config = readConfig();
  if (!config) {
    throw new Error(
      "Firebase Auth isn't configured. Add NEXT_PUBLIC_FIREBASE_* values to .env.local.",
    );
  }
  if (app) return app;
  app = getApps()[0] ?? initializeApp(config);
  return app;
}

export function getClientAuth(): Auth {
  return getAuth(getFirebaseApp());
}
