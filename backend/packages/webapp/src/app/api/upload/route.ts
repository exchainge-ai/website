/**
 * File upload handling with chunking support.
 */

import { NextResponse } from "next/server";
import { requireAuth, handleHttpError } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { isValidFileType, getAllowedFileTypesMessage, UPLOAD_LIMITS } from "@/lib/constants/storage";
import { logger } from "@/lib/server/logger";
import { uploadToR2, generateFileKey, generateFileHash } from "@/lib/services/r2";
import { queueVerification } from "@/lib/queue/verification-jobs";
import crypto from 'crypto';

const MAX_FILE_SIZE = UPLOAD_LIMITS.MAX_FILE_SIZE;

/**
 * Generate AI analysis summary from verification report
 */
function generateAIAnalysis(report: any, filename: string, fileType: string): string {
  if (!report) {
    return `File "${filename}" uploaded successfully. Ready for verification.`;
  }

  const parts: string[] = [];

  // Verdict summary
  if (report.verdict === 'authentic' || report.verdict === 'likely_authentic') {
    parts.push(`✓ Verified as ${report.verdict === 'authentic' ? 'authentic' : 'likely authentic'} dataset.`);
  } else if (report.verdict === 'suspicious') {
    parts.push(`⚠ Dataset flagged as suspicious. Manual review recommended.`);
  } else {
    parts.push(`✗ Dataset appears synthetic or tampered.`);
  }

  // Confidence and quality
  const confidencePercent = Math.round(report.overallConfidence * 100);
  const qualityScore = Math.round(report.qualityScore);
  parts.push(`Confidence: ${confidencePercent}% | Quality Score: ${qualityScore}/10`);

  // Sensor detection
  if (report.sensorFingerprint) {
    parts.push(`Sensor fingerprint detected: ${report.sensorFingerprint.substring(0, 8)}...`);
  }

  // Anomalies
  if (report.anomaliesDetected && report.anomaliesDetected.length > 0) {
    const criticalCount = report.anomaliesDetected.filter((a: any) => a.severity === 'critical').length;
    const highCount = report.anomaliesDetected.filter((a: any) => a.severity === 'high').length;

    if (criticalCount > 0) {
      parts.push(`⚠ ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} found.`);
    }
    if (highCount > 0) {
      parts.push(`${highCount} high-severity issue${highCount > 1 ? 's' : ''} detected.`);
    }
  }

  // Module highlights
  const goodModules = report.moduleResults?.filter((m: any) => m.score >= 8).length || 0;
  if (goodModules > 0) {
    parts.push(`${goodModules} verification module${goodModules > 1 ? 's' : ''} passed with high scores.`);
  }

  return parts.join(' ');
}

/**
 * Detect dataset type from filename and content
 */
function detectDatasetType(filename: string, fileType: string): string {
  const lower = filename.toLowerCase();

  if (lower.includes('camera') || lower.includes('image') || fileType.startsWith('image/')) {
    return 'camera';
  }
  if (lower.includes('lidar') || lower.includes('pointcloud') || lower.includes('pcd')) {
    return 'lidar';
  }
  if (lower.includes('imu') || lower.includes('gyro') || lower.includes('accel')) {
    return 'imu';
  }
  if (lower.includes('gps') || lower.includes('gnss') || lower.includes('location')) {
    return 'gps';
  }
  if (lower.includes('radar')) {
    return 'radar';
  }
  if (lower.includes('depth') || lower.includes('rgbd')) {
    return 'depth';
  }
  if (lower.includes('thermal') || lower.includes('infrared')) {
    return 'thermal';
  }

  return 'sensor-data';
}

/**
 * Generate suggested tags based on filename and verification
 */
function generateSuggestedTags(filename: string, report: any): string[] {
  const tags: string[] = [];
  const lower = filename.toLowerCase();

  // Add sensor type tags
  if (lower.includes('camera') || lower.includes('image')) tags.push('camera');
  if (lower.includes('lidar')) tags.push('lidar');
  if (lower.includes('imu')) tags.push('imu');
  if (lower.includes('gps')) tags.push('gps');
  if (lower.includes('radar')) tags.push('radar');

  // Add application tags
  if (lower.includes('robot') || lower.includes('manipulation')) tags.push('robotics');
  if (lower.includes('autonomous') || lower.includes('self-driving')) tags.push('autonomous-vehicles');
  if (lower.includes('drone') || lower.includes('uav')) tags.push('drone');
  if (lower.includes('warehouse')) tags.push('warehouse');
  if (lower.includes('navigation')) tags.push('navigation');

  // Add quality tags from verification
  if (report) {
    if (report.verdict === 'authentic') tags.push('verified');
    if (report.qualityScore >= 9) tags.push('high-quality');
    if (report.overallConfidence >= 0.9) tags.push('high-confidence');
  }

  return tags.slice(0, 8); // Limit to 8 tags
}


export async function POST(request: Request) {
  try {
    logger.info("[api/upload] POST request received");

    const auth = await requireAuth(request);
    logger.info("[api/upload] Auth successful", { userId: auth.userId });

    enforceRateLimit(auth.privyId, { max: 10, windowMs: 60_000 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const filename = formData.get("filename") as string | null;
    const folder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!filename) {
      return NextResponse.json({ error: "No filename provided" }, { status: 400 });
    }

    // Validate file type
    const category = folder === 'previews' ? 'previews' : 'datasets';
    if (!isValidFileType(file.type, filename, category)) {
      logger.warn("[api/upload] Invalid file type rejected", {
        userId: auth.userId,
        mimeType: file.type,
        filename,
      });
      return NextResponse.json(
        {
          error: `Invalid file type. ${getAllowedFileTypesMessage(category)}`,
        },
        { status: 400 }
      );
    }

    // Check file size before processing
    const maxSize = category === 'previews' ? UPLOAD_LIMITS.MAX_PREVIEW_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      logger.warn("[api/upload] File size exceeded", {
        userId: auth.userId,
        fileSize: file.size,
        maxSize,
      });
      return NextResponse.json(
        {
          error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate R2 file key
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = generateFileKey(auth.userId, sanitizedFilename);

    logger.info("[api/upload] Uploading to R2", {
      userId: auth.userId,
      fileKey,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
    });

    // Upload to R2
    const { key, url: publicUrl } = await uploadToR2(
      buffer,
      fileKey,
      file.type || "application/octet-stream"
    );

    // Generate file hash for blockchain proof
    const datasetHash = generateFileHash(buffer);

    logger.success("[api/upload] R2 upload successful", {
      userId: auth.userId,
      key,
      datasetHash: datasetHash.substring(0, 16) + '...',
    });

    // Queue AI verification to run asynchronously (non-blocking)
    let verificationJobId: string | null = null;
    let aiPreview = null;

    if (category === 'datasets') {
      // Generate unique job ID
      verificationJobId = crypto.randomUUID();

      // Queue verification job (runs in background)
      queueVerification(
        verificationJobId,
        auth.userId,
        key,
        sanitizedFilename,
        buffer.length,
        file.type || "application/octet-stream"
      );

      logger.info("[api/upload] Verification queued", {
        userId: auth.userId,
        jobId: verificationJobId,
        fileKey: key,
        sizeMB: (buffer.length / 1024 / 1024).toFixed(2),
      });

      // Generate immediate preview without waiting for verification
      aiPreview = {
        sample: file.type.startsWith('image/') ? publicUrl : null,
        analysis: `Dataset uploaded successfully (${(buffer.length / 1024 / 1024).toFixed(1)} MB). AI verification in progress...`,
        detectedType: detectDatasetType(sanitizedFilename, file.type),
        suggestedTags: generateSuggestedTags(sanitizedFilename, null),
      };
    }

    return NextResponse.json({
      data: {
        key,
        publicUrl,
        datasetHash,
        verificationJobId,
        aiPreview,
      },
    });
  } catch (error) {
    logger.error("[api/upload] Unexpected error", { error });
    return handleHttpError(error);
  }
}
