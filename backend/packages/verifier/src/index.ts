/**
 * ExchAInge AI Agent Verifier
 * Production-ready dataset verification system for physical AI data
 */

export { VerificationEngine } from './VerificationEngine';
export { MetadataValidator } from './modules/MetadataValidator';
export { SensorSignatureClassifier } from './modules/SensorSignatureClassifier';
export { TemporalSpatialChecker } from './modules/TemporalSpatialChecker';
export { AnomalyDetector } from './modules/AnomalyDetector';
export { ChallengeResponder } from './modules/ChallengeResponder';
export { CrossModalChecker } from './modules/CrossModalChecker';
export { SensorRegistryManager, InMemoryRegistryStorage } from './modules/SensorRegistry';

export type {
  DatasetMetadata,
  VerificationReport,
  VerifierConfig,
  Verdict,
  ModuleResult,
  VerificationAnomaly,
  SensorType,
  DatasetCategory,
  ComputeTranscript,
  ReputationScore,
  SensorRegistry,
  ChallengeTest,
  CrossModalAlignment,
} from './types';
