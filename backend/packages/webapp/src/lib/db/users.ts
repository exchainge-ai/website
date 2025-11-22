import type { Database } from "@exchainge/supabase/database";
import { cacheDelete, cacheGet, cacheSet } from "./redis";
import { getSupabaseAdmin } from "./supabase";
import { logger } from "../server/logger";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

const USER_CACHE_KEY = (userId: string) => `user:${userId}`;
const PRIVY_CACHE_KEY = (privyId: string) => `user:privy:${privyId}`;

function sanitizeUser(user: UserRow | null): UserRow | null {
  if (!user) {
    return null;
  }

  return {
    ...user,
    notification_preferences: user.notification_preferences ?? {
      email: true,
      platform: true,
    },
    privacy_settings: user.privacy_settings ?? {
      profile_public: true,
    },
    total_revenue: user.total_revenue ?? "0",
    total_sales: user.total_sales ?? 0,
    total_datasets: user.total_datasets ?? 0,
    reputation_score: user.reputation_score ?? 0,
  };
}

async function cacheUser(user: UserRow) {
  await Promise.allSettled([
    cacheSet(USER_CACHE_KEY(user.id), user, 60 * 60),
    cacheSet(PRIVY_CACHE_KEY(user.privy_id), user, 60 * 60),
  ]);
}

async function invalidateUserCache(user: UserRow) {
  await Promise.allSettled([
    cacheDelete(USER_CACHE_KEY(user.id)),
    cacheDelete(PRIVY_CACHE_KEY(user.privy_id)),
  ]);
}

export async function getUserById(
  userId: string,
  options?: { skipCache?: boolean },
): Promise<UserRow | null> {
  const cacheKey = USER_CACHE_KEY(userId);
  if (!options?.skipCache) {
    const cached = await cacheGet<UserRow>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch user by ID", { userId, error: error.message });
    return null;
  }

  const sanitized = sanitizeUser(data);
  if (sanitized && !options?.skipCache) {
    await cacheUser(sanitized);
  }

  return sanitized;
}

export async function getUserByPrivyId(
  privyId: string,
  options?: { skipCache?: boolean },
): Promise<UserRow | null> {
  const cacheKey = PRIVY_CACHE_KEY(privyId);
  if (!options?.skipCache) {
    const cached = await cacheGet<UserRow>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("privy_id", privyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch user by Privy ID", { privyId, error: error.message });
    return null;
  }

  const sanitized = sanitizeUser(data);
  if (sanitized && !options?.skipCache) {
    await cacheUser(sanitized);
  }

  return sanitized;
}

export async function upsertUser(
  payload: Omit<UserInsert, "id" | "created_at" | "updated_at"> & {
    id?: string;
    metadata?: Partial<UserUpdate>;
  },
): Promise<UserRow | null> {
  const { metadata, ...userPayload } = payload;

  const insertPayload: UserInsert = {
    ...userPayload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    // @ts-expect-error - Supabase client type inference issue
    .upsert(insertPayload, {
      onConflict: "privy_id",
    })
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to upsert user", {
      privyId: userPayload.privy_id,
      error: error.message
    });
    return null;
  }

  const sanitized = sanitizeUser(data);
  if (sanitized) {
    await invalidateUserCache(sanitized);
  }

  if (sanitized && metadata) {
    await updateUser(sanitized.id, metadata);
  }

  return sanitized;
}

export async function updateUser(
  userId: string,
  updates: UserUpdate,
): Promise<UserRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    // @ts-expect-error - Supabase client type inference issue
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to update user", {
      userId,
      fields: Object.keys(updates),
      error: error.message
    });
    return null;
  }

  const sanitized = sanitizeUser(data);
  if (sanitized) {
    await invalidateUserCache(sanitized);
    await cacheUser(sanitized);
  }

  return sanitized;
}
