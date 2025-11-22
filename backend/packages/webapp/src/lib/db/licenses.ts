import type { Database } from "@exchainge/supabase/database";
import {
  cacheDelete,
  cacheDeletePattern,
  cacheGet,
  cacheSet,
} from "./redis";
import { getSupabaseAdmin } from "./supabase";
import { logger } from "../server/logger";

type LicenseRow = Database["public"]["Tables"]["licenses"]["Row"];
type LicenseInsert = Database["public"]["Tables"]["licenses"]["Insert"];
type LicenseUpdate = Database["public"]["Tables"]["licenses"]["Update"];

const LICENSE_CACHE_KEY = (licenseId: string) => `license:${licenseId}`;
const USER_LICENSES_CACHE_KEY = (userId: string) =>
  `user:${userId}:licenses`;
const DATASET_LICENSE_CACHE_KEY = (datasetId: string, userId: string) =>
  `dataset:${datasetId}:license:${userId}`;

const CACHE_TTL_SECONDS = 60 * 30; // 30 minutes

function sanitizeLicense(license: LicenseRow | null): LicenseRow | null {
  if (!license) {
    return null;
  }

  return {
    ...license,
    platform_fee_usdc: license.platform_fee_usdc ?? "0",
    seller_payout_usdc: license.seller_payout_usdc ?? "0",
    purchase_price_usdc: license.purchase_price_usdc ?? "0",
    access_count: license.access_count ?? 0,
  };
}

async function invalidateLicenseCaches(license: LicenseRow) {
  await Promise.allSettled([
    cacheDelete(LICENSE_CACHE_KEY(license.id)),
    cacheDelete(USER_LICENSES_CACHE_KEY(license.buyer_id)),
    cacheDelete(DATASET_LICENSE_CACHE_KEY(license.dataset_id, license.buyer_id)),
    cacheDeletePattern(`dataset:${license.dataset_id}:license:*`),
  ]);
}

export async function getLicenseById(
  licenseId: string,
  options?: { skipCache?: boolean },
): Promise<LicenseRow | null> {
  if (!options?.skipCache) {
    const cached = await cacheGet<LicenseRow>(LICENSE_CACHE_KEY(licenseId));
    if (cached) {
      return cached;
    }
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("id", licenseId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch license", { licenseId, error });
    return null;
  }

  const sanitized = sanitizeLicense(data);
  if (sanitized && !options?.skipCache) {
    await cacheSet(LICENSE_CACHE_KEY(licenseId), sanitized, CACHE_TTL_SECONDS);
  }

  return sanitized;
}

export async function getLicenseForUserDataset(
  datasetId: string,
  userId: string,
): Promise<LicenseRow | null> {
  const cacheKey = DATASET_LICENSE_CACHE_KEY(datasetId, userId);
  const cached = await cacheGet<LicenseRow>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("dataset_id", datasetId)
    .eq("buyer_id", userId)
    .eq("status", "active")
    .is("revoked_at", null)
    .order("purchase_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch active license for dataset/user", {
      datasetId,
      userId,
      error,
    });
    return null;
  }

  const sanitized = sanitizeLicense(data);
  if (sanitized) {
    await cacheSet(cacheKey, sanitized, CACHE_TTL_SECONDS);
  }

  return sanitized;
}

export async function listUserLicenses(userId: string): Promise<LicenseRow[]> {
  const cacheKey = USER_LICENSES_CACHE_KEY(userId);
  const cached = await cacheGet<LicenseRow[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("buyer_id", userId)
    .order("purchase_date", { ascending: false });

  if (error) {
    logger.error("Failed to list user licenses", { userId, error });
    return [];
  }

  const sanitized = (data ?? []).map((license) => sanitizeLicense(license)!);
  await cacheSet(cacheKey, sanitized, CACHE_TTL_SECONDS);
  return sanitized;
}

export interface CreateLicenseInput {
  datasetId: string;
  buyerId: string;
  sellerId: string;
  purchasePriceUsdc: string;
  platformFeeUsdc: string;
  sellerPayoutUsdc: string;
  usageRights: LicenseInsert["usage_rights"];
  licenseType: LicenseInsert["license_type"];
  expirationDate?: string | null;
  isTransferable?: boolean;
  downloadAllowed?: boolean;
}

export async function createLicense(
  input: CreateLicenseInput,
): Promise<LicenseRow | null> {
  const {
    datasetId,
    buyerId,
    sellerId,
    purchasePriceUsdc,
    platformFeeUsdc,
    sellerPayoutUsdc,
    usageRights,
    licenseType,
    expirationDate = null,
    isTransferable = false,
    downloadAllowed = true,
  } = input;

  // IDEMPOTENCY CHECK: Prevent duplicate license creation
  const existingLicense = await getLicenseForUserDataset(datasetId, buyerId);
  if (existingLicense) {
    logger.warn("License already exists for user/dataset", {
      datasetId,
      buyerId,
      existingLicenseId: existingLicense.id,
    });
    return existingLicense;
  }

  const insertPayload: LicenseInsert = {
    dataset_id: datasetId,
    buyer_id: buyerId,
    seller_id: sellerId,
    purchase_price_usdc: purchasePriceUsdc,
    platform_fee_usdc: platformFeeUsdc,
    seller_payout_usdc: sellerPayoutUsdc,
    usage_rights: usageRights,
    license_type: licenseType,
    status: "active",
    purchase_date: new Date().toISOString(),
    expiration_date: expirationDate,
    is_transferable: isTransferable,
    download_allowed: downloadAllowed,
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("licenses")
    // @ts-expect-error - Supabase client type inference issue
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to create license", {
      datasetId,
      buyerId,
      error,
    });
    return null;
  }

  const sanitized = sanitizeLicense(data);

  if (sanitized) {
    logger.success("License created successfully", {
      licenseId: sanitized.id,
      datasetId,
      buyerId,
      price: purchasePriceUsdc,
    });
    await invalidateLicenseCaches(sanitized);
  }

  return sanitized;
}

export async function updateLicense(
  licenseId: string,
  updates: LicenseUpdate,
): Promise<LicenseRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("licenses")
    // @ts-expect-error - Supabase client type inference issue
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", licenseId)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to update license", { licenseId, updates: Object.keys(updates), error });
    return null;
  }

  const sanitized = sanitizeLicense(data);
  if (sanitized) {
    await invalidateLicenseCaches(sanitized);
  }

  return sanitized;
}

export async function recordLicenseAccess(
  licenseId: string,
  datasetId: string,
  userId: string,
): Promise<void> {
  const license = await getLicenseById(licenseId, { skipCache: true });
  if (!license) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("licenses")
    // @ts-expect-error - Supabase client type inference issue
    .update({
      last_access_at: new Date().toISOString(),
      access_count: (license.access_count ?? 0) + 1,
    })
    .eq("id", licenseId);

  if (error) {
    logger.warn("Failed to record license access", { licenseId, datasetId, userId, error });
    return;
  }

  logger.info("License access recorded", {
    licenseId,
    datasetId,
    userId,
    accessCount: (license.access_count ?? 0) + 1,
  });

  await Promise.allSettled([
    cacheDelete(LICENSE_CACHE_KEY(licenseId)),
    cacheDelete(DATASET_LICENSE_CACHE_KEY(datasetId, userId)),
    cacheDelete(USER_LICENSES_CACHE_KEY(userId)),
  ]);
}
