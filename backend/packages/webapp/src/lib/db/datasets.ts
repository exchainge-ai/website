/**
 * Dataset management and caching implementation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@exchainge/supabase/database";
import { cacheDelete, cacheDeletePattern, cacheGet, cacheSet } from "./redis";
import { getSupabaseAdmin } from "./supabase";
import { logger } from "../server/logger";
import { deleteFile } from "./storage";

type DatasetRow = Database["public"]["Tables"]["datasets"]["Row"];
type DatasetInsert = Database["public"]["Tables"]["datasets"]["Insert"];
type DatasetUpdate = Database["public"]["Tables"]["datasets"]["Update"];
type DatasetMetricKey = "view_count" | "download_count" | "purchase_count";

const CACHE_KEYS = {
  dataset: (id: string) => `dataset:${id}`,
  userDatasets: (userId: string) => `user:${userId}:datasets`,
  liveDatasets: (category?: string, offset = 0, limit = 50) =>
    `datasets:live:${category ?? "all"}:${offset}:${limit}`,
};

const CACHE_TTL = {
  dataset: 60 * 60, // 1 hour
  datasetList: 60 * 5, // 5 minutes
};

function sanitizeDataset(dataset: DatasetRow | null): DatasetRow | null {
  if (!dataset) {
    return null;
  }

  return {
    ...dataset,
    tags: dataset.tags ?? [],
    total_revenue: dataset.total_revenue ?? "0",
    average_rating: dataset.average_rating ?? "0",
    view_count: dataset.view_count ?? 0,
    download_count: dataset.download_count ?? 0,
    purchase_count: dataset.purchase_count ?? 0,
    review_count: dataset.review_count ?? 0,
    upload_status: dataset.upload_status ?? "complete",
    upload_progress: dataset.upload_progress ?? 100,
    upload_started_at: dataset.upload_started_at ?? null,
    upload_completed_at: dataset.upload_completed_at ?? null,
  };
}

async function invalidateDatasetCaches(dataset: DatasetRow) {
  await Promise.allSettled([
    cacheDelete(CACHE_KEYS.dataset(dataset.id)),
    cacheDelete(CACHE_KEYS.userDatasets(dataset.user_id)),
    cacheDeletePattern("datasets:live:*"),
  ]);
}

export async function getDatasetById(
  datasetId: string,
  options?: { skipCache?: boolean; client?: SupabaseClient<Database> },
): Promise<DatasetRow | null> {
  const cacheKey = CACHE_KEYS.dataset(datasetId);

  if (!options?.skipCache) {
    const cached = await cacheGet<DatasetRow>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const supabase = options?.client ?? getSupabaseAdmin();
  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("id", datasetId)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch dataset by id", { datasetId, error });
    return null;
  }

  const sanitized = sanitizeDataset(data);

  if (sanitized && !options?.skipCache) {
    await cacheSet(cacheKey, sanitized, CACHE_TTL.dataset);
  }

  return sanitized;
}

export async function getLiveDatasets(options?: {
  category?: Database["public"]["Enums"]["dataset_category"];
  offset?: number;
  limit?: number;
}): Promise<DatasetRow[]> {
  const { category, offset = 0, limit = 50 } = options ?? {};
  const cacheKey = CACHE_KEYS.liveDatasets(category, offset, limit);

  const cached = await cacheGet<DatasetRow[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("datasets")
    .select("*")
    .eq("status", "live")
    .is("archived_at", null)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to fetch live datasets", { category, offset, limit, error });
    return [];
  }

  const sanitized = (data ?? []).map((dataset) => sanitizeDataset(dataset)!);
  await cacheSet(cacheKey, sanitized, CACHE_TTL.datasetList);
  return sanitized;
}

export async function getUserDatasets(
  userId: string,
  options?: { client?: SupabaseClient<Database>; skipCache?: boolean },
): Promise<DatasetRow[]> {
  const cacheKey = CACHE_KEYS.userDatasets(userId);

  if (!options?.client && !options?.skipCache) {
    const cached = await cacheGet<DatasetRow[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const supabase = options?.client ?? getSupabaseAdmin();
  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch user datasets", { userId, error });
    return [];
  }

  const sanitized = (data ?? []).map((dataset) => sanitizeDataset(dataset)!);

  if (!options?.client && !options?.skipCache) {
    await cacheSet(cacheKey, sanitized, CACHE_TTL.datasetList);
  }

  return sanitized;
}

export async function createDataset(
  userId: string,
  payload: Omit<DatasetInsert, "user_id">,
  options?: { client?: SupabaseClient<Database> },
): Promise<DatasetRow | null> {
  const insertData: DatasetInsert = {
    ...payload,
    user_id: userId,
  };

  const supabase = options?.client ?? getSupabaseAdmin();
  const { data, error } = await supabase
    .from("datasets")
    .insert(insertData as any) // Supabase type inference workaround
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to create dataset", { userId, title: payload.title, error });
    return null;
  }

  const sanitized = sanitizeDataset(data);
  if (sanitized) {
    await invalidateDatasetCaches(sanitized);
  }

  return sanitized;
}

export async function updateDataset(
  datasetId: string,
  changes: DatasetUpdate,
  options?: { client?: SupabaseClient<Database> },
): Promise<DatasetRow | null> {
  const supabase = options?.client ?? getSupabaseAdmin();
  // Note: Supabase client has strict type inference that doesn't accept Partial types
  // This is a known limitation - see: https://github.com/supabase/supabase-js/issues/
  const { data, error } = await supabase
    .from("datasets")
    // @ts-expect-error Supabase client doesn't accept Partial<Update> types
    .update({
      ...changes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", datasetId)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to update dataset", { datasetId, changes: Object.keys(changes), error });
    return null;
  }

  const sanitized = sanitizeDataset(data);
  if (sanitized) {
    await invalidateDatasetCaches(sanitized);
  }

  return sanitized;
}

export async function publishDataset(datasetId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("datasets")
    // @ts-expect-error - Supabase client type inference issue
    .update({
      status: "live",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_marketplace_only: false,
    })
    .eq("id", datasetId)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to publish dataset", { datasetId, error });
    return false;
  }

  const sanitized = sanitizeDataset(data);
  if (sanitized) {
    await invalidateDatasetCaches(sanitized);
  }

  return true;
}

export async function incrementDatasetMetric(
  datasetId: string,
  metric: DatasetMetricKey,
): Promise<void> {
  const dataset = await getDatasetById(datasetId, { skipCache: true });
  if (!dataset) {
    return;
  }

  const currentValue = (dataset[metric as DatasetMetricKey] ?? 0) as number;
  const nextValue = Math.max(currentValue + 1, 0);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("datasets")
    // @ts-expect-error - Supabase client type inference issue
    .update({
      [metric]: nextValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", datasetId)
    .select("id, user_id")
    .single();

  if (error) {
    logger.warn(`Failed to increment ${metric}`, { datasetId, metric, error });
    return;
  }

  if (data) {
    await Promise.allSettled([
      cacheDelete(CACHE_KEYS.dataset(datasetId)),
      cacheDeletePattern("datasets:live:*"),
      // @ts-expect-error - Supabase client type inference issue
      cacheDelete(CACHE_KEYS.userDatasets(data.user_id)),
    ]);
  }
}

export async function removeDataset(
  datasetId: string,
  options?: { client?: SupabaseClient<Database> },
): Promise<boolean> {
  // First, get the dataset to retrieve storage_key
  const dataset = await getDatasetById(datasetId, { skipCache: true, client: options?.client });
  if (!dataset) {
    logger.error("Dataset not found for removal", { datasetId });
    return false;
  }

  const supabase = options?.client ?? getSupabaseAdmin();
  const { data, error } = await supabase
    .from("datasets")
    // @ts-expect-error - Supabase client type inference issue
    .update({
      archived_at: new Date().toISOString(),
      status: "archived",
    })
    .eq("id", datasetId)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to archive dataset", { datasetId, error });
    return false;
  }

  const sanitized = sanitizeDataset(data);
  if (sanitized) {
    await invalidateDatasetCaches(sanitized);
  }

  // Delete file from storage asynchronously (don't block on it)
  if (dataset.storage_key) {
    deleteFile(dataset.storage_key).catch((err) => {
      logger.error("Failed to cleanup dataset file", {
        datasetId,
        storagePath: dataset.storage_key,
        error: err,
      });
    });
  }

  logger.info("Dataset archived successfully", { datasetId });
  return true;
}
