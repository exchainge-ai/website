/**
 * Dataset Lifecycle Monitoring
 * Tracks the complete user journey from upload to sale
 */

import { logger } from "@/lib/server/logger";

export enum LifecycleEvent {
  // Upload flow
  UPLOAD_STARTED = "upload.started",
  UPLOAD_FILE_UPLOADED = "upload.file_uploaded",
  UPLOAD_PREVIEW_UPLOADED = "upload.preview_uploaded",
  UPLOAD_METADATA_SUBMITTED = "upload.metadata_submitted",
  UPLOAD_VERIFICATION_STARTED = "upload.verification_started",
  UPLOAD_VERIFICATION_COMPLETED = "upload.verification_completed",
  UPLOAD_COMPLETED = "upload.completed",

  // Dataset lifecycle
  DATASET_CREATED = "dataset.created",
  DATASET_PENDING = "dataset.pending",
  DATASET_APPROVED = "dataset.approved",
  DATASET_REJECTED = "dataset.rejected",
  DATASET_LIVE = "dataset.live",
  DATASET_ARCHIVED = "dataset.archived",

  // Marketplace activity
  DATASET_VIEWED = "dataset.viewed",
  DATASET_SEARCHED = "dataset.searched",
  DATASET_FILTERED = "dataset.filtered",

  // Purchase flow
  PURCHASE_INITIATED = "purchase.initiated",
  PURCHASE_LICENSE_CHECKED = "purchase.license_checked",
  PURCHASE_PAYMENT_STARTED = "purchase.payment_started",
  PURCHASE_PAYMENT_COMPLETED = "purchase.payment_completed",
  PURCHASE_LICENSE_CREATED = "purchase.license_created",
  PURCHASE_COMPLETED = "purchase.completed",
  PURCHASE_FAILED = "purchase.failed",

  // Download flow
  DOWNLOAD_INITIATED = "download.initiated",
  DOWNLOAD_AUTHORIZED = "download.authorized",
  DOWNLOAD_UNAUTHORIZED = "download.unauthorized",
  DOWNLOAD_STARTED = "download.started",
  DOWNLOAD_COMPLETED = "download.completed",
  DOWNLOAD_FAILED = "download.failed",

  // Seller earnings
  SELLER_EARNED = "seller.earned",
  SELLER_PAYOUT_INITIATED = "seller.payout_initiated",
  SELLER_PAYOUT_COMPLETED = "seller.payout_completed",
}

interface LifecycleMetadata {
  userId?: string;
  datasetId?: string;
  licenseId?: string;
  amount?: number;
  errorMessage?: string;
  [key: string]: any;
}

/**
 * Track a lifecycle event with structured logging
 */
export function trackLifecycle(
  event: LifecycleEvent,
  metadata: LifecycleMetadata
): void {
  const timestamp = new Date().toISOString();

  // Structured log for monitoring systems
  const logEntry = {
    timestamp,
    event,
    ...metadata,
    // Add tracing ID if available
    traceId: metadata.traceId || generateTraceId(),
  };

  // Log to console in development, send to monitoring in production
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to monitoring service (DataDog, Sentry, etc.)
    logger.info(`[LIFECYCLE] ${event}`, logEntry);
  } else {
    logger.info(`[LIFECYCLE] ${event}`, logEntry);
  }

  // Store in database for analytics (optional)
  // await storeAnalyticsEvent(logEntry);
}

/**
 * Generate a unique trace ID for request tracking
 */
function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create a lifecycle tracker for a specific user session
 */
export class LifecycleTracker {
  private traceId: string;
  private userId: string;

  constructor(userId: string, traceId?: string) {
    this.userId = userId;
    this.traceId = traceId || generateTraceId();
  }

  track(event: LifecycleEvent, metadata: LifecycleMetadata = {}): void {
    trackLifecycle(event, {
      ...metadata,
      userId: this.userId,
      traceId: this.traceId,
    });
  }

  // Upload flow helpers
  uploadStarted(datasetId: string): void {
    this.track(LifecycleEvent.UPLOAD_STARTED, { datasetId });
  }

  uploadCompleted(datasetId: string, status: string): void {
    this.track(LifecycleEvent.UPLOAD_COMPLETED, { datasetId, status });
  }

  // Dataset lifecycle helpers
  datasetCreated(datasetId: string, status: string): void {
    this.track(LifecycleEvent.DATASET_CREATED, { datasetId, status });
  }

  datasetApproved(datasetId: string): void {
    this.track(LifecycleEvent.DATASET_APPROVED, { datasetId });
  }

  datasetLive(datasetId: string): void {
    this.track(LifecycleEvent.DATASET_LIVE, { datasetId });
  }

  // Purchase flow helpers
  purchaseInitiated(datasetId: string, amount: number): void {
    this.track(LifecycleEvent.PURCHASE_INITIATED, { datasetId, amount });
  }

  purchaseCompleted(datasetId: string, licenseId: string, amount: number): void {
    this.track(LifecycleEvent.PURCHASE_COMPLETED, {
      datasetId,
      licenseId,
      amount,
    });
  }

  purchaseFailed(datasetId: string, errorMessage: string): void {
    this.track(LifecycleEvent.PURCHASE_FAILED, { datasetId, errorMessage });
  }

  // Download flow helpers
  downloadAuthorized(datasetId: string, licenseId?: string): void {
    this.track(LifecycleEvent.DOWNLOAD_AUTHORIZED, { datasetId, licenseId });
  }

  downloadUnauthorized(datasetId: string, errorMessage: string): void {
    this.track(LifecycleEvent.DOWNLOAD_UNAUTHORIZED, {
      datasetId,
      errorMessage,
    });
  }
}

/**
 * Example usage:
 *
 * const tracker = new LifecycleTracker(userId);
 * tracker.uploadStarted(datasetId);
 * tracker.datasetCreated(datasetId, "pending");
 * tracker.purchaseCompleted(datasetId, licenseId, 99.99);
 */
