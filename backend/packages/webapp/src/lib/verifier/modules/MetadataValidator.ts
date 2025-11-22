/**
 * Metadata Validator Module
 * Validates declared metadata against actual dataset characteristics
 */

import type { DatasetMetadata, ModuleResult, VerificationAnomaly } from '../types';

export class MetadataValidator {
  private knownRobotModels = new Map<string, {
    sensors: string[];
    typicalResolution?: string;
    frameRate?: number;
  }>([
    ['DJI Mavic 3', { sensors: ['camera', 'gps', 'imu'], typicalResolution: '5472x3648', frameRate: 30 }],
    ['Boston Dynamics Spot', { sensors: ['camera', 'lidar', 'imu', 'depth'], frameRate: 30 }],
    ['Tesla Autopilot', { sensors: ['camera', 'radar', 'ultrasonic', 'gps'], frameRate: 36 }],
    ['Unitree Go1', { sensors: ['camera', 'imu', 'depth'] }],
  ]);

  async validate(
    metadata: DatasetMetadata,
    datasetBuffer: Buffer
  ): Promise<ModuleResult> {
    const startTime = Date.now();
    const anomalies: VerificationAnomaly[] = [];

    // Check if declared robot model is known
    const robotModel = metadata.declaredSource.robotModel;
    if (robotModel && !this.knownRobotModels.has(robotModel)) {
      anomalies.push({
        type: 'metadata_mismatch',
        severity: 'low',
        description: `Unknown robot model: ${robotModel}`,
        confidence: 0.7,
      });
    }

    // Validate sensor types match known robot
    if (robotModel) {
      const knownSpecs = this.knownRobotModels.get(robotModel);
      if (knownSpecs) {
        const declaredSensors = metadata.declaredSource.sensorTypes;
        const missingSensors = knownSpecs.sensors.filter(
          s => !declaredSensors.includes(s as any)
        );

        if (missingSensors.length > 0) {
          anomalies.push({
            type: 'sensor_mismatch',
            severity: 'medium',
            description: `Expected sensors not declared: ${missingSensors.join(', ')}`,
            confidence: 0.85,
          });
        }
      }
    }

    // Validate file format consistency
    const validFormats = ['rosbag', 'hdf5', 'parquet', 'tfrecord', 'json', 'csv'];
    if (!validFormats.some(f => metadata.fileFormat.toLowerCase().includes(f))) {
      anomalies.push({
        type: 'metadata_mismatch',
        severity: 'low',
        description: `Unusual file format: ${metadata.fileFormat}`,
        confidence: 0.6,
      });
    }

    // Check file size reasonableness
    const sizeMB = metadata.fileSize / (1024 * 1024);
    if (sizeMB < 1) {
      anomalies.push({
        type: 'quality_issue',
        severity: 'high',
        description: 'Dataset suspiciously small (< 1MB)',
        confidence: 0.9,
      });
    } else if (sizeMB > 100000) {
      anomalies.push({
        type: 'quality_issue',
        severity: 'low',
        description: 'Dataset extremely large (> 100GB), verify authenticity',
        confidence: 0.5,
      });
    }

    // Calculate score based on anomalies
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const highCount = anomalies.filter(a => a.severity === 'high').length;
    const mediumCount = anomalies.filter(a => a.severity === 'medium').length;

    let score = 10;
    score -= criticalCount * 4;
    score -= highCount * 2;
    score -= mediumCount * 1;
    score = Math.max(0, Math.min(10, score));

    const confidence = anomalies.length === 0 ? 0.95 :
                       anomalies.length <= 2 ? 0.75 : 0.5;

    return {
      moduleName: 'MetadataValidator',
      score,
      confidence,
      anomalies,
      metadata: {
        declaredRobotModel: robotModel,
        sensorCount: metadata.declaredSource.sensorTypes.length,
        fileSizeMB: sizeMB,
      },
      processingTimeMs: Date.now() - startTime,
    };
  }
}
