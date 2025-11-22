/**
 * Supabase client implementation.
 * 
 * TODOs before release:
 * 1. Add error handling for failed queries
 * 2. Set up basic connection error recovery
 * 3. Add request timeout handling
 * 4. Implement basic error logging
 * 5. Add environment validation
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@exchainge/supabase/database";
import { logger } from "@/lib/server/logger";

let cachedSupabaseAdmin: SupabaseClient<Database> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function resolveSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function resolveSupabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

function resolveSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function hasSupabaseConfiguration(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/**
 * Lazily creates (and memoizes) a Supabase client with service-role credentials.
 * Must only be invoked in server-side contexts.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin must not be used in the browser.");
  }

  if (!cachedSupabaseAdmin) {
    const url = resolveSupabaseUrl();
    const serviceRole = resolveSupabaseServiceRoleKey();

    logger.info("Initializing Supabase admin client", {
      url: url.replace(/https?:\/\/([^.]+)\..*/, "https://$1.***"),
      hasServiceRole: !!serviceRole,
    });

    cachedSupabaseAdmin = createSupabaseClient<Database>(url, serviceRole, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: "public",
      },
    });

    logger.success("Supabase admin client initialized");
  }

  return cachedSupabaseAdmin;
}

/**
 * Creates a Supabase client for server-side requests authenticated with a Privy user.
 * The Privy user ID is forwarded via the custom header expected by the RLS helpers.
 */
export function createServerSupabaseClient(options?: {
  privyUserId?: string;
  accessToken?: string;
}) {
  const { privyUserId, accessToken } = options || {};

  const headers: Record<string, string> = {};
  if (privyUserId) {
    headers["request.jwt.claims.sub"] = privyUserId;
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return createSupabaseClient<Database>(
    resolveSupabaseUrl(),
    resolveSupabaseAnonKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers,
      },
    },
  );
}

/**
 * Factory for browser-side usage (client components).
 * Relies on @supabase/ssr to maintain the user's session cookies automatically.
 */
export function createBrowserSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("createBrowserSupabaseClient must only be called in the browser");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error("[Supabase] NEXT_PUBLIC_SUPABASE_URL is missing");
    console.error("[Supabase] process.env:", Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')));
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined. Check your .env.local file and restart the dev server.");
  }

  if (!supabaseAnonKey) {
    console.error("[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Check your .env.local file and restart the dev server.");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
