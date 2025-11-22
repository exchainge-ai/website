/**
 * Sensor Signature Classifier
 * Analyzes low-level signal characteristics to verify sensor types
 */

import type { ModuleResult, VerificationAnomaly, SensorType } from '../types';

interface SignalProfile {
  noiseFloor: number;
  spectralPeaks: number[];
  entropy: number;
  frequencyDomain: number[];
}

export class SensorSignatureClassifier {
  private sensorProfiles = new Map<SensorType, Partial<SignalProfile>>([
    ['lidar', { noiseFloor: 0.02, spectralPeaks: [40, 120] }],
    ['camera', { entropy: 7.2, noiseFloor: 0.05 }],
    ['imu', { spectralPeaks: [50, 100, 200], entropy: 5.5 }],
    ['gps', { noiseFloor: 0.001, entropy: 3.2 }],
  ]);

  async classify(
    declaredSensors: SensorType[],
    dataBuffer: Buffer
  ): Promise<ModuleResult> {
    const startTime = Date.now();
    const anomalies: VerificationAnomaly[] = [];

    // Simulate signal analysis (in production, use FFT, entropy calculation, etc.)
    const detectedProfiles = this.analyzeSignalCharacteristics(dataBuffer);

    for (const declaredSensor of declaredSensors) {
      const expectedProfile = this.sensorProfiles.get(declaredSensor);
      if (!expectedProfile) continue;

      // Check if signal matches expected profile
      const match = this.profileMatchScore(detectedProfiles, expectedProfile);

      if (match < 0.7) {
        anomalies.push({
          type: 'sensor_mismatch',
          severity: match < 0.4 ? 'high' : 'medium',
          description: `${declaredSensor} signal characteristics don't match expected profile (${Math.round(match * 100)}% match)`,
          confidence: 0.8,
          detectedBy: 'SensorSignatureClassifier',
        });
      }
    }

    // Detect synthetic/AI-generated patterns
    const syntheticScore = this.detectSyntheticPatterns(dataBuffer);
    if (syntheticScore > 0.7) {
      anomalies.push({
        type: 'tamper_detected',
        severity: 'critical',
        description: `High probability of synthetic/AI-generated data (${Math.round(syntheticScore * 100)}%)`,
        confidence: syntheticScore,
        detectedBy: 'SensorSignatureClassifier',
      });
    }

    const score = 10 - (anomalies.length * 2);
    const confidence = anomalies.length === 0 ? 0.9 : 0.6;

    return {
      moduleName: 'SensorSignatureClassifier',
      score: Math.max(0, score),
      confidence,
      anomalies,
      metadata: {
        detectedSensorCount: detectedProfiles.length,
        syntheticProbability: syntheticScore,
      },
      processingTimeMs: Date.now() - startTime,
    };
  }

  private analyzeSignalCharacteristics(buffer: Buffer): SignalProfile[] {
    // Simplified simulation - in production:
    // 1. Parse sensor data streams
    // 2. Compute FFT for frequency analysis
    // 3. Calculate Shannon entropy
    // 4. Analyze noise floor using statistical methods

    // Simulate with basic buffer analysis
    const entropy = this.calculateEntropy(buffer.slice(0, Math.min(10000, buffer.length)));
    const noiseFloor = this.estimateNoiseFloor(buffer.slice(0, Math.min(1000, buffer.length)));

    return [{
      noiseFloor,
      entropy,
      spectralPeaks: [50, 100], // Simulated
      frequencyDomain: [],
    }];
  }

  private calculateEntropy(buffer: Buffer): number {
    const freq = new Map<number, number>();
    for (const byte of buffer) {
      freq.set(byte, (freq.get(byte) || 0) + 1);
    }

    let entropy = 0;
    const len = buffer.length;
    for (const count of freq.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  private estimateNoiseFloor(buffer: Buffer): number {
    // Simple variance calculation as noise proxy
    const values = Array.from(buffer);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / 255; // Normalized
  }

  private profileMatchScore(detected: SignalProfile[], expected: Partial<SignalProfile>): number {
    if (detected.length === 0) return 0;

    const profile = detected[0];
    let matchScore = 0;
    let checks = 0;

    if (expected.entropy !== undefined) {
      const entropyDiff = Math.abs(profile.entropy - expected.entropy) / expected.entropy;
      matchScore += 1 - Math.min(1, entropyDiff);
      checks++;
    }

    if (expected.noiseFloor !== undefined) {
      const noiseDiff = Math.abs(profile.noiseFloor - expected.noiseFloor) / expected.noiseFloor;
      matchScore += 1 - Math.min(1, noiseDiff);
      checks++;
    }

    return checks > 0 ? matchScore / checks : 0.5;
  }

  private detectSyntheticPatterns(buffer: Buffer): number {
    // Detect patterns common in AI-generated or synthetic data
    // 1. Too-perfect periodicity
    // 2. Unnatural entropy distribution
    // 3. Missing natural noise characteristics

    const entropy = this.calculateEntropy(buffer.slice(0, Math.min(10000, buffer.length)));

    // Real sensor data typically has entropy between 6-8
    // Synthetic often either too low (< 5) or artificially high (> 8.5)
    if (entropy < 5 || entropy > 8.5) {
      return 0.7;
    }

    // Check for repeating patterns (simple version)
    const sample = buffer.slice(0, Math.min(1000, buffer.length));
    let repeats = 0;
    for (let i = 0; i < sample.length - 10; i++) {
      for (let j = i + 1; j < sample.length - 10; j++) {
        if (sample.slice(i, i + 10).equals(sample.slice(j, j + 10))) {
          repeats++;
        }
      }
    }

    return repeats > 5 ? 0.6 : 0.2;
  }
}
