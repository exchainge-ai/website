#!/usr/bin/env bun

/**
 * Demo script showing the AI Agent Verifier in action
 */

import { VerificationEngine } from './src/VerificationEngine';
import type { DatasetMetadata } from './src/types';

console.log('🤖 ExchAInge AI Agent Verifier - Demo\n');

// Example 1: Authentic Dataset
console.log('═'.repeat(60));
console.log('Example 1: Verifying Authentic Robot Dataset');
console.log('═'.repeat(60));

const engine = new VerificationEngine({
  strictMode: false,
  parallelProcessing: true,
});

const authenticMetadata: DatasetMetadata = {
  id: 'demo-authentic-001',
  title: 'Boston Dynamics Spot - Warehouse Navigation',
  category: 'robotics',
  declaredSource: {
    robotModel: 'Boston Dynamics Spot',
    sensorTypes: ['camera', 'lidar', 'imu', 'depth'],
    location: {
      gps: [37.7749, -122.4194],
      environment: 'Indoor warehouse',
    },
  },
  fileSize: 1024 * 1024 * 50, // 50MB
  fileFormat: 'rosbag',
  uploadedAt: new Date(),
  userId: 'demo-user',
};

// Create mock authentic sensor data
const authenticData = Buffer.alloc(1024 * 500);
for (let i = 0; i < authenticData.length; i++) {
  // Realistic sensor noise pattern (entropy ~7.5)
  authenticData[i] = Math.floor(Math.random() * 200) + 28;
}

const report1 = await engine.verify(authenticMetadata, authenticData);

console.log(`\n✅ Verdict: ${report1.verdict}`);
console.log(`📊 Confidence: ${(report1.overallConfidence * 100).toFixed(1)}%`);
console.log(`⭐ Quality Score: ${report1.qualityScore.toFixed(1)}/10`);
console.log(`📝 ${report1.explanation}`);
console.log(`🏷️  Badges: ${report1.badges.join('  ')}`);
console.log(`⏱️  Processed in ${report1.processingTimeMs}ms\n`);

// Example 2: Suspicious/Synthetic Dataset
console.log('═'.repeat(60));
console.log('Example 2: Detecting Synthetic Dataset');
console.log('═'.repeat(60));

const syntheticMetadata: DatasetMetadata = {
  id: 'demo-synthetic-002',
  title: 'AI Generated Robot Data',
  category: 'robotics',
  declaredSource: {
    robotModel: 'Generic Robot',
    sensorTypes: ['camera'],
  },
  fileSize: 1024 * 10, // Suspiciously small
  fileFormat: 'unknown',
  uploadedAt: new Date(),
  userId: 'demo-user',
};

// Create obviously synthetic data (too uniform)
const syntheticData = Buffer.alloc(1024 * 10);
for (let i = 0; i < syntheticData.length; i++) {
  syntheticData[i] = i % 2 === 0 ? 0 : 255; // Unrealistic pattern
}

const report2 = await engine.verify(syntheticMetadata, syntheticData);

console.log(`\n⚠️  Verdict: ${report2.verdict}`);
console.log(`📊 Confidence: ${(report2.overallConfidence * 100).toFixed(1)}%`);
console.log(`⭐ Quality Score: ${report2.qualityScore.toFixed(1)}/10`);
console.log(`🚨 Anomalies: ${report2.anomaliesDetected.length} detected`);
report2.anomaliesDetected.slice(0, 3).forEach(a => {
  console.log(`   - [${a.severity}] ${a.description}`);
});
console.log(`📝 ${report2.explanation}`);
console.log(`⏱️  Processed in ${report2.processingTimeMs}ms\n`);

// Example 3: High-Quality Dataset
console.log('═'.repeat(60));
console.log('Example 3: Premium Quality Dataset');
console.log('═'.repeat(60));

const premiumMetadata: DatasetMetadata = {
  id: 'demo-premium-003',
  title: 'Tesla Autopilot - Highway Data Collection',
  category: 'autonomous_vehicles',
  declaredSource: {
    robotModel: 'Tesla Autopilot',
    sensorTypes: ['camera', 'radar', 'gps'],
    location: {
      gps: [34.0522, -118.2437],
      environment: 'Highway I-405',
    },
  },
  fileSize: 1024 * 1024 * 150, // 150MB
  fileFormat: 'hdf5',
  uploadedAt: new Date(),
  userId: 'premium-collector',
};

const premiumData = Buffer.alloc(1024 * 1000);
for (let i = 0; i < premiumData.length; i++) {
  // High-quality sensor pattern
  const noise = (Math.random() - 0.5) * 10;
  const base = 128 + Math.sin(i / 100) * 50;
  premiumData[i] = Math.max(0, Math.min(255, Math.floor(base + noise)));
}

const report3 = await engine.verify(premiumMetadata, premiumData);

console.log(`\n✅ Verdict: ${report3.verdict}`);
console.log(`📊 Confidence: ${(report3.overallConfidence * 100).toFixed(1)}%`);
console.log(`⭐ Quality Score: ${report3.qualityScore.toFixed(1)}/10`);
console.log(`🎯 Source Match: ${report3.sourceMatchScore.toFixed(1)}/10`);
console.log(`📝 ${report3.explanation}`);
console.log(`🏷️  Badges: ${report3.badges.join('  ')}`);
console.log(`⏱️  Processed in ${report3.processingTimeMs}ms\n`);

console.log('═'.repeat(60));
console.log('Demo Complete! 🎉');
console.log('═'.repeat(60));
console.log('\nTo verify your own datasets:');
console.log('  bun run verify ./path/to/dataset.bag');
console.log('  bun run verify ./data/lidar.hdf5 --strict --format json\n');
