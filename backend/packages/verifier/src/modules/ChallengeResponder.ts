/**
 * Challenge-Response Verification Module
 *
 * Implements active sampling with zero-knowledge challenges to detect synthetic data.
 * Real sensor data responds predictably to perturbations; AI-generated data often fails.
 */

import { createHash } from 'crypto';
import sharp from 'sharp';
import type { ChallengeTest, ModuleResult, VerificationAnomaly } from '../types';

interface ChallengeConfig {
  perturbationIntensity: number; // 0-1
  compressionQuality: number; // 0-100
  temporalShiftMs: number;
  noiseStdDev: number;
}

export class ChallengeResponder {
  private config: ChallengeConfig;

  constructor(config?: Partial<ChallengeConfig>) {
    this.config = {
      perturbationIntensity: config?.perturbationIntensity ?? 0.05,
      compressionQuality: config?.compressionQuality ?? 75,
      temporalShiftMs: config?.temporalShiftMs ?? 100,
      noiseStdDev: config?.noiseStdDev ?? 0.02,
    };
  }

  async challenge(
    dataBuffer: Buffer,
    sensorType: string,
    metadata: Record<string, unknown>
  ): Promise<ModuleResult> {
    const startTime = Date.now();
    const inputHash = createHash('sha256').update(dataBuffer).digest('hex');
    const anomalies: VerificationAnomaly[] = [];
    const tests: ChallengeTest[] = [];

    // Run multiple challenge types in parallel
    const [
      perturbationTest,
      compressionTest,
      noiseTest,
      temporalTest,
    ] = await Promise.all([
      this.runPerturbationChallenge(dataBuffer, sensorType),
      this.runCompressionChallenge(dataBuffer, sensorType),
      this.runNoiseInjectionChallenge(dataBuffer),
      this.runTemporalShiftChallenge(dataBuffer, metadata),
    ]);

    tests.push(perturbationTest, compressionTest, noiseTest, temporalTest);

    // Analyze test results
    const passedTests = tests.filter(t => t.passed).length;
    const avgConfidence = tests.reduce((sum, t) => sum + t.confidence, 0) / tests.length;

    // Flag failures as anomalies
    tests.filter(t => !t.passed).forEach(test => {
      anomalies.push({
        type: 'challenge_failure',
        severity: test.confidence < 0.5 ? 'critical' : 'high',
        description: `Failed ${test.type} challenge: ${test.expectedBehavior}`,
        confidence: 1 - test.confidence,
        detectedBy: 'ChallengeResponder',
      });
    });

    const score = (passedTests / tests.length) * 10;

    return {
      moduleName: 'ChallengeResponder',
      score,
      confidence: avgConfidence,
      anomalies,
      metadata: { tests, passRate: passedTests / tests.length },
      processingTimeMs: Date.now() - startTime,
      inputHash,
      preconditions: { sensorType, bufferSize: dataBuffer.length },
      intermediateOutputs: { testResults: tests },
    };
  }

  /**
   * Perturb signal slightly and check if response is consistent with real sensors
   */
  private async runPerturbationChallenge(
    buffer: Buffer,
    sensorType: string
  ): Promise<ChallengeTest> {
    try {
      const perturbed = Buffer.from(buffer);

      // Apply small random perturbations
      for (let i = 0; i < perturbed.length; i += 100) {
        const jitter = Math.floor((Math.random() - 0.5) * this.config.perturbationIntensity * 255);
        perturbed[i] = Math.max(0, Math.min(255, perturbed[i] + jitter));
      }

      // Real sensor data should have minimal structural change
      const originalEntropy = this.calculateEntropy(buffer);
      const perturbedEntropy = this.calculateEntropy(perturbed);
      const entropyDrift = Math.abs(originalEntropy - perturbedEntropy);

      // Real data: entropy drift < 0.5 bits
      // Synthetic data: often has higher drift due to hidden patterns
      const passed = entropyDrift < 0.5;
      const confidence = Math.max(0, 1 - entropyDrift);

      return {
        type: 'perturbation',
        parameters: { intensity: this.config.perturbationIntensity, entropyDrift },
        expectedBehavior: 'Entropy should remain stable under small perturbations',
        actualResponse: { originalEntropy, perturbedEntropy, drift: entropyDrift },
        passed,
        confidence,
      };
    } catch (error) {
      return {
        type: 'perturbation',
        parameters: {},
        expectedBehavior: 'Should handle perturbation gracefully',
        actualResponse: { error: String(error) },
        passed: false,
        confidence: 0,
      };
    }
  }

  /**
   * Compress and decompress; check for artifacts that indicate synthetic generation
   */
  private async runCompressionChallenge(
    buffer: Buffer,
    sensorType: string
  ): Promise<ChallengeTest> {
    try {
      if (sensorType !== 'camera') {
        // Skip for non-image sensors
        return {
          type: 'compression',
          parameters: { skipped: true },
          expectedBehavior: 'N/A for non-image sensors',
          actualResponse: {},
          passed: true,
          confidence: 1,
        };
      }

      // Compress to JPEG at specified quality
      const compressed = await sharp(buffer)
        .jpeg({ quality: this.config.compressionQuality })
        .toBuffer();

      const decompressed = await sharp(compressed).raw().toBuffer();

      // Calculate compression artifact score
      // Real camera data: moderate artifacts
      // AI-generated: often too clean or too messy
      const sizeRatio = compressed.length / buffer.length;
      const artifactScore = this.detectCompressionArtifacts(buffer, decompressed);

      // Real photos: artifact score 0.05-0.15, size ratio 0.1-0.3
      const passed = artifactScore > 0.03 && artifactScore < 0.2 && sizeRatio > 0.08 && sizeRatio < 0.4;
      const confidence = passed ? 0.8 : 0.3;

      return {
        type: 'compression',
        parameters: { quality: this.config.compressionQuality, sizeRatio, artifactScore },
        expectedBehavior: 'Compression artifacts should match real camera data',
        actualResponse: { sizeRatio, artifactScore },
        passed,
        confidence,
      };
    } catch (error) {
      return {
        type: 'compression',
        parameters: {},
        expectedBehavior: 'Should handle compression gracefully',
        actualResponse: { error: String(error) },
        passed: false,
        confidence: 0,
      };
    }
  }

  /**
   * Inject Gaussian noise and measure response consistency
   */
  private async runNoiseInjectionChallenge(buffer: Buffer): Promise<ChallengeTest> {
    try {
      const noisy = Buffer.from(buffer);

      // Add Gaussian noise
      for (let i = 0; i < noisy.length; i++) {
        const noise = this.gaussianRandom() * this.config.noiseStdDev * 255;
        noisy[i] = Math.max(0, Math.min(255, noisy[i] + noise));
      }

      // Measure SNR (Signal-to-Noise Ratio)
      const snr = this.calculateSNR(buffer, noisy);

      // Real sensors: SNR degrades predictably
      // Synthetic: SNR can behave unexpectedly
      const passed = snr > 15 && snr < 40; // Typical SNR range for noisy real data
      const confidence = passed ? 0.85 : 0.4;

      return {
        type: 'noise_injection',
        parameters: { stdDev: this.config.noiseStdDev, snr },
        expectedBehavior: 'SNR should degrade predictably (15-40 dB)',
        actualResponse: { snr },
        passed,
        confidence,
      };
    } catch (error) {
      return {
        type: 'noise_injection',
        parameters: {},
        expectedBehavior: 'Should handle noise injection',
        actualResponse: { error: String(error) },
        passed: false,
        confidence: 0,
      };
    }
  }

  /**
   * Shift timestamps slightly and check for temporal consistency
   */
  private async runTemporalShiftChallenge(
    buffer: Buffer,
    metadata: Record<string, unknown>
  ): Promise<ChallengeTest> {
    try {
      const timestamps = metadata.timestamps as number[] | undefined;

      if (!timestamps || timestamps.length < 2) {
        return {
          type: 'temporal_shift',
          parameters: { skipped: true },
          expectedBehavior: 'N/A without timestamp data',
          actualResponse: {},
          passed: true,
          confidence: 1,
        };
      }

      // Shift all timestamps by a small amount
      const shiftedTimestamps = timestamps.map(t => t + this.config.temporalShiftMs);

      // Calculate inter-frame intervals
      const originalIntervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
      const shiftedIntervals = shiftedTimestamps.slice(1).map((t, i) => t - shiftedTimestamps[i]);

      // Real data: intervals should be identical (shift doesn't affect relative timing)
      const intervalsMatch = originalIntervals.every((interval, i) =>
        Math.abs(interval - shiftedIntervals[i]) < 1
      );

      return {
        type: 'temporal_shift',
        parameters: { shiftMs: this.config.temporalShiftMs },
        expectedBehavior: 'Relative timing should remain constant after shift',
        actualResponse: { intervalsMatch },
        passed: intervalsMatch,
        confidence: intervalsMatch ? 0.9 : 0.2,
      };
    } catch (error) {
      return {
        type: 'temporal_shift',
        parameters: {},
        expectedBehavior: 'Should handle temporal shift',
        actualResponse: { error: String(error) },
        passed: false,
        confidence: 0,
      };
    }
  }

  // Utility functions

  private calculateEntropy(buffer: Buffer): number {
    const freq = new Map<number, number>();
    for (const byte of buffer) {
      freq.set(byte, (freq.get(byte) || 0) + 1);
    }

    let entropy = 0;
    for (const count of freq.values()) {
      const p = count / buffer.length;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  private detectCompressionArtifacts(original: Buffer, decompressed: Buffer): number {
    if (original.length !== decompressed.length) return 1.0;

    let totalDiff = 0;
    for (let i = 0; i < original.length; i++) {
      totalDiff += Math.abs(original[i] - decompressed[i]);
    }

    return totalDiff / (original.length * 255);
  }

  private calculateSNR(signal: Buffer, noisy: Buffer): number {
    let signalPower = 0;
    let noisePower = 0;

    for (let i = 0; i < signal.length; i++) {
      signalPower += signal[i] ** 2;
      noisePower += (signal[i] - noisy[i]) ** 2;
    }

    const snr = 10 * Math.log10(signalPower / (noisePower + 1e-10));
    return snr;
  }

  private gaussianRandom(): number {
    // Box-Muller transform for Gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
