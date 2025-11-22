/**
 * Verifier service integration
 * Local verifier implementation for dataset validation
 */

import type { DatasetMetadata, VerificationReport } from '@/lib/verifier/types';
import { VerificationEngine } from '@/lib/verifier/VerificationEngine';

export class VerifierService {
  private static async getEngine() {
    return new VerificationEngine({
      strictMode: false,
      parallelProcessing: true,
      minConfidenceThreshold: 0.7,
      enableChallengeResponse: true,
      enableCrossModal: true,
      enableAuditChain: true,
      enableReputation: true,
    });
  }

  static async verify(
    metadata: DatasetMetadata,
    dataBuffer: Buffer
  ): Promise<VerificationReport> {
    const engine = await this.getEngine();
    return await engine.verify(metadata, dataBuffer);
  }

  /**
   * Run verification inline with minimal metadata (for upload flow)
   */
  static async verifyInline(
    uploadMetadata: {
      id: string;
      userId: string;
      filename: string;
      fileSize: number;
      fileType: string;
    },
    dataBuffer: Buffer
  ): Promise<VerificationReport> {
    // Detect sensor types from file metadata
    const sensorTypes = this.detectSensorTypes(uploadMetadata.filename, uploadMetadata.fileType);

    const metadata: DatasetMetadata = {
      id: uploadMetadata.id,
      title: uploadMetadata.filename,
      category: 'robotics', // Default, could be inferred from filename
      declaredSource: {
        sensorTypes,
      },
      fileSize: uploadMetadata.fileSize,
      fileFormat: uploadMetadata.fileType,
      uploadedAt: new Date(),
      userId: uploadMetadata.userId,
    };

    return await this.verify(metadata, dataBuffer);
  }

  /**
   * Detect sensor types from filename and file type
   */
  private static detectSensorTypes(filename: string, fileType: string): any[] {
    const lower = filename.toLowerCase();

    if (lower.includes('camera') || lower.includes('image') || fileType.startsWith('image/')) {
      return ['camera'];
    }
    if (lower.includes('lidar') || lower.includes('pointcloud')) {
      return ['lidar'];
    }
    if (lower.includes('imu') || lower.includes('gyro') || lower.includes('accel')) {
      return ['imu'];
    }
    if (lower.includes('gps') || lower.includes('gnss')) {
      return ['gps'];
    }

    // Default: assume camera
    return ['camera'];
  }

  static async queueVerification(datasetId: string, storageUrl: string): Promise<void> {
    // In production, push to Redis/Kafka queue
    // For now, trigger verification in background

    if (process.env.REDIS_URL) {
      await this.queueToRedis(datasetId, storageUrl);
    } else {
      // Fallback: verify immediately (not recommended for production)
      console.warn('REDIS_URL not set, running verification synchronously');
      await this.verifyFromStorage(datasetId, storageUrl);
    }
  }

  private static async queueToRedis(datasetId: string, storageUrl: string): Promise<void> {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL!);

    await redis.rpush('verification:queue', JSON.stringify({
      datasetId,
      storageUrl,
      queuedAt: Date.now(),
    }));

    await redis.quit();
  }

  private static async verifyFromStorage(datasetId: string, storageUrl: string): Promise<void> {
    // Fetch dataset from storage
    const response = await fetch(storageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Get metadata from database (simplified - you'll need actual DB query)
    const metadata: DatasetMetadata = {
      id: datasetId,
      title: 'Dataset ' + datasetId,
      category: 'robotics',
      declaredSource: {
        sensorTypes: ['camera'],
      },
      fileSize: buffer.length,
      fileFormat: 'unknown',
      uploadedAt: new Date(),
      userId: 'unknown',
    };

    // Run verification
    const report = await this.verify(metadata, buffer);

    // Save results (simplified - you'll need actual DB writes)
    console.log('Verification complete:', {
      datasetId,
      verdict: report.verdict,
      confidence: report.overallConfidence,
    });
  }
}
