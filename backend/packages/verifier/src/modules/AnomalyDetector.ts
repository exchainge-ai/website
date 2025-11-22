/**
 * Anomaly & Tamper Detection Module
 * Uses statistical methods and pattern analysis to detect tampering
 */

import type { ModuleResult, VerificationAnomaly } from '../types';


export class AnomalyDetector {
  async detect(dataBuffer: Buffer): Promise<ModuleResult> {
    const startTime = Date.now();
    const anomalies: VerificationAnomaly[] = [];

    // Statistical outlier detection
    const outliers = this.detectStatisticalOutliers(dataBuffer);
    if (outliers.count > 0) {
      anomalies.push({
        type: 'quality_issue',
        severity: outliers.count > 100 ? 'medium' : 'low',
        description: `Detected ${outliers.count} statistical outliers (${outliers.percentage.toFixed(2)}%)`,
        confidence: 0.75,
        detectedBy: 'AnomalyDetector',
      });
    }

    // Entropy analysis
    const entropyAnomaly = this.analyzeEntropy(dataBuffer);
    if (entropyAnomaly) {
      anomalies.push(entropyAnomaly);
    }

    // Frequency domain analysis (detect artificial patterns)
    const frequencyAnomaly = this.analyzeFrequencyDomain(dataBuffer);
    if (frequencyAnomaly) {
      anomalies.push(frequencyAnomaly);
    }

    // Detect compression artifacts (sign of re-encoding/tampering)
    const compressionAnomaly = this.detectCompressionArtifacts(dataBuffer);
    if (compressionAnomaly) {
      anomalies.push(compressionAnomaly);
    }

    // Check for file manipulation signatures
    const tamperAnomaly = this.detectTamperSignatures(dataBuffer);
    if (tamperAnomaly) {
      anomalies.push(tamperAnomaly);
    }

    const score = 10 - Math.min(10, anomalies.length * 2);
    const confidence = this.calculateConfidence(anomalies);

    return {
      moduleName: 'AnomalyDetector',
      score: Math.max(0, score),
      confidence,
      anomalies,
      metadata: {
        outlierCount: outliers.count,
        entropyScore: this.calculateEntropy(dataBuffer),
      },
      processingTimeMs: Date.now() - startTime,
    };
  }

  private detectStatisticalOutliers(buffer: Buffer): { count: number; percentage: number } {
    const sample = Array.from(buffer.slice(0, Math.min(50000, buffer.length)));
    const mean = sample.reduce((a, b) => a + b, 0) / sample.length;
    const std = Math.sqrt(
      sample.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sample.length
    );

    // Count values beyond 3 standard deviations
    const threshold = 3 * std;
    const outliers = sample.filter(val => Math.abs(val - mean) > threshold);

    return {
      count: outliers.length,
      percentage: (outliers.length / sample.length) * 100,
    };
  }

  private calculateEntropy(buffer: Buffer): number {
    const freq = new Map<number, number>();
    const sample = buffer.slice(0, Math.min(10000, buffer.length));

    for (const byte of sample) {
      freq.set(byte, (freq.get(byte) || 0) + 1);
    }

    let entropy = 0;
    for (const count of freq.values()) {
      const p = count / sample.length;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  private analyzeEntropy(buffer: Buffer): VerificationAnomaly | null {
    const entropy = this.calculateEntropy(buffer);

    // Real sensor data typically has entropy 6-8
    // Too low = possibly compressed or synthetic
    // Too high = possibly encrypted or tampered
    if (entropy < 4) {
      return {
        type: 'tamper_detected',
        severity: 'high',
        description: `Abnormally low entropy (${entropy.toFixed(2)}), possible compression or synthetic data`,
        confidence: 0.8,
        detectedBy: 'AnomalyDetector',
      };
    }

    if (entropy > 8.5) {
      return {
        type: 'tamper_detected',
        severity: 'medium',
        description: `Abnormally high entropy (${entropy.toFixed(2)}), possible encryption or manipulation`,
        confidence: 0.7,
        detectedBy: 'AnomalyDetector',
      };
    }

    return null;
  }

  private analyzeFrequencyDomain(buffer: Buffer): VerificationAnomaly | null {
    // Simplified frequency analysis
    // In production: use FFT to detect periodic patterns that shouldn't exist

    const sample = buffer.slice(0, Math.min(1024, buffer.length));
    let periodicPatterns = 0;

    // Check for repeating sequences
    for (let period = 2; period < 64; period++) {
      let matches = 0;
      for (let i = 0; i < sample.length - period * 2; i++) {
        if (sample[i] === sample[i + period]) {
          matches++;
        }
      }

      const matchRate = matches / (sample.length - period * 2);
      if (matchRate > 0.7) {
        periodicPatterns++;
      }
    }

    if (periodicPatterns > 5) {
      return {
        type: 'tamper_detected',
        severity: 'medium',
        description: 'Detected artificial periodic patterns, possible synthetic generation',
        confidence: 0.75,
        detectedBy: 'AnomalyDetector',
      };
    }

    return null;
  }

  private detectCompressionArtifacts(buffer: Buffer): VerificationAnomaly | null {
    // Check for JPEG/lossy compression markers (should not exist in raw sensor data)
    const jpegMarkers = [0xFF, 0xD8, 0xFF]; // JPEG SOI marker
    const pngMarkers = [0x89, 0x50, 0x4E]; // PNG signature

    const hasJPEG = this.containsSequence(buffer.slice(0, 1000), jpegMarkers);
    const hasPNG = this.containsSequence(buffer.slice(0, 1000), pngMarkers);

    if (hasJPEG || hasPNG) {
      return {
        type: 'quality_issue',
        severity: 'medium',
        description: 'Detected image compression markers in sensor data',
        confidence: 0.9,
        detectedBy: 'AnomalyDetector',
      };
    }

    return null;
  }

  private detectTamperSignatures(buffer: Buffer): VerificationAnomaly | null {
    // Check for common tamper signatures:
    // 1. Suspiciously aligned data (all zeros, all ones)
    // 2. Sudden distribution changes
    // 3. Missing noise (too clean)

    const sample = buffer.slice(0, Math.min(10000, buffer.length));
    const zeros = sample.filter(b => b === 0).length;
    const ones = sample.filter(b => b === 255).length;

    const zeroRate = zeros / sample.length;
    const oneRate = ones / sample.length;

    if (zeroRate > 0.3 || oneRate > 0.3) {
      return {
        type: 'tamper_detected',
        severity: 'high',
        description: `Suspicious data distribution: ${(zeroRate * 100).toFixed(1)}% zeros, ${(oneRate * 100).toFixed(1)}% ones`,
        confidence: 0.85,
        detectedBy: 'AnomalyDetector',
      };
    }

    return null;
  }

  private containsSequence(buffer: Buffer, sequence: number[]): boolean {
    for (let i = 0; i <= buffer.length - sequence.length; i++) {
      let match = true;
      for (let j = 0; j < sequence.length; j++) {
        if (buffer[i + j] !== sequence[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  private calculateConfidence(anomalies: VerificationAnomaly[]): number {
    if (anomalies.length === 0) return 0.95;

    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const highCount = anomalies.filter(a => a.severity === 'high').length;

    if (criticalCount > 0) return 0.4;
    if (highCount > 2) return 0.5;
    if (highCount > 0) return 0.7;
    return 0.85;
  }
}
