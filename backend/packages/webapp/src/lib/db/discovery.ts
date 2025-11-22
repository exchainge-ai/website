import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@exchainge/supabase/database";
import {
  cacheDeletePattern,
  cacheGet,
  cacheSet,
} from "./redis";
import { getSupabaseAdmin } from "./supabase";
import { logger } from "@/lib/server/logger";

type DiscoveryRow =
  Database["public"]["Tables"]["discovery_entries"]["Row"];
type DiscoveryInsert =
  Database["public"]["Tables"]["discovery_entries"]["Insert"];

const CACHE_KEYS = {
  list: (type?: "pinboard" | "request") =>
    `discovery:list:${type ?? "all"}`,
};

const CACHE_TTL_SECONDS = 60; // 1 minute

function sanitizeEntry(row: DiscoveryRow | null): DiscoveryRow | null {
  if (!row) {
    return null;
  }

  return {
    ...row,
    tags: row.tags ?? [],
    author_name: row.author_name ?? null,
    data_size: row.data_size ?? null,
    estimated_budget: row.estimated_budget ?? null,
    hardware_type: row.hardware_type ?? null,
  };
}

export async function listDiscoveryEntries(
  options?: {
    type?: "pinboard" | "request";
    limit?: number;
    client?: SupabaseClient<Database>;
  },
): Promise<DiscoveryRow[]> {
  const { type, limit = 50 } = options ?? {};
  const cacheKey = CACHE_KEYS.list(type);

  const cached = await cacheGet<DiscoveryRow[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = options?.client ?? getSupabaseAdmin();
  let query = supabase
    .from("discovery_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 100)));

  if (type) {
    query = query.eq("entry_type", type);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to fetch discovery entries", { error, type });
    return [];
  }

  const sanitized = (data ?? []).map((row) => sanitizeEntry(row)!);
  await cacheSet(cacheKey, sanitized, CACHE_TTL_SECONDS);
  return sanitized;
}

export async function createDiscoveryEntry(
  userId: string,
  payload: Omit<DiscoveryInsert, "user_id" | "interested_count">,
  options?: { client?: SupabaseClient<Database> },
): Promise<DiscoveryRow | null> {
  const supabase = options?.client ?? getSupabaseAdmin();

  const entry: DiscoveryInsert = {
    ...payload,
    user_id: userId,
    interested_count: 0,
    tags: payload.tags ?? [],
  };

  const { data, error } = await (supabase
    .from("discovery_entries") as any)
    .insert(entry)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to create discovery entry", {
      userId,
      error,
    });
    return null;
  }

  await cacheDeletePattern("discovery:list:*");
  return sanitizeEntry(data);
}

export async function incrementDiscoveryInterest(
  entryId: string,
  options?: { client?: SupabaseClient<Database> },
): Promise<DiscoveryRow | null> {
  const supabase = options?.client ?? getSupabaseAdmin();

  const { data, error } = await (supabase as any).rpc(
    "increment_discovery_interest",
    { entry_id: entryId },
  );

  if (error) {
    logger.error("Failed to increment discovery interest", { entryId, error });
    return null;
  }

  await cacheDeletePattern("discovery:list:*");
  return sanitizeEntry(data as DiscoveryRow);
}
