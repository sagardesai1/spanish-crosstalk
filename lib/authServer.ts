/**
 * Server-side auth helpers: verify Firebase ID tokens on API routes.
 */

import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebaseAdmin";

const USER_ID_RE = /^[a-zA-Z0-9_-]{8,80}$/;

export function isValidUserId(userId: unknown): userId is string {
  return typeof userId === "string" && USER_ID_RE.test(userId);
}

export type ResolvedUser = {
  userId: string;
  /** True when the request carried a verified Firebase ID token. */
  authenticated: boolean;
  token?: DecodedIdToken;
};

type ResolveOptions = {
  /**
   * When true, accept a client-supplied anonymous user id without a Firebase
   * ID token. Practice APIs keep this off — sign-in is required.
   */
  allowAnonymous?: boolean;
};

/**
 * Prefer a verified Bearer ID token. Optionally fall back to an anonymous
 * client user id when `allowAnonymous` is set (legacy/migrate paths only).
 */
export async function resolveRequestUser(
  request: Request,
  fallbackUserId?: string | null,
  options?: ResolveOptions,
): Promise<ResolvedUser | NextResponse> {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      return { userId: decoded.uid, authenticated: true, token: decoded };
    } catch (error) {
      console.error("verifyIdToken failed", error);
      return NextResponse.json({ error: "Invalid or expired auth token." }, { status: 401 });
    }
  }

  if (options?.allowAnonymous && isValidUserId(fallbackUserId)) {
    return { userId: fallbackUserId, authenticated: false };
  }

  return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
}
