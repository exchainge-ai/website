/**
 * Cross-Modal Consistency Checker
 *
 * Validates that multiple sensor modalities align correctly in time and space.
 * Uses embedding models to check semantic consistency across modalities.
 * Real multi-sensor data has tight coupling; synthetic data often breaks down here.
 */

import { createHash } from 'crypto';
import type { SensorType, ModuleResult, VerificationAnomaly, CrossModalAlignment } from '../types';

interface SensorStream {
  type: SensorType;
  data: Buffer;
  timestamps: number[];
  metadata?: Record<string, unknown>;
}

interface EmbeddingVector {
  vector: number[];
  timestamp: number;
  sensorType: SensorType;
}

export class CrossModalChecker {
  private embeddingCache: Map<string, EmbeddingVector[]> = new Map();

  constructor() {}

  async check(
    sensorStreams: SensorStream[],
    metadata: Record<string, unknown>
  ): Promise<ModuleResult> {
    const startTime = Date.now();
    const inputHash = createHash('sha256')
      .update(JSON.stringify(sensorStreams.map(s => ({ type: s.type, size: s.data.length }))))
      .digest('hex');

    const anomalies: VerificationAnomaly[] = [];
    const alignments: CrossModalAlignment[] = [];

    // Check all pairwise modality combinations
    for (let i = 0; i < sensorStreams.length; i++) {
      for (let j = i + 1; j < sensorStreams.length; j++) {
        const alignment = await this.checkPairAlignment(
          sensorStreams[i],
          sensorStreams[j]
        );
        alignments.push(alignment);

        // Flag low consistency as anomaly
        if (alignment.consistencyScore < 0.6) {
          anomalies.push({
            type: 'cross_modal_inconsistency',
            severity: alignment.consistencyScore < 0.4 ? 'critical' : 'high',
            description: `Poor alignment between ${alignment.modality1} and ${alignment.modality2}: ${alignment.anomalies.join(', ')}`,
            confidence: 1 - alignment.consistencyScore,
            detectedBy: 'CrossModalChecker',
          });
        }
      }
    }

    const avgConsistency = alignments.length > 0
      ? alignments.reduce((sum, a) => sum + a.consistencyScore, 0) / alignments.length
      : 1;

    const score = avgConsistency * 10;

    return {
      moduleName: 'CrossModalChecker',
      score,
      confidence: avgConsistency,
      anomalies,
      metadata: { alignments, pairCount: alignments.length },
      processingTimeMs: Date.now() - startTime,
      inputHash,
      preconditions: {
        sensorCount: sensorStreams.length,
        sensorTypes: sensorStreams.map(s => s.type),
      },
      intermediateOutputs: { alignments },
    };
  }

  /**
   * Check alignment between two sensor modalities
   */
  private async checkPairAlignment(
    stream1: SensorStream,
    stream2: SensorStream
  ): Promise<CrossModalAlignment> {
    const anomalies: string[] = [];

    // 1. Temporal alignment check
    const temporalAlignment = this.checkTemporalAlignment(
      stream1.timestamps,
      stream2.timestamps
    );

    if (temporalAlignment < 0.7) {
      anomalies.push(`Temporal misalignment: ${(temporalAlignment * 100).toFixed(1)}%`);
    }

    // 2. Spatial alignment (for GPS-enabled sensors)
    const spatialAlignment = this.checkSpatialAlignment(
      stream1.metadata,
      stream2.metadata
    );

    if (spatialAlignment < 0.8 && spatialAlignment > 0) {
      anomalies.push(`Spatial inconsistency detected`);
    }

    // 3. Embedding distance (semantic similarity)
    const embeddingDistance = await this.calculateEmbeddingDistance(stream1, stream2);

    if (embeddingDistance > 0.7) {
      anomalies.push(`High embedding distance: ${embeddingDistance.toFixed(3)}`);
    }

    // 4. Cross-correlation check for related signals
    const crossCorr = this.calculateCrossCorrelation(stream1, stream2);

    if (crossCorr < 0.3 && this.shouldBeCorrelated(stream1.type, stream2.type)) {
      anomalies.push(`Expected correlation not found: ${crossCorr.toFixed(3)}`);
    }

    // Overall consistency score (weighted average)
    const consistencyScore =
      0.3 * temporalAlignment +
      0.2 * (spatialAlignment > 0 ? spatialAlignment : 1) +
      0.3 * (1 - embeddingDistance) +
      0.2 * (this.shouldBeCorrelated(stream1.type, stream2.type) ? crossCorr : 1);

    return {
      modality1: stream1.type,
      modality2: stream2.type,
      embeddingDistance,
      temporalAlignment,
      spatialAlignment,
      consistencyScore: Math.max(0, Math.min(1, consistencyScore)),
      anomalies,
    };
  }

  /**
   * Check if timestamps are properly synchronized
   */
  private checkTemporalAlignment(ts1: number[], ts2: number[]): number {
    if (ts1.length === 0 || ts2.length === 0) return 1;

    // Find overlapping time range
    const start1 = Math.min(...ts1);
    const end1 = Math.max(...ts1);
    const start2 = Math.min(...ts2);
    const end2 = Math.max(...ts2);

    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);

    if (overlapEnd <= overlapStart) return 0; // No overlap

    const overlapDuration = overlapEnd - overlapStart;
    const totalDuration = Math.max(end1 - start1, end2 - start2);

    const overlapRatio = overlapDuration / totalDuration;

    // Check timestamp density consistency
    const density1 = ts1.length / (end1 - start1 + 1);
    const density2 = ts2.length / (end2 - start2 + 1);
    const densityRatio = Math.min(density1, density2) / Math.max(density1, density2);

    return (overlapRatio * 0.7 + densityRatio * 0.3);
  }

  /**
   * Check spatial consistency for GPS-enabled sensors
   */
  private checkSpatialAlignment(
    meta1: Record<string, unknown> | undefined,
    meta2: Record<string, unknown> | undefined
  ): number {
    const gps1 = meta1?.gps as [number, number] | undefined;
    const gps2 = meta2?.gps as [number, number] | undefined;

    if (!gps1 || !gps2) return -1; // N/A

    const distance = this.haversineDistance(gps1, gps2);

    // Sensors on same robot should be < 10m apart
    // Aligned sensors: < 1m
    if (distance < 1) return 1.0;
    if (distance < 5) return 0.9;
    if (distance < 10) return 0.8;
    if (distance < 50) return 0.6;
    return 0.3;
  }

  /**
   * Calculate semantic embedding distance between sensor streams
   *
   * In production, this would use:
   * - CLIP for camera ⬄ lidar
   * - DINOv2 for image features
   * - PointNet for lidar point clouds
   * - BERT-style for IMU/GPS time series
   *
   * For now, we use signal statistics as a proxy
   */
  private async calculateEmbeddingDistance(
    stream1: SensorStream,
    stream2: SensorStream
  ): Promise<number> {
    // Generate feature embeddings based on signal statistics
    const embed1 = this.extractStatisticalFeatures(stream1.data);
    const embed2 = this.extractStatisticalFeatures(stream2.data);

    // Cosine similarity
    const dotProduct = embed1.reduce((sum, val, i) => sum + val * embed2[i], 0);
    const mag1 = Math.sqrt(embed1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(embed2.reduce((sum, val) => sum + val * val, 0));

    const cosineSim = dotProduct / (mag1 * mag2 + 1e-10);
    const distance = 1 - cosineSim;

    return Math.max(0, Math.min(1, distance));
  }

  /**
   * Extract statistical feature vector from signal
   * This is a simplified version; production would use pretrained models
   */
  private extractStatisticalFeatures(data: Buffer): number[] {
    const sample = Array.from(data.slice(0, Math.min(1000, data.length)));

    const mean = sample.reduce((a, b) => a + b, 0) / sample.length;
    const variance = sample.reduce((sum, val) => sum + (val - mean) ** 2, 0) / sample.length;
    const stdDev = Math.sqrt(variance);

    const sorted = [...sample].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    const min = Math.min(...sample);
    const max = Math.max(...sample);
    const range = max - min;

    // Frequency domain features (simplified FFT approximation)
    const fft = this.simpleFFT(sample.slice(0, 256));

    return [
      mean / 255,
      stdDev / 255,
      median / 255,
      (q3 - q1) / 255,
      range / 255,
      ...fft.slice(0, 5),
    ];
  }

  /**
   * Simplified FFT for feature extraction
   */
  private simpleFFT(signal: number[]): number[] {
    const n = signal.length;
    const spectrum: number[] = [];

    for (let k = 0; k < Math.min(10, n / 2); k++) {
      let real = 0;
      let imag = 0;

      for (let t = 0; t < n; t++) {
        const angle = (2 * Math.PI * k * t) / n;
        real += signal[t] * Math.cos(angle);
        imag -= signal[t] * Math.sin(angle);
      }

      const magnitude = Math.sqrt(real * real + imag * imag) / n;
      spectrum.push(magnitude);
    }

    return spectrum;
  }

  /**
   * Calculate cross-correlation between two sensor streams
   */
  private calculateCrossCorrelation(stream1: SensorStream, stream2: SensorStream): number {
    const data1 = Array.from(stream1.data.slice(0, 1000));
    const data2 = Array.from(stream2.data.slice(0, 1000));

    const len = Math.min(data1.length, data2.length);
    const mean1 = data1.slice(0, len).reduce((a, b) => a + b, 0) / len;
    const mean2 = data2.slice(0, len).reduce((a, b) => a + b, 0) / len;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < len; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    const correlation = numerator / Math.sqrt(denom1 * denom2 + 1e-10);
    return Math.abs(correlation); // Return absolute correlation
  }

  /**
   * Determine if two sensor types should be correlated
   */
  private shouldBeCorrelated(type1: SensorType, type2: SensorType): boolean {
    const correlatedPairs: [SensorType, SensorType][] = [
      ['camera', 'depth'],
      ['camera', 'lidar'],
      ['gps', 'imu'],
      ['imu', 'camera'],
    ];

    return correlatedPairs.some(
      ([a, b]) => (a === type1 && b === type2) || (a === type2 && b === type1)
    );
  }

  /**
   * Haversine distance between two GPS coordinates
   */
  private haversineDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (coord1[0] * Math.PI) / 180;
    const φ2 = (coord2[0] * Math.PI) / 180;
    const Δφ = ((coord2[0] - coord1[0]) * Math.PI) / 180;
    const Δλ = ((coord2[1] - coord1[1]) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
