/**
 * Dataset download endpoint with license verification.
 */

import { NextResponse } from "next/server";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { getDatasetById } from "@/lib/db/datasets";
import { getLicenseForUserDataset, recordLicenseAccess } from "@/lib/db/licenses";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { logger } from "@/lib/server/logger";
import { ForbiddenError, NotFoundError } from "@/lib/server/errors";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    enforceRateLimit(auth.privyId, { max: 60, windowMs: 60_000 });

    const params = await props.params;
    const datasetId = params.id;

    // Get dataset
    const dataset = await getDatasetById(datasetId);
    if (!dataset) {
      throw new NotFoundError("Dataset not found");
    }

    // Check if user owns the dataset
    const isOwner = dataset.user_id === auth.userId;

    if (!isOwner) {
      // Check if user has a valid license
      const license = await getLicenseForUserDataset(datasetId, auth.userId);

      if (!license) {
        logger.warn("Download attempted without license", {
          userId: auth.userId,
          datasetId,
        });
        throw new ForbiddenError("You must purchase this dataset to download it");
      }

      if (license.status !== "active") {
        logger.warn("Download attempted with inactive license", {
          userId: auth.userId,
          datasetId,
          licenseStatus: license.status,
        });
        throw new ForbiddenError(`License is ${license.status}. Cannot download.`);
      }

      // Check if license has expired
      if (license.expiration_date) {
        const expirationDate = new Date(license.expiration_date);
        if (expirationDate < new Date()) {
          logger.warn("Download attempted with expired license", {
            userId: auth.userId,
            datasetId,
            expiredAt: license.expiration_date,
          });
          throw new ForbiddenError("License has expired");
        }
      }

      // Record license access
      await recordLicenseAccess(license.id, datasetId, auth.userId);
    }

    // Generate signed URL (valid for 1 hour)
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from("datasets")
      .createSignedUrl(dataset.storage_key, 3600);

    if (error || !data) {
      logger.error("Failed to generate signed URL", {
        datasetId,
        storageKey: dataset.storage_key,
        error,
      });
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      );
    }

    logger.info("Dataset download authorized", {
      userId: auth.userId,
      datasetId,
      isOwner,
    });

    return NextResponse.json({
      data: {
        downloadUrl: data.signedUrl,
        expiresIn: 3600, // 1 hour in seconds
        fileName: dataset.title,
      },
    });
  } catch (error) {
    return handleHttpError(error);
  }
}
