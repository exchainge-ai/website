/**
 * Sensor Source Registry & Reputation System
 *
 * Tracks sensor fingerprints, uploader history, and reputation over time.
 * Enables intelligence that learns patterns of trusted vs suspicious contributors.
 */

import { createHash } from 'crypto';
import type {
  SensorRegistry,
  ReputationScore,
  Verdict,
  SensorType,
  DatasetMetadata,
} from '../types';

interface RegistryStorage {
  get(fingerprint: string): Promise<SensorRegistry | null>;
  set(fingerprint: string, registry: SensorRegistry): Promise<void>;
  getByUploader(uploaderId: string): Promise<SensorRegistry[]>;
}

export class SensorRegistryManager {
  private storage: RegistryStorage;
  private cache: Map<string, SensorRegistry> = new Map();

  constructor(storage: RegistryStorage) {
    this.storage = storage;
  }

  /**
   * Generate unique fingerprint from sensor characteristics
   */
  generateFingerprint(
    metadata: DatasetMetadata,
    signalCharacteristics: Record<string, unknown>
  ): string {
    const components = {
      robotModel: metadata.declaredSource.robotModel,
      sensorTypes: metadata.declaredSource.sensorTypes.sort(),
      hardwareSpecs: metadata.declaredSource.hardwareSpecs,
      signalSignature: signalCharacteristics,
    };

    return createHash('sha256')
      .update(JSON.stringify(components))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Update registry with new verification result
   */
  async updateRegistry(
    fingerprint: string,
    datasetId: string,
    uploaderId: string,
    verdict: Verdict,
    confidence: number,
    metadata: DatasetMetadata
  ): Promise<SensorRegistry> {
    let registry = await this.storage.get(fingerprint);

    const now = new Date();

    if (!registry) {
      // Create new registry entry
      registry = {
        fingerprint,
        metadata: {
          robotModel: metadata.declaredSource.robotModel,
          sensorTypes: metadata.declaredSource.sensorTypes,
          hardwareSignature: JSON.stringify(metadata.declaredSource.hardwareSpecs),
        },
        statistics: {
          totalDatasets: 0,
          authenticity: {
            authentic: 0,
            suspicious: 0,
            synthetic: 0,
          },
          avgQualityScore: 0,
          avgConfidence: 0,
        },
        reputation: {
          sensorFingerprint: fingerprint,
          uploaderId,
          uploadCount: 0,
          avgConfidence: 0,
          syntheticRate: 0,
          anomalyRate: 0,
          reputationGrade: 'B',
          flags: [],
          firstSeenAt: now,
          lastSeenAt: now,
        },
        history: [],
      };
    }

    // Update statistics
    registry.statistics.totalDatasets++;

    if (verdict === 'authentic' || verdict === 'likely_authentic') {
      registry.statistics.authenticity.authentic++;
    } else if (verdict === 'synthetic' || verdict === 'likely_synthetic') {
      registry.statistics.authenticity.synthetic++;
    } else {
      registry.statistics.authenticity.suspicious++;
    }

    // Add to history
    registry.history.push({
      datasetId,
      timestamp: now,
      verdict,
      confidence,
    });

    // Keep only last 100 entries in history
    if (registry.history.length > 100) {
      registry.history = registry.history.slice(-100);
    }

    // Recalculate reputation
    registry.reputation = this.calculateReputation(registry, uploaderId);

    // Save to storage
    await this.storage.set(fingerprint, registry);
    this.cache.set(fingerprint, registry);

    return registry;
  }

  /**
   * Calculate reputation score based on historical data
   */
  private calculateReputation(
    registry: SensorRegistry,
    uploaderId: string
  ): ReputationScore {
    const stats = registry.statistics;
    const history = registry.history;

    const uploadCount = stats.totalDatasets;
    const syntheticCount = stats.authenticity.synthetic;
    const suspiciousCount = stats.authenticity.suspicious;

    const syntheticRate = syntheticCount / uploadCount;
    const anomalyRate = (syntheticCount + suspiciousCount) / uploadCount;

    // Calculate average confidence from recent history
    const recentHistory = history.slice(-20);
    const avgConfidence = recentHistory.length > 0
      ? recentHistory.reduce((sum, h) => sum + h.confidence, 0) / recentHistory.length
      : 0;

    // Determine reputation grade
    const grade = this.calculateGrade(syntheticRate, anomalyRate, avgConfidence, uploadCount);

    // Generate flags
    const flags: string[] = [];

    if (syntheticRate > 0.3) {
      flags.push('High synthetic rate');
    }

    if (anomalyRate > 0.5) {
      flags.push('Frequent anomalies detected');
    }

    if (uploadCount > 50 && avgConfidence < 0.5) {
      flags.push('Consistently low confidence');
    }

    // Check for suspicious patterns
    if (this.detectSuspiciousPattern(history)) {
      flags.push('Suspicious upload pattern detected');
    }

    // Check for sudden drops in quality
    if (this.detectQualityDrop(history)) {
      flags.push('Recent quality degradation');
    }

    return {
      sensorFingerprint: registry.fingerprint,
      uploaderId,
      uploadCount,
      avgConfidence,
      syntheticRate,
      anomalyRate,
      reputationGrade: grade,
      flags,
      firstSeenAt: registry.reputation.firstSeenAt,
      lastSeenAt: new Date(),
    };
  }

  /**
   * Calculate reputation grade
   */
  private calculateGrade(
    syntheticRate: number,
    anomalyRate: number,
    avgConfidence: number,
    uploadCount: number
  ): ReputationScore['reputationGrade'] {
    // New uploaders start at B
    if (uploadCount < 5) return 'B';

    const score =
      (1 - syntheticRate) * 0.4 +
      (1 - anomalyRate) * 0.3 +
      avgConfidence * 0.3;

    if (score >= 0.95) return 'A+';
    if (score >= 0.85) return 'A';
    if (score >= 0.75) return 'B+';
    if (score >= 0.65) return 'B';
    if (score >= 0.50) return 'C';
    if (score >= 0.35) return 'D';
    return 'F';
  }

  /**
   * Detect suspicious upload patterns (e.g., rapid bursts, time anomalies)
   */
  private detectSuspiciousPattern(
    history: SensorRegistry['history']
  ): boolean {
    if (history.length < 10) return false;

    const recent = history.slice(-20);
    const timestamps = recent.map(h => h.timestamp.getTime());

    // Check for rapid burst uploads (>10 uploads in <1 hour)
    const oneHourAgo = Date.now() - 3600000;
    const recentUploads = timestamps.filter(t => t > oneHourAgo).length;

    if (recentUploads > 10) return true;

    // Check for perfectly regular intervals (bot-like behavior)
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + (val - avgInterval) ** 2, 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // If variance is very low, uploads are suspiciously regular
    if (stdDev < avgInterval * 0.05 && intervals.length > 5) return true;

    return false;
  }

  /**
   * Detect sudden quality drops (possible account compromise)
   */
  private detectQualityDrop(
    history: SensorRegistry['history']
  ): boolean {
    if (history.length < 10) return false;

    const recent = history.slice(-5);
    const older = history.slice(-15, -5);

    const recentAvgConf = recent.reduce((sum, h) => sum + h.confidence, 0) / recent.length;
    const olderAvgConf = older.reduce((sum, h) => sum + h.confidence, 0) / older.length;

    // Drop of >30% in confidence
    return olderAvgConf - recentAvgConf > 0.3;
  }

  /**
   * Get reputation for a sensor fingerprint
   */
  async getReputation(fingerprint: string): Promise<ReputationScore | null> {
    const registry = await this.storage.get(fingerprint);
    return registry?.reputation ?? null;
  }

  /**
   * Get all sensors for an uploader
   */
  async getUploaderProfile(uploaderId: string): Promise<{
    totalSensors: number;
    totalUploads: number;
    avgReputation: string;
    flags: string[];
    sensors: SensorRegistry[];
  }> {
    const sensors = await this.storage.getByUploader(uploaderId);

    const totalUploads = sensors.reduce((sum, s) => sum + s.statistics.totalDatasets, 0);

    const allFlags = new Set<string>();
    sensors.forEach(s => s.reputation.flags.forEach(f => allFlags.add(f)));

    // Calculate average reputation grade
    const gradeValues = { 'A+': 12, 'A': 10, 'B+': 8, 'B': 6, 'C': 4, 'D': 2, 'F': 0 };
    const avgGradeValue = sensors.length > 0
      ? sensors.reduce((sum, s) => sum + gradeValues[s.reputation.reputationGrade], 0) / sensors.length
      : 6;

    const avgGrade = Object.entries(gradeValues).reduce((best, [grade, value]) =>
      Math.abs(value - avgGradeValue) < Math.abs(gradeValues[best as keyof typeof gradeValues] - avgGradeValue) ? grade : best
    , 'B');

    return {
      totalSensors: sensors.length,
      totalUploads,
      avgReputation: avgGrade,
      flags: Array.from(allFlags),
      sensors,
    };
  }
}

/**
 * In-memory storage implementation (for testing/demo)
 * In production, use Redis, PostgreSQL, or similar
 */
export class InMemoryRegistryStorage implements RegistryStorage {
  private data: Map<string, SensorRegistry> = new Map();

  async get(fingerprint: string): Promise<SensorRegistry | null> {
    return this.data.get(fingerprint) ?? null;
  }

  async set(fingerprint: string, registry: SensorRegistry): Promise<void> {
    this.data.set(fingerprint, registry);
  }

  async getByUploader(uploaderId: string): Promise<SensorRegistry[]> {
    return Array.from(this.data.values()).filter(
      r => r.reputation.uploaderId === uploaderId
    );
  }
}
