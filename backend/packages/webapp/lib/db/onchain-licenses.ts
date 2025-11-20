/**
 * Database operations for onchain licenses
 *
 * Handles CRUD operations for licenses synced from the Sui blockchain.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "./supabase";

export interface OnchainLicense {
  id: string;
  license_id: string;
  transaction_hash: string;
  dataset_cid: string;
  licensee_address: string;
  license_type: string;
  issued_at: number;
  expires_at: number | null;
  is_revoked: boolean;
  revoked_at: number | null;
  revoked_by: string | null;
  dataset_owner_address: string;
  buyer_id: string | null;
  dataset_id: string | null;
  blockchain_network: string;
  sync_status: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Insert a new onchain license record
 */
export async function createOnchainLicense(
  data: {
    license_id: string;
    transaction_hash: string;
    dataset_cid: string;
    licensee_address: string;
    license_type: string;
    issued_at: number;
    expires_at?: number | null;
    dataset_owner_address: string;
    dataset_id?: string | null;
    buyer_id?: string | null;
  },
  options?: { client?: SupabaseClient }
): Promise<OnchainLicense | null> {
  const client = options?.client || getSupabaseAdmin();

  const { data: license, error } = await client
    .from("onchain_licenses")
    .insert({
      license_id: data.license_id,
      transaction_hash: data.transaction_hash,
      dataset_cid: data.dataset_cid,
      licensee_address: data.licensee_address,
      license_type: data.license_type,
      issued_at: data.issued_at,
      expires_at: data.expires_at || null,
      dataset_owner_address: data.dataset_owner_address,
      dataset_id: data.dataset_id || null,
      buyer_id: data.buyer_id || null,
      is_revoked: false,
      blockchain_network: process.env.NEXT_PUBLIC_SUI_NETWORK || "sui-testnet",
      sync_status: "synced",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create onchain license:", error);
    return null;
  }

  return license;
}

/**
 * Mark a license as revoked
 */
export async function revokeOnchainLicense(
  licenseId: string,
  revokedAt: number,
  revokedBy: string,
  options?: { client?: SupabaseClient }
): Promise<boolean> {
  const client = options?.client || getSupabaseAdmin();

  const { error } = await client
    .from("onchain_licenses")
    .update({
      is_revoked: true,
      revoked_at: revokedAt,
      revoked_by: revokedBy,
      sync_status: "synced",
    })
    .eq("license_id", licenseId);

  if (error) {
    console.error("Failed to revoke onchain license:", error);
    return false;
  }

  return true;
}

/**
 * Get onchain license by blockchain license ID
 */
export async function getOnchainLicenseByLicenseId(
  licenseId: string,
  options?: { client?: SupabaseClient }
): Promise<OnchainLicense | null> {
  const client = options?.client || getSupabaseAdmin();

  const { data, error } = await client
    .from("onchain_licenses")
    .select("*")
    .eq("license_id", licenseId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Check if user has valid license for a dataset
 * Validates: not revoked, not expired
 */
export async function hasValidLicense(
  datasetCid: string,
  licenseeAddress: string,
  options?: { client?: SupabaseClient }
): Promise<boolean> {
  const client = options?.client || getSupabaseAdmin();

  const currentTimeMs = Date.now();

  const { data, error } = await client
    .from("onchain_licenses")
    .select("id")
    .eq("dataset_cid", datasetCid)
    .eq("licensee_address", licenseeAddress)
    .eq("is_revoked", false)
    .or(`expires_at.is.null,expires_at.gt.${currentTimeMs}`)
    .limit(1);

  if (error) {
    console.error("Error checking license validity:", error);
    return false;
  }

  return data.length > 0;
}

/**
 * Get all licenses for a dataset
 */
export async function getLicensesByDatasetCid(
  datasetCid: string,
  options?: { client?: SupabaseClient }
): Promise<OnchainLicense[]> {
  const client = options?.client || getSupabaseAdmin();

  const { data, error } = await client
    .from("onchain_licenses")
    .select("*")
    .eq("dataset_cid", datasetCid)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("Error fetching licenses:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all licenses owned by an address
 */
export async function getLicensesByLicensee(
  licenseeAddress: string,
  options?: { client?: SupabaseClient }
): Promise<OnchainLicense[]> {
  const client = options?.client || getSupabaseAdmin();

  const { data, error } = await client
    .from("onchain_licenses")
    .select("*")
    .eq("licensee_address", licenseeAddress)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("Error fetching user licenses:", error);
    return [];
  }

  return data || [];
}

/**
 * Get active (valid) licenses for a licensee
 */
export async function getActiveLicensesByLicensee(
  licenseeAddress: string,
  options?: { client?: SupabaseClient }
): Promise<OnchainLicense[]> {
  const client = options?.client || getSupabaseAdmin();

  const currentTimeMs = Date.now();

  const { data, error } = await client
    .from("onchain_licenses")
    .select("*")
    .eq("licensee_address", licenseeAddress)
    .eq("is_revoked", false)
    .or(`expires_at.is.null,expires_at.gt.${currentTimeMs}`)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("Error fetching active licenses:", error);
    return [];
  }

  return data || [];
}
