/**
 * Temporal & Spatial Coherence Checker
 * Validates time-series consistency and spatial relationships
 */

import type { ModuleResult, VerificationAnomaly } from '../types';

interface TimeSeriesData {
  timestamps: number[];
  frames: unknown[];
  gpsCoordinates?: [number, number][];
}

export class TemporalSpatialChecker {
  async check(
    data: TimeSeriesData,
    expectedFrameRate?: number
  ): Promise<ModuleResult> {
    const startTime = Date.now();
    const anomalies: VerificationAnomaly[] = [];

    // Check for temporal gaps
    const gaps = this.detectTemporalGaps(data.timestamps, expectedFrameRate);
    if (gaps.length > 0) {
      anomalies.push({
        type: 'temporal_gap',
        severity: gaps.length > 10 ? 'high' : 'medium',
        description: `Detected ${gaps.length} temporal gaps in data stream`,
        affectedFrames: gaps,
        confidence: 0.95,
      });
    }

    // Check for duplicate timestamps
    const duplicates = this.detectDuplicates(data.timestamps);
    if (duplicates.length > 0) {
      anomalies.push({
        type: 'duplicate_frames',
        severity: duplicates.length > 5 ? 'high' : 'low',
        description: `Found ${duplicates.length} duplicate timestamps`,
        affectedFrames: duplicates,
        confidence: 1.0,
      });
    }

    // Check for impossible timestamps (future dates, negative intervals)
    const invalidTimestamps = this.detectInvalidTimestamps(data.timestamps);
    if (invalidTimestamps.length > 0) {
      anomalies.push({
        type: 'temporal_gap',
        severity: 'critical',
        description: 'Detected impossible timestamps (future or invalid)',
        affectedFrames: invalidTimestamps,
        confidence: 1.0,
      });
    }

    // Spatial coherence (if GPS data available)
    if (data.gpsCoordinates && data.gpsCoordinates.length > 1) {
      const spatialAnomalies = this.detectSpatialAnomalies(data.gpsCoordinates);
      anomalies.push(...spatialAnomalies);
    }

    // Frame rate consistency check
    if (expectedFrameRate) {
      const actualFrameRate = this.calculateActualFrameRate(data.timestamps);
      const deviation = Math.abs(actualFrameRate - expectedFrameRate) / expectedFrameRate;

      if (deviation > 0.2) {
        anomalies.push({
          type: 'quality_issue',
          severity: deviation > 0.5 ? 'high' : 'medium',
          description: `Frame rate deviation: expected ${expectedFrameRate}fps, got ${actualFrameRate.toFixed(2)}fps`,
          confidence: 0.9,
        });
      }
    }

    const score = 10 - Math.min(10, anomalies.length * 1.5);
    const confidence = anomalies.length === 0 ? 0.95 : 0.7;

    return {
      moduleName: 'TemporalSpatialChecker',
      score: Math.max(0, score),
      confidence,
      anomalies,
      metadata: {
        totalFrames: data.timestamps.length,
        gapsDetected: gaps.length,
        duplicatesDetected: duplicates.length,
        actualFrameRate: this.calculateActualFrameRate(data.timestamps),
      },
      processingTimeMs: Date.now() - startTime,
    };
  }

  private detectTemporalGaps(timestamps: number[], expectedFrameRate?: number): number[] {
    const gaps: number[] = [];
    const expectedInterval = expectedFrameRate ? 1000 / expectedFrameRate : null;

    for (let i = 1; i < timestamps.length; i++) {
      const interval = timestamps[i] - timestamps[i - 1];

      // Gap detection logic
      if (expectedInterval) {
        // If we know expected frame rate, detect significant deviations
        if (interval > expectedInterval * 2) {
          gaps.push(i);
        }
      } else {
        // Otherwise, detect abnormally large gaps (> 1 second)
        if (interval > 1000) {
          gaps.push(i);
        }
      }

      // Also detect negative intervals (time going backwards)
      if (interval < 0) {
        gaps.push(i);
      }
    }

    return gaps;
  }

  private detectDuplicates(timestamps: number[]): number[] {
    const seen = new Set<number>();
    const duplicates: number[] = [];

    timestamps.forEach((ts, idx) => {
      if (seen.has(ts)) {
        duplicates.push(idx);
      }
      seen.add(ts);
    });

    return duplicates;
  }

  private detectInvalidTimestamps(timestamps: number[]): number[] {
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    const oneYearFuture = now + (365 * 24 * 60 * 60 * 1000);

    return timestamps
      .map((ts, idx) => ({ ts, idx }))
      .filter(({ ts }) => ts < oneYearAgo || ts > oneYearFuture || ts < 0)
      .map(({ idx }) => idx);
  }

  private calculateActualFrameRate(timestamps: number[]): number {
    if (timestamps.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return 1000 / avgInterval; // Convert to fps
  }

  private detectSpatialAnomalies(
    coordinates: [number, number][]
  ): VerificationAnomaly[] {
    const anomalies: VerificationAnomaly[] = [];

    // Check for impossible jumps in GPS coordinates
    const impossibleJumps: number[] = [];

    for (let i = 1; i < coordinates.length; i++) {
      const distance = this.haversineDistance(
        coordinates[i - 1],
        coordinates[i]
      );

      // If distance > 1km between consecutive frames, flag as suspicious
      // (assumes reasonable frame rates and vehicle speeds)
      if (distance > 1000) {
        impossibleJumps.push(i);
      }
    }

    if (impossibleJumps.length > 0) {
      anomalies.push({
        type: 'spatial_inconsistency',
        severity: impossibleJumps.length > 5 ? 'high' : 'medium',
        description: `Detected ${impossibleJumps.length} impossible GPS jumps (> 1km between frames)`,
        affectedFrames: impossibleJumps,
        confidence: 0.9,
      });
    }

    // Check for GPS drift (all points identical - stuck GPS)
    const uniquePoints = new Set(coordinates.map(c => `${c[0]},${c[1]}`));
    if (uniquePoints.size === 1 && coordinates.length > 10) {
      anomalies.push({
        type: 'quality_issue',
        severity: 'medium',
        description: 'GPS appears stuck (all coordinates identical)',
        confidence: 0.95,
      });
    }

    return anomalies;
  }

  private haversineDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
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
