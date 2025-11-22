import type { AuthTokenClaims } from "@privy-io/server-auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@exchainge/supabase/database";
import { privyServer } from "@/lib/privy-server";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/db/supabase";
import { getUserByPrivyId } from "@/lib/db/users";
import { ForbiddenError, HttpError, UnauthorizedError } from "./errors";
import { logger } from "./logger";

export interface AuthenticatedRequestContext {
  token: string;
  claims: AuthTokenClaims;
  privyId: string;
  supabase: SupabaseClient<Database>;
  userId: string;
  isAdmin: boolean;
}

function extractPrivyId(claims: AuthTokenClaims): string | null {
  const possible = [
    (claims as unknown as { privyId?: string }).privyId,
    (claims as unknown as { userId?: string }).userId,
    (claims as unknown as { user_id?: string }).user_id,
    (claims as unknown as { sub?: string }).sub,
  ];

  return possible.find((value) => typeof value === "string" && value.length > 0) ?? null;
}

export async function requireAuth(request: Request): Promise<AuthenticatedRequestContext> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  if (!header || !header.startsWith("Bearer ")) {
    logger.auth.authFailed("Missing or invalid Authorization header", ip);
    throw new UnauthorizedError();
  }

  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    logger.auth.authFailed("Empty token", ip);
    throw new UnauthorizedError();
  }

  let claims: AuthTokenClaims;
  try {
    claims = await privyServer.verifyAuthToken(token);
  } catch (error) {
    logger.auth.authFailed("Invalid Privy token", ip);
    throw new UnauthorizedError();
  }

  const privyId = extractPrivyId(claims);
  if (!privyId) {
    logger.auth.authFailed("Invalid auth token structure", ip);
    throw new UnauthorizedError("Invalid auth token");
  }

  const userRecord = await getUserByPrivyId(privyId, { skipCache: true });
  if (!userRecord) {
    logger.auth.authFailed("User not registered", ip);
    throw new ForbiddenError("User not registered");
  }

  const supabase = createServerSupabaseClient({ privyUserId: privyId });

  const url = new URL(request.url);
  logger.info(`Authenticated request: ${request.method} ${url.pathname}`, {
    userId: userRecord.id,
    isAdmin: Boolean(userRecord.is_admin),
    ip,
  });

  return {
    token,
    claims,
    privyId,
    supabase,
    userId: userRecord.id,
    isAdmin: Boolean(userRecord.is_admin),
  };
}

export function handleHttpError(error: unknown): Response {
  if (error instanceof HttpError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  logger.error("Unexpected API error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  return new Response(JSON.stringify({ error: "Internal Server Error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
