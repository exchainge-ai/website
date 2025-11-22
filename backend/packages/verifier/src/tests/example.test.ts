import { describe, expect, test } from 'bun:test';
import { VerificationEngine } from '../VerificationEngine';
import type { DatasetMetadata } from '../types';

describe('VerificationEngine', () => {
  test('should verify authentic dataset', async () => {
    const engine = new VerificationEngine({
      strictMode: false,
      parallelProcessing: true,
    });

    const metadata: DatasetMetadata = {
      id: 'test-dataset-1',
      title: 'Sample Robot Dataset',
      category: 'robotics',
      declaredSource: {
        robotModel: 'Boston Dynamics Spot',
        sensorTypes: ['camera', 'lidar', 'imu'],
      },
      fileSize: 1024 * 1024 * 5, // 5MB
      fileFormat: 'rosbag',
      uploadedAt: new Date(),
      userId: 'test-user',
    };

    // Create mock sensor data (simplified)
    const mockData = Buffer.alloc(1024 * 100);
    // Fill with pseudo-random data to simulate real sensor readings
    for (let i = 0; i < mockData.length; i++) {
      mockData[i] = Math.floor(Math.random() * 256);
    }

    const report = await engine.verify(metadata, mockData);

    expect(report.datasetId).toBe('test-dataset-1');
    expect(report.verdict).toBeDefined();
    expect(report.overallConfidence).toBeGreaterThanOrEqual(0);
    expect(report.overallConfidence).toBeLessThanOrEqual(1);
    expect(report.moduleResults.length).toBeGreaterThan(0);
  });

  test('should detect suspicious data', async () => {
    const engine = new VerificationEngine({
      strictMode: true,
      minConfidenceThreshold: 0.85,
    });

    const metadata: DatasetMetadata = {
      id: 'test-suspicious',
      title: 'Suspicious Dataset',
      category: 'robotics',
      declaredSource: {
        robotModel: 'Unknown Model',
        sensorTypes: ['camera'],
      },
      fileSize: 100, // Suspiciously small
      fileFormat: 'unknown',
      uploadedAt: new Date(),
      userId: 'test-user',
    };

    // Create suspicious data (all zeros)
    const suspiciousData = Buffer.alloc(100);

    const report = await engine.verify(metadata, suspiciousData);

    expect(report.anomaliesDetected.length).toBeGreaterThan(0);
    expect(['suspicious', 'likely_synthetic', 'synthetic']).toContain(report.verdict);
  });
});
