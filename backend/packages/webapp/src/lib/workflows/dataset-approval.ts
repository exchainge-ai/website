/**
 * Dataset Auto-Approval Workflow
 * Automatically approves datasets based on verification score
 */

import { updateDataset, getDatasetById } from "@/lib/db/datasets";
import { logger } from "@/lib/server/logger";
import { trackLifecycle, LifecycleEvent } from "@/lib/monitoring/lifecycle";

interface ApprovalCriteria {
  minVerificationScore: number;
  requiresManualReview: boolean;
  autoPublishEnabled: boolean;
}

const DEFAULT_CRITERIA: ApprovalCriteria = {
  minVerificationScore: 85, // 85% or higher auto-approves
  requiresManualReview: false, // For MVP, disable manual review
  autoPublishEnabled: true, // Auto-publish for MVP
};

/**
 * Evaluates if a dataset should be auto-approved
 */
export async function evaluateDatasetApproval(
  datasetId: string,
  verificationScore: number,
  criteria: ApprovalCriteria = DEFAULT_CRITERIA
): Promise<{
  approved: boolean;
  status: "live" | "pending" | "rejected";
  reason: string;
}> {
  logger.info("[Auto-Approval] Evaluating dataset", {
    datasetId,
    verificationScore,
  });

  // For MVP: Auto-approve everything
  if (process.env.AUTO_APPROVE_ALL === "true") {
    logger.info("[Auto-Approval] AUTO_APPROVE_ALL enabled, approving", {
      datasetId,
    });
    return {
      approved: true,
      status: "live",
      reason: "Auto-approved (MVP mode)",
    };
  }

  // Check verification score
  if (verificationScore >= criteria.minVerificationScore) {
    logger.info("[Auto-Approval] Dataset meets threshold", {
      datasetId,
      verificationScore,
      threshold: criteria.minVerificationScore,
    });
    return {
      approved: true,
      status: "live",
      reason: `Verification score ${verificationScore} >= ${criteria.minVerificationScore}`,
    };
  }

  // Low verification score
  if (verificationScore < 50) {
    logger.warn("[Auto-Approval] Dataset rejected - low score", {
      datasetId,
      verificationScore,
    });
    return {
      approved: false,
      status: "rejected",
      reason: `Verification score ${verificationScore} too low`,
    };
  }

  // Medium score - needs manual review
  logger.info("[Auto-Approval] Dataset pending manual review", {
    datasetId,
    verificationScore,
  });
  return {
    approved: false,
    status: "pending",
    reason: `Verification score ${verificationScore} requires manual review`,
  };
}

/**
 * Process dataset approval and update status
 */
export async function processDatasetApproval(
  datasetId: string,
  verificationScore: number
): Promise<void> {
  try {
    // Get current dataset
    const dataset = await getDatasetById(datasetId, { skipCache: true });
    if (!dataset) {
      logger.error("[Auto-Approval] Dataset not found", { datasetId });
      return;
    }

    // Skip if already live
    if (dataset.status === "live") {
      logger.info("[Auto-Approval] Dataset already live, skipping", {
        datasetId,
      });
      return;
    }

    // Evaluate approval
    const result = await evaluateDatasetApproval(datasetId, verificationScore);

    // Update dataset status
    const updates: any = {
      status: result.status,
      status_reason: result.reason,
      verification_score: verificationScore,
      verification_status: verificationScore >= 85,
    };

    // Set published_at if approved
    if (result.approved) {
      updates.published_at = new Date().toISOString();
    }

    await updateDataset(datasetId, updates);

    // Track lifecycle event
    if (result.approved) {
      trackLifecycle(LifecycleEvent.DATASET_APPROVED, {
        datasetId,
        userId: dataset.user_id,
        verificationScore,
      });
      trackLifecycle(LifecycleEvent.DATASET_LIVE, {
        datasetId,
        userId: dataset.user_id,
      });
    } else if (result.status === "rejected") {
      trackLifecycle(LifecycleEvent.DATASET_REJECTED, {
        datasetId,
        userId: dataset.user_id,
        reason: result.reason,
      });
    } else {
      trackLifecycle(LifecycleEvent.DATASET_PENDING, {
        datasetId,
        userId: dataset.user_id,
      });
    }

    logger.success("[Auto-Approval] Dataset processed", {
      datasetId,
      status: result.status,
      reason: result.reason,
    });
  } catch (error) {
    logger.error("[Auto-Approval] Failed to process dataset", {
      datasetId,
      error,
    });
    throw error;
  }
}

/**
 * Batch approve multiple pending datasets
 * Useful for admin operations
 */
export async function batchApproveDatasets(
  datasetIds: string[]
): Promise<{
  approved: string[];
  failed: string[];
}> {
  const approved: string[] = [];
  const failed: string[] = [];

  for (const datasetId of datasetIds) {
    try {
      const dataset = await getDatasetById(datasetId, { skipCache: true });
      if (!dataset) {
        failed.push(datasetId);
        continue;
      }

      const verificationScore = dataset.verification_score || 85;
      await processDatasetApproval(datasetId, verificationScore);
      approved.push(datasetId);
    } catch (error) {
      logger.error("[Batch Approval] Failed", { datasetId, error });
      failed.push(datasetId);
    }
  }

  return { approved, failed };
}
