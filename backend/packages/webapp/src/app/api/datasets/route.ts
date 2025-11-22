import { NextResponse } from "next/server";
import { z } from "zod";
import { createDataset, getLiveDatasets, getDatasetById } from "@/lib/db/datasets";
import { hasSupabaseConfiguration, getSupabaseAdmin } from "@/lib/db/supabase";
import { getBucketName } from "@/lib/db/storage";
import {
  datasetRowToDTO,
  formatBytes,
  formatPriceUsd,
} from "@/lib/mappers/dataset";
import { generateFileKey, getPresignedUploadUrl } from "@/lib/services/r2";
import type { DatasetCategory, DatasetStatus } from "@/lib/types/dataset";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { ForbiddenError } from "@/lib/server/errors";
import { sanitizeDatasetInput } from "@/lib/server/sanitize";
import {
  enforceCleanContent,
  ContentModerationError,
} from "@/lib/server/moderation";
import { logger } from "@/lib/server/logger";
import { LifecycleTracker, LifecycleEvent } from "@/lib/monitoring/lifecycle";
import { processDatasetApproval } from "@/lib/workflows/dataset-approval";
import { runStartupChecks } from "@/lib/server/startup";
import { metrics } from "@/lib/monitoring/metrics";
import { createUploadSession } from "@/lib/db/upload-sessions";

let hasRunStartup = false;

/**
 * TODOs before release:
 * 1. Add proper error handling and logging
 * 2. Implement file size limits per user tier
 * 3. Add basic request validation
 * 4. Set up monitoring for API endpoints
 * 5. Add proper CORS configuration
 */

const VALID_CATEGORIES: DatasetCategory[] = [
  "robotics",
  "autonomous_vehicles",
  "drone",
  "manipulation",
  "navigation",
  "sensor_data",
  "human_robot_interaction",
  "embodied_ai",
  "motion_capture",
  "other",
];

const CATEGORY_SET = new Set<string>(VALID_CATEGORIES);
const createDatasetSchema = z.object({
  userId: z.string().min(1).optional(), // Optional - server uses authenticated user
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  category: z.string().min(1, "category is required"),
  priceUsd: z.union([z.string(), z.number()]),
  fileFormat: z.string().min(1, "fileFormat is required"),
  sizeBytes: z.number().int().nonnegative(),
  sizeFormatted: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  thumbnailUrl: z.string().url().optional().nullable(),
  previewFiles: z.any().optional(), // TODO: Add proper type validation for preview files
  licenseType: z.string().optional(),
  status: z.string().optional(),
  autoPublish: z.boolean().optional(),
  verificationScore: z.number().int().min(0).max(100).optional(),
  isMarketplaceOnly: z.boolean().optional(),
  storageKey: z.string().optional(),
  storageBucket: z.string().optional(),
  storageProvider: z.string().optional(),
  originalFilename: z.string().optional(),
  contentType: z.string().optional(),
  backgroundUpload: z.boolean().optional(),
  royaltyBps: z.number().int().min(0).max(5000).optional(),
  licenseDurationDays: z.number().int().min(1).max(3650).optional(),
  maxOwners: z.number().int().min(1).max(10000).optional(),
  commercialUse: z.boolean().optional(),
  derivativeWorksAllowed: z.boolean().optional(),
  redistributionAllowed: z.boolean().optional(),
  attributionRequired: z.boolean().optional(),
  aiTrainingAllowed: z.boolean().optional(),
  geographicRestrictions: z.boolean().optional(),
  geographicRegions: z.array(z.string()).optional(), // TODO: Add validation for region codes
  hardwareVerified: z.boolean().optional(),
  sp1Commitment: z.string().optional().nullable(),
  sp1ProofHash: z.string().optional().nullable(),
  statusReason: z.string().optional().nullable(),
  // New licensing fields
  canCommercialUse: z.boolean().optional(),
  canResale: z.boolean().optional(),
  // Semantic attestations
  attestations: z.array(z.string()).optional(),
  semanticTags: z.record(z.string(), z.string()).optional(),
});

// TODO: Move storage config to environment variables
const DEFAULT_STORAGE_PROVIDER = "s3";

function normalizeCategory(rawCategory: string): DatasetCategory {
  const lowered = rawCategory.trim().toLowerCase().replace(/\s+/g, "_");
  if (CATEGORY_SET.has(lowered)) {
    return lowered as DatasetCategory;
  }
  return "other";
}

// TODO: Add status transition validation (e.g., can't go from rejected to live directly)
function normalizeStatus(
  rawStatus: string | undefined,
  autoPublish: boolean | undefined,
): DatasetStatus {
  const lowered = rawStatus?.trim().toLowerCase();
  if (lowered && ["live", "draft", "pending", "rejected", "archived"].includes(lowered)) {
    return lowered as DatasetStatus;
  }

  return autoPublish ? "live" : "pending";
}

export async function GET(request: Request) {
  // Run startup checks on first API call
  if (!hasRunStartup) {
    await runStartupChecks();
    hasRunStartup = true;
  }

  const endRequest = metrics.requestStart();
  const startTime = Date.now();
  try {
    logger.info("GET datasets request received");

    if (!hasSupabaseConfiguration()) {
      logger.error("Supabase not configured");
      return NextResponse.json(
        { error: "Supabase is not configured for this environment." },
        { status: 503 },
      );
    }

    const url = new URL(request.url);
    const categoryParam = url.searchParams.get("category");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    // TODO: Add cursor-based pagination for better performance
    // TODO: Add sorting options (newest, popular, price)
    // TODO: Add filtering by verification status
    const limit = limitParam ? Number(limitParam) : 50;
    const offset = offsetParam ? Number(offsetParam) : 0;

    const category =
      categoryParam && CATEGORY_SET.has(categoryParam)
        ? (categoryParam as DatasetCategory)
        : undefined;

    logger.info("Fetching live datasets", { category, limit, offset });

    // TODO: Add Redis caching for frequently accessed datasets
    // TODO: Add proper indexes for category and status filters
    const datasets = await getLiveDatasets({
      category,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50,
      offset: Number.isFinite(offset) ? Math.max(offset, 0) : 0,
    });

    const data = datasets.map(datasetRowToDTO);
    const duration = Date.now() - startTime;
    logger.success("Datasets fetched successfully", {
      count: data.length,
      duration: `${duration}ms`
    });
    endRequest();
    return NextResponse.json({ data });
  } catch (error) {
    metrics.requestError(500);
    endRequest();
    logger.error("GET datasets failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    // TODO: Add error tracking (Sentry)
    return NextResponse.json(
      { error: "Failed to load datasets" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  // Run startup checks on first API call
  if (!hasRunStartup) {
    await runStartupChecks();
    hasRunStartup = true;
  }

  const endRequest = metrics.requestStart();
  const startTime = Date.now();
  try {
    logger.info("Dataset creation request received");

    if (!hasSupabaseConfiguration()) {
      logger.error("Supabase not configured");
      return NextResponse.json(
        { error: "Supabase is not configured for this environment." },
        { status: 503 },
      );
    }

    logger.info("Authenticating request");
    const auth = await requireAuth(request);
    logger.success("Authentication successful", { userId: auth.userId });

    // TODO: Add rate limits based on user tier
    logger.info("Checking rate limit", { privyId: auth.privyId.slice(0, 10) + "..." });
    enforceRateLimit(auth.privyId, { max: 30, windowMs: 60_000 });
    logger.success("Rate limit check passed");

    logger.info("Parsing request body");
    const json = await request.json();
    const parsed = createDatasetSchema.parse(json);
    logger.success("Request validation passed", {
      title: parsed.title,
      category: parsed.category,
      sizeBytes: parsed.sizeBytes,
      status: parsed.status,
      verificationScore: parsed.verificationScore
    });

    // Use authenticated user's ID if not provided in request
    const userId = parsed.userId || auth.userId;

    if (parsed.userId && parsed.userId !== auth.userId) {
      throw new ForbiddenError("Cannot create dataset for another user");
    }

    logger.info("Sanitizing input");
    const sanitized = sanitizeDatasetInput({
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
    });
    enforceCleanContent(sanitized);

    const category = normalizeCategory(parsed.category);
    const status = normalizeStatus(parsed.status, parsed.autoPublish);
    const sizeFormatted =
      parsed.sizeFormatted ?? formatBytes(parsed.sizeBytes);
    // TODO: Add proper decimal handling for prices
    const priceRaw = String(parsed.priceUsd ?? "").replace(/[^0-9.]/g, "");
    const priceUsdcDecimal = priceRaw.length > 0 ? priceRaw : "0";
    const verificationScore = parsed.verificationScore ?? null;
    const shouldPublish = status === "live";
    const bucket = parsed.storageBucket ?? getBucketName();
    const fallbackExtension =
      parsed.fileFormat && /^[a-zA-Z0-9]+$/.test(parsed.fileFormat)
        ? parsed.fileFormat.toLowerCase()
        : "bin";
    const fallbackBaseName = sanitized.title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dataset";
    const originalFilename =
      parsed.originalFilename ??
      `${fallbackBaseName}-${Date.now()}.${fallbackExtension}`;
    const contentType =
      parsed.contentType && parsed.contentType.trim().length > 0
        ? parsed.contentType
        : "application/octet-stream";
    const storageKey =
      parsed.storageKey ?? generateFileKey(userId, originalFilename);
    const isBackgroundUpload = parsed.backgroundUpload ?? !parsed.storageKey;
    const uploadStatus = isBackgroundUpload ? "pending" : "complete";
    const uploadProgress = uploadStatus === "complete" ? 100 : 0;

    logger.info("Creating dataset in database", {
      userId,
      category,
      status,
      priceUsd: priceRaw,
      bucket,
      uploadStatus,
    });

    // Use admin client to bypass RLS (we've already authenticated the user)
    const adminClient = getSupabaseAdmin();

    // TODO: Add transaction handling for dataset creation
    // TODO: Add webhook triggers for marketplace events
    // TODO: Add background job for dataset processing
    const dbStartTime = Date.now();
    const dataset = await createDataset(
      userId,
      {
        title: sanitized.title!,
        description: sanitized.description!,
        category,
        price_usdc: Number(priceUsdcDecimal),
        license_type: parsed.licenseType ?? "view_only",
        license_duration_days: parsed.licenseDurationDays ?? null,
        royalty_bps: parsed.royaltyBps ?? 0,
        max_owners: parsed.maxOwners ?? null,
        commercial_use: parsed.commercialUse ?? false,
        derivative_works_allowed: parsed.derivativeWorksAllowed ?? false,
        redistribution_allowed: parsed.redistributionAllowed ?? false,
        attribution_required:
          parsed.attributionRequired === undefined
            ? true
            : parsed.attributionRequired,
        ai_training_allowed:
          parsed.aiTrainingAllowed === undefined
            ? true
            : parsed.aiTrainingAllowed,
        geographic_restrictions: parsed.geographicRestrictions ?? false,
        geographic_regions: parsed.geographicRegions ?? null,
        file_format: parsed.fileFormat,
        size_bytes: parsed.sizeBytes,
        size_formatted: sizeFormatted,
        storage_provider: parsed.storageProvider ?? DEFAULT_STORAGE_PROVIDER,
        storage_bucket: bucket,
        storage_key: storageKey,
        thumbnail_url: parsed.thumbnailUrl ?? null,
        preview_files: parsed.previewFiles ?? null,
        verification_score: verificationScore,
        verification_status:
          verificationScore !== null ? verificationScore >= 85 : false,
        status,
        status_reason: parsed.statusReason ?? null,
        is_marketplace_only: parsed.isMarketplaceOnly ?? false,
        published_at: shouldPublish ? new Date().toISOString() : null,
        hardware_verified: parsed.hardwareVerified ?? false,
        sp1_commitment: parsed.sp1Commitment ?? null,
        sp1_proof_hash: parsed.sp1ProofHash ?? null,
        tags: sanitized.tags ?? [],
        upload_status: uploadStatus,
        upload_progress: uploadProgress,
        upload_started_at: uploadStatus === 'pending' ? new Date().toISOString() : null,
        // New licensing fields
        can_commercial_use: parsed.canCommercialUse ?? parsed.commercialUse ?? false,
        can_resale: parsed.canResale ?? false,
        // Semantic attestations
        attestations: parsed.attestations ?? [],
        semantic_tags: parsed.semanticTags ?? {},
        attestation_source: "user", // User-provided attestations
      },
      { client: adminClient },
    );
    const dbDuration = Date.now() - dbStartTime;

    logger.success("Dataset record created in database", {
      datasetId: dataset?.id,
      duration: `${dbDuration}ms`
    });

    if (!dataset) {
      logger.error("Failed to create dataset, no record returned");
      throw new ForbiddenError("Unable to create dataset");
    }

    let uploadSessionInfo:
      | {
          id: string;
          uploadUrl: string;
          key: string;
          publicUrl: string;
          expiresAt: string;
        }
      | null = null;

    if (uploadStatus === "pending") {
      const expiresInSeconds = 48 * 60 * 60; // 48 hours
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      try {
        const presigned = await getPresignedUploadUrl(
          storageKey,
          contentType,
          expiresInSeconds
        );

        const session = await createUploadSession(
          {
            dataset_id: dataset.id,
            user_id: userId,
            file_name: originalFilename,
            file_size: parsed.sizeBytes,
            upload_status: "pending",
            progress_percent: 0,
            r2_key: presigned.key,
            presigned_url_expires_at: expiresAt.toISOString(),
            metadata: {
              contentType,
              fileFormat: parsed.fileFormat,
              sizeBytes: parsed.sizeBytes,
            } as any,
          },
          { client: adminClient }
        );

        if (session) {
          uploadSessionInfo = {
            id: session.id,
            uploadUrl: presigned.uploadUrl,
            key: presigned.key,
            publicUrl: presigned.publicUrl,
            expiresAt: expiresAt.toISOString(),
          };
        }

        logger.info("Upload session initialized", {
          datasetId: dataset.id,
          sessionId: session?.id,
        });
      } catch (sessionError) {
        logger.error("Failed to initialize upload session", {
          datasetId: dataset.id,
          error:
            sessionError instanceof Error
              ? sessionError.message
              : String(sessionError),
        });
      }
    }

    // Track lifecycle events
    logger.info("Tracking lifecycle event: dataset created", { datasetId: dataset.id, status });
    const tracker = new LifecycleTracker(userId);
    tracker.datasetCreated(dataset.id, status);

    // Auto-approval workflow
    const scoreForApproval = parsed.verificationScore ?? 100; // Default to 100 for MVP
    logger.info("Starting auto-approval workflow", {
      datasetId: dataset.id,
      verificationScore: scoreForApproval
    });
    await processDatasetApproval(dataset.id, scoreForApproval);
    logger.success("Auto-approval workflow completed");

    // Fetch updated dataset after approval
    logger.info("Fetching updated dataset after approval", { datasetId: dataset.id });
    const updatedDataset = await getDatasetById(dataset.id, { skipCache: true });

    if (!updatedDataset) {
      logger.warn("Could not fetch updated dataset, using original", { datasetId: dataset.id });
    } else {
      logger.info("Dataset status after approval", {
        datasetId: dataset.id,
        status: updatedDataset.status,
        verificationStatus: updatedDataset.verification_status
      });
    }

    logger.dataset.created(dataset.id, userId, dataset.title);
    if (updatedDataset?.status === "live") {
      logger.dataset.published(dataset.id, userId);
      tracker.datasetLive(dataset.id);
    } else {
      logger.info("Dataset not live yet", {
        datasetId: dataset.id,
        currentStatus: updatedDataset?.status || status
      });
    }

    let datasetForResponse = updatedDataset || dataset;

    // AUTO-REGISTER ON BLOCKCHAIN (non-blocking)
    logger.info("Starting automatic blockchain registration", { datasetId: dataset.id });
    const blockchainStartTime = Date.now();
    try {
      const { registerDatasetWithBlockchain } = await import("@/lib/blockchain/register-dataset");
      const blockchainResult = await registerDatasetWithBlockchain(
        dataset.id,
        userId,
        storageKey,
        parsed.sizeBytes
      );

      const blockchainDuration = Date.now() - blockchainStartTime;

      if (blockchainResult.success) {
        logger.success("Blockchain registration completed", {
          datasetId: dataset.id,
          txSignature: blockchainResult.txSignature,
          duration: `${blockchainDuration}ms`
        });
        const refreshedDataset = await getDatasetById(dataset.id, {
          skipCache: true,
        });
        if (refreshedDataset) {
          datasetForResponse = refreshedDataset;
        }
      } else {
        logger.warn("Blockchain registration failed (non-critical)", {
          datasetId: dataset.id,
          error: blockchainResult.error,
          duration: `${blockchainDuration}ms`
        });
        try {
          const supabase = getSupabaseAdmin();
          await (supabase
            .from("datasets")
            .update as any)({
              status_reason: `blockchain_failed: ${(blockchainResult.error ?? "unknown").toString().slice(0, 200)}`,
            })
            .eq("id", dataset.id);
        } catch (statusError) {
          logger.error("Failed to persist blockchain failure reason", {
            datasetId: dataset.id,
            error: statusError instanceof Error ? statusError.message : String(statusError),
          });
        }
      }
    } catch (blockchainError) {
      const blockchainDuration = Date.now() - blockchainStartTime;
      logger.error("Blockchain registration error (non-critical)", {
        datasetId: dataset.id,
        error: blockchainError instanceof Error ? blockchainError.message : String(blockchainError),
        duration: `${blockchainDuration}ms`
      });
      // Don't fail the entire request if blockchain fails
    }

    const dto = datasetRowToDTO(datasetForResponse);
    const totalDuration = Date.now() - startTime;
    logger.success("Dataset creation completed", {
      datasetId: dataset.id,
      totalDuration: `${totalDuration}ms`,
      finalStatus: dto.status
    });
    const responsePayload: Record<string, unknown> = { data: dto };
    if (uploadSessionInfo) {
      responsePayload.uploadSession = uploadSessionInfo;
    }

    endRequest();
    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    if (error instanceof ContentModerationError) {
      metrics.requestError(400);
      endRequest();
      logger.warn("Dataset creation blocked by moderation", {
        field: error.field,
      });
      return NextResponse.json(
        {
          error: "Content failed moderation checks.",
          field: error.field,
        },
        { status: 400 },
      );
    }
    if (error instanceof z.ZodError) {
      metrics.requestError(400);
      endRequest();
      logger.error("Dataset validation failed", {
        errors: JSON.stringify(error.flatten())
      });
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 }
      );
    }
    metrics.requestError(500);
    endRequest();
    logger.error("Dataset creation failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return handleHttpError(error);
  }
}
