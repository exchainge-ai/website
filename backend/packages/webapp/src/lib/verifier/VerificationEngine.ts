/**
 * Main Verification Engine
 * Orchestrates all verification modules and generates final report
 */

import type {
  DatasetMetadata,
  VerificationReport,
  VerifierConfig,
  Verdict,
  ModuleResult,
  SensorType,
} from '@/lib/verifier/types';
import { MetadataValidator } from '@/lib/verifier/modules/MetadataValidator';
import { SensorSignatureClassifier } from '@/lib/verifier/modules/SensorSignatureClassifier';
import { TemporalSpatialChecker } from '@/lib/verifier/modules/TemporalSpatialChecker';
import { AnomalyDetector } from '@/lib/verifier/modules/AnomalyDetector';
import { ChallengeResponder } from '@/lib/verifier/modules/ChallengeResponder';
import { CrossModalChecker } from '@/lib/verifier/modules/CrossModalChecker';
import { SensorRegistryManager, InMemoryRegistryStorage } from '@/lib/verifier/modules/SensorRegistry';
import { AuditChainBuilder, generateReproducibilityHash } from '@/lib/verifier/utils/auditChain';
import { createHash } from 'crypto';

export class VerificationEngine {
  private config: VerifierConfig;
  private metadataValidator: MetadataValidator;
  private sensorClassifier: SensorSignatureClassifier;
  private temporalChecker: TemporalSpatialChecker;
  private anomalyDetector: AnomalyDetector;
  private challengeResponder: ChallengeResponder;
  private crossModalChecker: CrossModalChecker;
  private registryManager: SensorRegistryManager;

  constructor(config: Partial<VerifierConfig> = {}) {
    this.config = {
      strictMode: config.strictMode ?? false,
      enabledModules: config.enabledModules ?? ['all'],
      minConfidenceThreshold: config.minConfidenceThreshold ?? 0.7,
      anomalyWeights: config.anomalyWeights ?? {
        critical: 4.0,
        high: 2.0,
        medium: 1.0,
        low: 0.5,
      },
      parallelProcessing: config.parallelProcessing ?? true,
      enableChallengeResponse: config.enableChallengeResponse ?? true,
      enableCrossModal: config.enableCrossModal ?? true,
      enableAuditChain: config.enableAuditChain ?? true,
      enableReputation: config.enableReputation ?? true,
    };

    this.metadataValidator = new MetadataValidator();
    this.sensorClassifier = new SensorSignatureClassifier();
    this.temporalChecker = new TemporalSpatialChecker();
    this.anomalyDetector = new AnomalyDetector();
    this.challengeResponder = new ChallengeResponder();
    this.crossModalChecker = new CrossModalChecker();
    this.registryManager = new SensorRegistryManager(new InMemoryRegistryStorage());
  }

  async verify(
    metadata: DatasetMetadata,
    dataBuffer: Buffer
  ): Promise<VerificationReport> {
    const startTime = Date.now();
    const moduleResults: ModuleResult[] = [];
    const auditChain = new AuditChainBuilder();

    try {
      const inputHash = createHash('sha256').update(dataBuffer).digest('hex');

      // Run core verification modules
      if (this.config.parallelProcessing) {
        const coreResults = await Promise.all([
          this.metadataValidator.validate(metadata, dataBuffer),
          this.sensorClassifier.classify(metadata.declaredSource.sensorTypes, dataBuffer),
          this.anomalyDetector.detect(dataBuffer),
          this.temporalChecker.check({
            timestamps: this.extractTimestamps(dataBuffer),
            frames: [],
          }),
        ]);
        moduleResults.push(...coreResults);
        coreResults.forEach(r => auditChain.recordModuleResult(r));
      } else {
        const results = [
          await this.metadataValidator.validate(metadata, dataBuffer),
          await this.sensorClassifier.classify(metadata.declaredSource.sensorTypes, dataBuffer),
          await this.anomalyDetector.detect(dataBuffer),
          await this.temporalChecker.check({
            timestamps: this.extractTimestamps(dataBuffer),
            frames: [],
          }),
        ];
        moduleResults.push(...results);
        results.forEach(r => auditChain.recordModuleResult(r));
      }

      // Run advanced modules if enabled
      if (this.config.enableChallengeResponse) {
        const challengeResult = await this.challengeResponder.challenge(
          dataBuffer,
          metadata.declaredSource.sensorTypes[0] || 'unknown',
          { timestamps: this.extractTimestamps(dataBuffer) }
        );
        moduleResults.push(challengeResult);
        auditChain.recordModuleResult(challengeResult);
      }

      if (this.config.enableCrossModal && metadata.declaredSource.sensorTypes.length > 1) {
        const sensorStreams = this.parseSensorStreams(metadata, dataBuffer);
        const crossModalResult = await this.crossModalChecker.check(sensorStreams, {});
        moduleResults.push(crossModalResult);
        auditChain.recordModuleResult(crossModalResult);
      }

      // Generate sensor fingerprint and update reputation
      let sensorFingerprint: string | undefined;
      let uploaderReputation;

      if (this.config.enableReputation) {
        const signalCharacteristics = this.extractSignalCharacteristics(dataBuffer);
        sensorFingerprint = this.registryManager.generateFingerprint(metadata, signalCharacteristics);

        // Calculate preliminary verdict for reputation update
        const preliminaryVerdict = this.calculateVerdict(
          moduleResults.reduce((sum, r) => sum + r.score, 0) / moduleResults.length,
          moduleResults.reduce((sum, r) => sum + r.confidence, 0) / moduleResults.length,
          moduleResults.flatMap(r => r.anomalies)
        );

        const registry = await this.registryManager.updateRegistry(
          sensorFingerprint,
          metadata.id,
          metadata.userId,
          preliminaryVerdict,
          moduleResults.reduce((sum, r) => sum + r.confidence, 0) / moduleResults.length,
          metadata
        );

        uploaderReputation = registry.reputation;
      }

      // Generate final report with all enhancements
      const report = this.generateReport(
        metadata,
        moduleResults,
        Date.now() - startTime,
        this.config.enableAuditChain ? auditChain.getChain() : [],
        sensorFingerprint,
        uploaderReputation
      );

      return report;
    } catch (error) {
      console.error('Verification error:', error);

      return {
        datasetId: metadata.id,
        verdict: 'suspicious',
        overallConfidence: 0,
        qualityScore: 0,
        metadataScore: 0,
        sourceMatchScore: 0,
        crossModalScore: 0,
        challengeResponseScore: 0,
        isReupload: false,
        anomaliesDetected: [
          {
            type: 'quality_issue',
            severity: 'critical',
            description: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            confidence: 1.0,
            detectedBy: 'VerificationEngine',
          },
        ],
        moduleResults: [],
        explanation: 'Verification process encountered an error',
        badges: [],
        timestamp: new Date(),
        processingTimeMs: Date.now() - startTime,
        auditChain: [],
        reproducibilityHash: '',
      };
    }
  }

  private generateReport(
    metadata: DatasetMetadata,
    moduleResults: ModuleResult[],
    processingTimeMs: number,
    auditChain: any[] = [],
    sensorFingerprint?: string,
    uploaderReputation?: any
  ): VerificationReport {
    // Calculate aggregate scores
    const avgScore = moduleResults.reduce((sum, r) => sum + r.score, 0) / moduleResults.length;
    const avgConfidence = moduleResults.reduce((sum, r) => sum + r.confidence, 0) / moduleResults.length;

    // Collect all anomalies
    const allAnomalies = moduleResults.flatMap(r => r.anomalies);

    // Calculate weighted anomaly score
    const anomalyPenalty = allAnomalies.reduce((sum, anomaly) => {
      return sum + (this.config.anomalyWeights[anomaly.severity] || 1);
    }, 0);

    // Determine verdict
    const verdict = this.calculateVerdict(avgScore, avgConfidence, allAnomalies);

    // Calculate individual scores
    const metadataScore = moduleResults.find(r => r.moduleName === 'MetadataValidator')?.score || 0;
    const qualityScore = Math.max(0, 10 - anomalyPenalty);
    const sourceMatchScore = moduleResults.find(r => r.moduleName === 'SensorSignatureClassifier')?.score || 0;
    const crossModalScore = moduleResults.find(r => r.moduleName === 'CrossModalChecker')?.score || 0;
    const challengeResponseScore = moduleResults.find(r => r.moduleName === 'ChallengeResponder')?.score || 0;

    // Generate badges
    const badges = this.generateBadges(verdict, avgScore, allAnomalies);

    // Generate explanation
    const explanation = this.generateExplanation(moduleResults, allAnomalies, verdict);

    // Generate reproducibility hash
    const inputHash = createHash('sha256').update(JSON.stringify(metadata)).digest('hex');
    const reproducibilityHash = generateReproducibilityHash(
      metadata.id,
      inputHash,
      moduleResults,
      auditChain
    );

    return {
      datasetId: metadata.id,
      verdict,
      overallConfidence: avgConfidence,
      qualityScore,
      metadataScore,
      sourceMatchScore,
      crossModalScore,
      challengeResponseScore,
      isReupload: false,
      anomaliesDetected: allAnomalies,
      moduleResults,
      explanation,
      badges,
      timestamp: new Date(),
      processingTimeMs,
      auditChain,
      reproducibilityHash,
      sensorFingerprint,
      uploaderReputation,
    };
  }

  private calculateVerdict(
    avgScore: number,
    avgConfidence: number,
    anomalies: any[]
  ): Verdict {
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    const highAnomalies = anomalies.filter(a => a.severity === 'high');

    if (criticalAnomalies.length > 0) return 'synthetic';
    if (highAnomalies.length > 2) return 'likely_synthetic';
    if (avgScore < 5 || avgConfidence < this.config.minConfidenceThreshold) return 'suspicious';
    if (avgScore >= 8 && avgConfidence >= 0.85) return 'authentic';
    return 'likely_authentic';
  }

  private generateBadges(verdict: Verdict, avgScore: number, anomalies: any[]): string[] {
    const badges: string[] = [];

    if (verdict === 'authentic') badges.push('Verified Source');
    if (avgScore >= 9) badges.push('High Fidelity');
    if (anomalies.length === 0) badges.push('No Anomalies');
    if (anomalies.some(a => a.severity === 'critical' || a.severity === 'high')) {
      badges.push('Quality Issues');
    }

    return badges;
  }

  private generateExplanation(
    moduleResults: ModuleResult[],
    anomalies: any[],
    verdict: Verdict
  ): string {
    const parts: string[] = [];

    // Verdict summary
    if (verdict === 'authentic' || verdict === 'likely_authentic') {
      parts.push('Dataset appears authentic with strong verification signals.');
    } else if (verdict === 'suspicious') {
      parts.push('Dataset shows suspicious characteristics requiring manual review.');
    } else {
      parts.push('Dataset likely contains synthetic or tampered data.');
    }

    // Module summaries
    const goodModules = moduleResults.filter(r => r.score >= 7);
    const poorModules = moduleResults.filter(r => r.score < 5);

    if (goodModules.length > 0) {
      parts.push(
        `${goodModules.map(m => m.moduleName).join(', ')} ${goodModules.length === 1 ? 'shows' : 'show'} strong validation.`
      );
    }

    if (poorModules.length > 0) {
      parts.push(
        `${poorModules.map(m => m.moduleName).join(', ')} ${poorModules.length === 1 ? 'raised' : 'raise'} concerns.`
      );
    }

    // Anomaly summary
    if (anomalies.length > 0) {
      const critical = anomalies.filter(a => a.severity === 'critical').length;
      const high = anomalies.filter(a => a.severity === 'high').length;

      if (critical > 0) {
        parts.push(`${critical} critical ${critical === 1 ? 'issue' : 'issues'} detected.`);
      }
      if (high > 0) {
        parts.push(`${high} high-severity ${high === 1 ? 'issue' : 'issues'} found.`);
      }
    }

    return parts.join(' ');
  }

  private extractTimestamps(buffer: Buffer): number[] {
    // Simplified timestamp extraction
    // In production: parse actual data format (ROS bag, HDF5, etc.)

    const count = Math.min(1000, Math.floor(buffer.length / 100));
    const timestamps: number[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      timestamps.push(now - (count - i) * 100); // Simulate 10fps
    }

    return timestamps;
  }

  private parseSensorStreams(
    metadata: DatasetMetadata,
    dataBuffer: Buffer
  ): Array<{
    type: SensorType;
    data: Buffer;
    timestamps: number[];
    metadata?: Record<string, unknown>;
  }> {
    // Simplified multi-sensor stream parsing
    // In production: parse actual multi-modal data formats

    const sensorTypes = metadata.declaredSource.sensorTypes;
    const bytesPerSensor = Math.floor(dataBuffer.length / sensorTypes.length);

    return sensorTypes.map((type, index) => ({
      type,
      data: dataBuffer.slice(index * bytesPerSensor, (index + 1) * bytesPerSensor),
      timestamps: this.extractTimestamps(dataBuffer),
      metadata: {
        gps: metadata.declaredSource.location?.gps,
      },
    }));
  }

  private extractSignalCharacteristics(dataBuffer: Buffer): Record<string, unknown> {
    // Extract statistical characteristics for fingerprinting
    const sample = Array.from(dataBuffer.slice(0, 1000));

    const mean = sample.reduce((a, b) => a + b, 0) / sample.length;
    const variance = sample.reduce((sum, val) => sum + (val - mean) ** 2, 0) / sample.length;
    const stdDev = Math.sqrt(variance);

    const sorted = [...sample].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      mean,
      stdDev,
      median,
      min: Math.min(...sample),
      max: Math.max(...sample),
      sampleSize: sample.length,
    };
  }
}
