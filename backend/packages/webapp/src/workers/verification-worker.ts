#!/usr/bin/env bun

/**
 * Verification Worker
 * Processes dataset verification jobs from Redis queue
 *
 * Usage:
 *   bun run src/workers/verification-worker.ts
 *
 * Environment variables:
 *   REDIS_URL - Redis connection URL
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_KEY - Supabase service key
 *   WORKER_CONCURRENCY - Number of concurrent jobs (default: 1)
 */

import { VerificationEngine } from '@exchainge/verifier';
import type { DatasetMetadata } from '@exchainge/verifier';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

const QUEUE_NAME = 'verification:queue';
const PROCESSING_TIMEOUT = 30000; // 30 seconds
const POLL_INTERVAL = 1000; // 1 second

class VerificationWorker {
  private redis: Redis;
  private supabase: ReturnType<typeof createClient>;
  private verifier: VerificationEngine;
  private isRunning = false;
  private concurrency: number;

  constructor() {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is required');
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    }

    this.redis = new Redis(process.env.REDIS_URL);
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.verifier = new VerificationEngine({
      strictMode: false,
      parallelProcessing: true,
      minConfidenceThreshold: 0.7,
    });
    this.concurrency = parseInt(process.env.WORKER_CONCURRENCY || '1', 10);

    console.log('[Worker] Initialized with concurrency:', this.concurrency);
  }

  async start() {
    this.isRunning = true;
    console.log('[Worker] Starting verification worker');
    console.log('[Worker] Listening on queue:', QUEUE_NAME);

    while (this.isRunning) {
      try {
        const job = await this.redis.lpop(QUEUE_NAME);

        if (job) {
          await this.processJob(JSON.parse(job));
        } else {
          // No jobs, wait before polling again
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        }
      } catch (error) {
        console.error('[Worker] Error in main loop:', error);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    }
  }

  async stop() {
    console.log('[Worker] Stopping...');
    this.isRunning = false;
    await this.redis.quit();
  }

  private async processJob(job: { datasetId: string; storageUrl: string; queuedAt: number }) {
    const startTime = Date.now();
    const queueTime = startTime - job.queuedAt;

    console.log('[Job] Processing:', {
      datasetId: job.datasetId,
      queueTimeMs: queueTime,
    });

    try {
      // Fetch dataset metadata from database
      const { data: dataset, error: dbError } = await this.supabase
        .from('datasets')
        .select('*')
        .eq('id', job.datasetId)
        .single();

      if (dbError || !dataset) {
        throw new Error(`Dataset not found: ${job.datasetId}`);
      }

      // Fetch dataset file from storage
      const { data: fileData, error: storageError } = await this.supabase
        .storage
        .from('datasets')
        .download(dataset.storage_key);

      if (storageError || !fileData) {
        throw new Error(`Failed to download dataset: ${storageError?.message}`);
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());

      // Prepare metadata for verifier
      const metadata: DatasetMetadata = {
        id: dataset.id,
        title: dataset.title,
        category: dataset.category,
        declaredSource: {
          robotModel: dataset.robot_model,
          sensorTypes: dataset.sensor_types || ['camera'],
        },
        fileSize: buffer.length,
        fileFormat: dataset.file_format,
        uploadedAt: new Date(dataset.created_at),
        userId: dataset.owner_id,
      };

      // Run verification
      const report = await this.verifier.verify(metadata, buffer);

      // Save verification report
      await this.supabase.from('verification_reports').insert({
        dataset_id: dataset.id,
        verdict: report.verdict,
        confidence: report.overallConfidence,
        quality_score: report.qualityScore,
        metadata_score: report.metadataScore,
        source_match_score: report.sourceMatchScore,
        anomalies: report.anomaliesDetected,
        full_report: report,
        processing_time_ms: report.processingTimeMs,
      });

      // Update dataset status
      const newStatus = report.verdict === 'authentic' && report.overallConfidence >= 0.85
        ? 'verified'
        : 'pending_review';

      await this.supabase.from('datasets').update({
        status: newStatus,
        verification_score: report.qualityScore,
        verified_at: new Date().toISOString(),
      }).eq('id', dataset.id);

      const totalTime = Date.now() - startTime;
      console.log('[Job] Completed:', {
        datasetId: job.datasetId,
        verdict: report.verdict,
        confidence: report.overallConfidence,
        totalTimeMs: totalTime,
      });

    } catch (error) {
      console.error('[Job] Failed:', {
        datasetId: job.datasetId,
        error: error instanceof Error ? error.message : error,
      });

      // Update dataset with error status
      await this.supabase.from('datasets').update({
        status: 'verification_failed',
        verification_error: error instanceof Error ? error.message : 'Unknown error',
      }).eq('id', job.datasetId);
    }
  }
}

// Main execution
const worker = new VerificationWorker();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Main] Received SIGTERM');
  await worker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Main] Received SIGINT');
  await worker.stop();
  process.exit(0);
});

// Start worker
worker.start().catch((error) => {
  console.error('[Main] Fatal error:', error);
  process.exit(1);
});
