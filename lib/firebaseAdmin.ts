/**
 * Shared Firebase Admin bootstrap (Auth + Firestore).
 * Reuses the same GCP service account as Text-to-Speech.
 */

import { applicationDefault, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { ensureGcpCredentials, getGcpProjectId } from "./gcp";

function getAdminApp(): App {
  ensureGcpCredentials();
  const projectId = getGcpProjectId();

  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}
