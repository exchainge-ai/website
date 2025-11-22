# AI Agent Verifier

Autonomous verification system for physical AI datasets. Validates authenticity, quality, and source provenance of robotics sensor data.

## What it does

The verifier runs multiple analysis modules in parallel to check if a dataset is authentic or synthetic. It looks at metadata consistency, signal characteristics, temporal coherence, and statistical patterns to generate a confidence score.

### Verification modules

1. **Metadata Validator** - Cross-checks declared specs against actual data characteristics
2. **Sensor Signature Classifier** - Fingerprints sensor types based on signal patterns
3. **Temporal & Spatial Checker** - Validates time-series consistency and GPS coherence
4. **Anomaly Detector** - Finds statistical outliers and tamper signatures
5. **Confidence Scorer** - Aggregates results into actionable verdicts

### Detection capabilities

- Synthetic or AI-generated data
- Sensor type mismatches (LiDAR vs camera vs IMU)
- Duplicate or tampered frames
- Temporal gaps, impossible timestamps
- GPS jumps and location drift
- Abnormal entropy and frequency patterns
- Compression artifacts in raw sensor data

## Installation

```bash
cd packages/verifier
bun install
```

## Usage

### CLI

```bash
# Basic verification
bun run verify ./data/robot_dataset.bag

# Strict mode with JSON output
bun run verify ./data/lidar.hdf5 --strict --format json

# Sequential processing (disable parallel)
bun run verify ./data/sensor_log.rosbag --sequential
```

### Programmatic

```typescript
import { VerificationEngine } from '@exchainge/verifier';

const engine = new VerificationEngine({
  strictMode: false,
  parallelProcessing: true,
  minConfidenceThreshold: 0.7,
});

const report = await engine.verify(metadata, dataBuffer);

console.log(report.verdict); // 'authentic' | 'suspicious' | 'synthetic'
console.log(report.overallConfidence); // 0.92
console.log(report.qualityScore); // 9.1/10
```

## Report format

```json
{
  "datasetId": "dataset-123",
  "verdict": "likely_authentic",
  "overallConfidence": 0.92,
  "qualityScore": 9.1,
  "metadataScore": 8.3,
  "sourceMatchScore": 8.7,
  "anomaliesDetected": [
    {
      "type": "temporal_gap",
      "severity": "low",
      "description": "Minor GPS segment missing",
      "confidence": 0.85
    }
  ],
  "explanation": "Dataset appears authentic with strong validation...",
  "processingTimeMs": 1523
}
```

## Architecture

### Modular design

Each module is independent:
- Enable or disable per verification run
- Weight differently based on use case
- Extend with custom logic
- Test in isolation

### Parallel processing

Modules run concurrently by default:

```typescript
const results = await Promise.all([
  metadataValidator.validate(metadata, data),
  sensorClassifier.classify(sensors, data),
  anomalyDetector.detect(data),
  temporalChecker.check(timeSeries),
]);
```

### Extension example

```typescript
class CustomVerifier {
  async verify(data: Buffer): Promise<ModuleResult> {
    return {
      moduleName: 'CustomVerifier',
      score: 8.5,
      confidence: 0.9,
      anomalies: [],
      processingTimeMs: 150,
    };
  }
}
```

## Training data

Calibrate sensor profiles using public datasets:
- KITTI - Autonomous driving
- Waymo Open Dataset - Multi-sensor vehicle data
- nuScenes - Full AV sensor suite
- Argoverse - 3D tracking and forecasting
- OpenLORIS - Robotic scene understanding

## Performance

| Dataset Size | Processing Time | Throughput |
|-------------|----------------|------------|
| < 1MB       | ~50ms          | 20 files/s |
| 1-10MB      | ~100-500ms     | 5-10 files/s |
| 10-100MB    | ~1-3s          | 1-2 files/s |
| > 100MB     | ~3-10s         | Streaming |

Memory: Streaming analysis for files > 10MB to keep usage low.

## Production deployment

Recommended stack:

**Queue**: Kafka or Redis for job distribution
**Storage**: S3, IPFS, or Arweave for datasets
**Database**: PostgreSQL for metadata and reports
**Compute**: Async workers with horizontal scaling
**Cache**: Redis for frequently accessed data

### Scaling strategy

1. Queue incoming datasets via Kafka/Redis
2. Spin up worker pods (Kubernetes or Railway)
3. Workers pull from queue, verify, write results
4. Auto-scale based on queue depth

See ARCHITECTURE.md for detailed deployment guide.

## Integration with marketplace

The verifier integrates into the upload flow:

```typescript
// In upload handler
const verifier = new VerificationEngine();
const report = await verifier.verify(metadata, dataBuffer);

if (report.verdict === 'authentic' && report.overallConfidence > 0.85) {
  await dataset.update({ status: 'verified', verificationScore: report.qualityScore });
} else {
  await dataset.update({ status: 'pending_review', verificationReport: report });
}
```

## License

Part of the ExchAInge platform.
