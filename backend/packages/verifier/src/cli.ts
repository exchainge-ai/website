#!/usr/bin/env bun

/**
 * CLI tool for dataset verification
 * Usage: bun run verify <dataset-path> [options]
 */

import { readFile } from 'node:fs/promises';
import { VerificationEngine } from './VerificationEngine';
import type { DatasetMetadata } from './types';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
ExchAInge AI Agent Verifier CLI

Usage:
  bun run verify <dataset-path> [options]

Options:
  --strict          Enable strict mode (higher confidence threshold)
  --parallel        Enable parallel module processing (default)
  --sequential      Disable parallel processing
  --format <type>   Output format: json | text (default: text)
  --help            Show this help message

Examples:
  bun run verify ./data/robot_dataset.bag
  bun run verify ./data/lidar.hdf5 --strict --format json
    `);
    process.exit(0);
  }

  const datasetPath = args[0];
  const strictMode = args.includes('--strict');
  const parallelProcessing = !args.includes('--sequential');
  const format = args.includes('--format') ?
    args[args.indexOf('--format') + 1] : 'text';

  console.log(`🔍 Verifying dataset: ${datasetPath}\n`);

  try {
    // Read dataset file
    const dataBuffer = await readFile(datasetPath);

    // Create mock metadata (in production, extract from file or database)
    const metadata: DatasetMetadata = {
      id: `verify-${Date.now()}`,
      title: datasetPath.split('/').pop() || 'Unknown',
      category: 'robotics',
      declaredSource: {
        robotModel: 'Unknown',
        sensorTypes: ['camera', 'imu'],
      },
      fileSize: dataBuffer.length,
      fileFormat: datasetPath.split('.').pop() || 'unknown',
      uploadedAt: new Date(),
      userId: 'cli-user',
    };

    // Initialize verification engine
    const engine = new VerificationEngine({
      strictMode,
      parallelProcessing,
      minConfidenceThreshold: strictMode ? 0.85 : 0.7,
    });

    // Run verification
    const report = await engine.verify(metadata, dataBuffer);

    // Output results
    if (format === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printTextReport(report);
    }

    // Exit with appropriate code
    const exitCode = report.verdict === 'authentic' || report.verdict === 'likely_authentic' ? 0 : 1;
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Verification failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printTextReport(report: any) {
  console.log('═'.repeat(60));
  console.log('  VERIFICATION REPORT');
  console.log('═'.repeat(60));
  console.log();

  // Verdict
  const verdictSymbol = {
    authentic: '✅',
    likely_authentic: '✓',
    suspicious: '⚠️',
    likely_synthetic: '⚠️',
    synthetic: '❌',
    tampered: '❌',
  }[report.verdict] || '?';

  console.log(`Verdict: ${verdictSymbol} ${report.verdict.toUpperCase().replace('_', ' ')}`);
  console.log(`Confidence: ${(report.overallConfidence * 100).toFixed(1)}%`);
  console.log();

  // Scores
  console.log('Scores:');
  console.log(`  Quality:       ${report.qualityScore.toFixed(1)}/10`);
  console.log(`  Metadata:      ${report.metadataScore.toFixed(1)}/10`);
  console.log(`  Source Match:  ${report.sourceMatchScore.toFixed(1)}/10`);
  console.log();

  // Badges
  if (report.badges.length > 0) {
    console.log('Badges:', report.badges.join('  '));
    console.log();
  }

  // Anomalies
  if (report.anomaliesDetected.length > 0) {
    console.log(`Anomalies Detected: ${report.anomaliesDetected.length}`);
    console.log('─'.repeat(60));

    const grouped = report.anomaliesDetected.reduce((acc: any, anomaly: any) => {
      acc[anomaly.severity] = acc[anomaly.severity] || [];
      acc[anomaly.severity].push(anomaly);
      return acc;
    }, {});

    for (const severity of ['critical', 'high', 'medium', 'low']) {
      if (grouped[severity]) {
        grouped[severity].forEach((anomaly: any) => {
          const symbol = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '⚪',
          }[severity];
          console.log(`  ${symbol} [${severity.toUpperCase()}] ${anomaly.description}`);
        });
      }
    }
    console.log();
  }

  // Explanation
  console.log('Explanation:');
  console.log(`  ${report.explanation}`);
  console.log();

  // Module Results
  console.log('Module Results:');
  console.log('─'.repeat(60));
  report.moduleResults.forEach((result: any) => {
    const scoreBar = '█'.repeat(Math.round(result.score)) + '░'.repeat(10 - Math.round(result.score));
    console.log(`  ${result.moduleName.padEnd(30)} ${scoreBar} ${result.score.toFixed(1)}/10`);
  });
  console.log();

  // Processing time
  console.log(`Processed in ${report.processingTimeMs}ms`);
  console.log('═'.repeat(60));
}

main();
