/**
 * Core types for AI Agent Verifier
 */

export type DatasetCategory =
  | 'robotics'
  | 'autonomous_vehicles'
  | 'drone'
  | 'manipulation'
  | 'sensor_data'
  | 'motion_capture'
  | 'human_robot_interaction'
  | 'embodied_ai';

export type SensorType =
  | 'lidar'
  | 'camera'
  | 'imu'
  | 'gps'
  | 'radar'
  | 'depth'
  | 'thermal'
  | 'ultrasonic';

export type Verdict =
  | 'authentic'
  | 'likely_authentic'
  | 'suspicious'
  | 'likely_synthetic'
  | 'synthetic'
  | 'tampered';

export interface DatasetMetadata {
  id: string;
  title: string;
  category: DatasetCategory;
  declaredSource: {
    robotModel?: string;
    sensorTypes: SensorType[];
    location?: {
      gps?: [number, number];
      environment?: string;
    };
    timestamp?: Date;
    hardwareSpecs?: Record<string, unknown>;
  };
  fileSize: number;
  fileFormat: string;
  uploadedAt: Date;
  userId: string;
}

export interface VerificationAnomaly {
  type: 'metadata_mismatch' | 'temporal_gap' | 'spatial_inconsistency' | 'duplicate_frames' | 'sensor_mismatch' | 'quality_issue' | 'tamper_detected' | 'cross_modal_inconsistency' | 'challenge_failure' | 'embedding_outlier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedFrames?: number[];
  confidence: number;
  detectedBy: string;
  rawSignalFragmentUrl?: string;
  visualizationBase64?: string;
}

export interface ModuleResult {
  moduleName: string;
  score: number; // 0-10
  confidence: number; // 0-1
  anomalies: VerificationAnomaly[];
  metadata?: Record<string, unknown>;
  processingTimeMs: number;
  inputHash?: string;
  preconditions?: Record<string, unknown>;
  intermediateOutputs?: Record<string, unknown>;
}

export interface VerificationReport {
  datasetId: string;
  verdict: Verdict;
  overallConfidence: number; // 0-1
  qualityScore: number; // 0-10
  metadataScore: number; // 0-10
  sourceMatchScore: number; // 0-10
  crossModalScore: number; // 0-10
  challengeResponseScore: number; // 0-10
  isReupload: boolean;
  anomaliesDetected: VerificationAnomaly[];
  moduleResults: ModuleResult[];
  explanation: string;
  badges: string[];
  timestamp: Date;
  processingTimeMs: number;
  auditChain: ComputeTranscript[];
  reproducibilityHash: string;
  sensorFingerprint?: string;
  uploaderReputation?: ReputationScore;
}

export interface ComputeTranscript {
  stepId: string;
  module: string;
  inputHash: string;
  preconditions: Record<string, unknown>;
  output: Record<string, unknown>;
  score: number;
  timestamp: number;
  durationMs: number;
}

export interface ReputationScore {
  sensorFingerprint: string;
  uploaderId: string;
  uploadCount: number;
  avgConfidence: number;
  syntheticRate: number;
  anomalyRate: number;
  reputationGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  flags: string[];
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface SensorRegistry {
  fingerprint: string;
  metadata: {
    robotModel?: string;
    sensorTypes: SensorType[];
    hardwareSignature?: string;
  };
  statistics: {
    totalDatasets: number;
    authenticity: {
      authentic: number;
      suspicious: number;
      synthetic: number;
    };
    avgQualityScore: number;
    avgConfidence: number;
  };
  reputation: ReputationScore;
  history: {
    datasetId: string;
    timestamp: Date;
    verdict: Verdict;
    confidence: number;
  }[];
}

export interface ChallengeTest {
  type: 'perturbation' | 'compression' | 'temporal_shift' | 'noise_injection';
  parameters: Record<string, unknown>;
  expectedBehavior: string;
  actualResponse: Record<string, unknown>;
  passed: boolean;
  confidence: number;
}

export interface CrossModalAlignment {
  modality1: SensorType;
  modality2: SensorType;
  embeddingDistance: number;
  temporalAlignment: number;
  spatialAlignment: number;
  consistencyScore: number; // 0-1
  anomalies: string[];
}

export interface VerifierConfig {
  strictMode: boolean;
  enabledModules: string[];
  minConfidenceThreshold: number;
  anomalyWeights: Record<string, number>;
  parallelProcessing: boolean;
  sampleRate?: number; // For large datasets, sample every Nth frame
  enableChallengeResponse: boolean;
  enableCrossModal: boolean;
  enableAuditChain: boolean;
  enableReputation: boolean;
}
