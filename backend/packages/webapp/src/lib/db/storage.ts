/**
 * Storage utilities for managing dataset files in Supabase Storage.
 */

import { getSupabaseAdmin } from "./supabase";
import { logger } from "../server/logger";

const DEFAULT_BUCKET = "datasets";

function resolveBucketName(bucketName?: string): string {
  return (
    bucketName ||
    process.env.NEXT_PUBLIC_SUPABASE_DATASET_BUCKET ||
    DEFAULT_BUCKET
  );
}

export async function ensureBucketExists(
  bucketName: string = DEFAULT_BUCKET,
): Promise<void> {
  const resolvedBucket = resolveBucketName(bucketName);
  logger.info("Checking storage bucket", { bucket: resolvedBucket });

  const supabase = getSupabaseAdmin();
  const { data: buckets } = await supabase.storage.listBuckets();

  if (buckets?.some((bucket) => bucket.name === resolvedBucket)) {
    logger.success("Storage bucket exists", { bucket: resolvedBucket });
    return;
  }

  logger.info("Creating storage bucket", { bucket: resolvedBucket });
  const { error } = await supabase.storage.createBucket(resolvedBucket, {
    public: false,
    fileSizeLimit: "1000000000", // 1 GB
  });

  if (error && !error.message.includes("already exists")) {
    logger.error("Failed to create storage bucket", {
      bucket: resolvedBucket,
      error: error.message
    });
    throw error;
  }

  logger.success("Storage bucket ready", { bucket: resolvedBucket });
}

export function getBucketName(): string {
  return resolveBucketName();
}

/**
 * Deletes a file from storage.
 * @param storagePath - The path to the file in storage
 * @param bucketName - Optional bucket name (defaults to 'datasets')
 * @returns Promise<boolean> - True if deletion was successful
 */
export async function deleteFile(
  storagePath: string,
  bucketName?: string
): Promise<boolean> {
  try {
    const resolvedBucket = resolveBucketName(bucketName);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.storage
      .from(resolvedBucket)
      .remove([storagePath]);

    if (error) {
      logger.error("Failed to delete file from storage", {
        storagePath,
        bucket: resolvedBucket,
        error,
      });
      return false;
    }

    logger.info("File deleted from storage", {
      storagePath,
      bucket: resolvedBucket,
    });
    return true;
  } catch (error) {
    logger.error("Unexpected error deleting file", { storagePath, error });
    return false;
  }
}

/**
 * Deletes multiple files from storage.
 * @param storagePaths - Array of paths to delete
 * @param bucketName - Optional bucket name (defaults to 'datasets')
 * @returns Promise<number> - Number of files successfully deleted
 */
export async function deleteFiles(
  storagePaths: string[],
  bucketName?: string
): Promise<number> {
  try {
    const resolvedBucket = resolveBucketName(bucketName);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.storage
      .from(resolvedBucket)
      .remove(storagePaths);

    if (error) {
      logger.error("Failed to delete files from storage", {
        paths: storagePaths,
        bucket: resolvedBucket,
        error,
      });
      return 0;
    }

    logger.info("Files deleted from storage", {
      count: storagePaths.length,
      bucket: resolvedBucket,
    });
    return storagePaths.length;
  } catch (error) {
    logger.error("Unexpected error deleting files", { count: storagePaths.length, error });
    return 0;
  }
}
