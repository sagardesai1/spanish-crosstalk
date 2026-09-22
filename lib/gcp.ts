/**
 * Shared Google Cloud credential bootstrap for TTS + Firestore.
 */

import { mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let prepared = false;

/** Ensure GOOGLE_APPLICATION_CREDENTIALS is set (supports inline JSON env). */
export function ensureGcpCredentials(): void {
  if (prepared) return;

  const inlineJson = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  if (inlineJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const dir = join(tmpdir(), "spanish-crosstalk");
    mkdirSync(dir, { recursive: true });
    const credPath = join(dir, "gcp-credentials.json");
    writeFileSync(credPath, inlineJson, { encoding: "utf8" });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not configured");
  }

  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID is not configured");
  }

  prepared = true;
}

export function getGcpProjectId(): string {
  ensureGcpCredentials();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID is not configured");
  }
  return projectId;
}
