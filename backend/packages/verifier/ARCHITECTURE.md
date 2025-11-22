# Architecture

## System overview

The verifier is a multi-module pipeline that checks dataset authenticity. Each module analyzes different aspects of the data and outputs a score. The engine aggregates these scores into a final verdict.

## Core components

```
VerificationEngine
├── MetadataValidator
├── SensorSignatureClassifier
├── TemporalSpatialChecker
├── AnomalyDetector
├── ChallengeResponder (active verification)
├── CrossModalChecker (multi-sensor alignment)
└── SensorRegistryManager (reputation tracking)
```

All modules run in parallel by default. The engine collects results, weights anomalies, and generates a tamper-proof report with audit chain.

## Module details

### MetadataValidator

Checks if declared metadata matches actual data characteristics.

**Checks**:
- Robot model exists in known models database
- Declared sensors match robot specs
- File format is reasonable for category
- File size is plausible (not 100 bytes, not 100TB)
- Timestamps are valid (not in future, not from 1970)

**Scoring**: Starts at 10, deducts points for each anomaly based on severity.

**Example output**:
```typescript
{
  score: 8.3,
  confidence: 0.9,
  anomalies: [
    { type: 'metadata_mismatch', severity: 'low', description: 'Unknown robot model' }
  ]
}
```

### SensorSignatureClassifier

Fingerprints sensor types based on signal characteristics.

**Methods**:
- Shannon entropy calculation (real sensors: 6-8 bits)
- Noise floor estimation (LiDAR: ~0.02, camera: ~0.05)
- Spectral peak detection (IMU has peaks at 50/100/200 Hz)
- Pattern matching against known sensor profiles

**Synthetic detection**:
- Entropy too low (< 5) or too high (> 8.5)
- Perfect periodicity (repeating 10-byte sequences)
- Missing natural noise characteristics

**Example**:
```typescript
// Real camera data
{ entropy: 7.2, noiseFloor: 0.05 }

// Synthetic data
{ entropy: 3.1, noiseFloor: 0.001 } // Too clean, likely fake
```

### TemporalSpatialChecker

Validates time-series consistency and spatial coherence.

**Temporal checks**:
- Frame rate consistency (if expected FPS is 30, actual should be 28-32)
- Gap detection (intervals > 2x expected)
- Duplicate timestamps
- Time going backwards
- Timestamps in future or distant past

**Spatial checks** (if GPS available):
- GPS jumps > 1km between frames (impossible at normal speeds)
- Stuck GPS (all coordinates identical)
- Trajectory plausibility

**Implementation**:
```typescript
// Check frame intervals
for (let i = 1; i < timestamps.length; i++) {
  const interval = timestamps[i] - timestamps[i - 1];
  if (interval > expectedInterval * 2) gaps.push(i);
  if (interval < 0) gaps.push(i); // Time going backwards
}
```

### AnomalyDetector

Finds statistical outliers and tamper signatures.

**Techniques**:
- 3-sigma outlier detection
- Entropy distribution analysis
- Frequency domain pattern detection (FFT)
- Compression artifact detection (JPEG/PNG headers in raw data)
- Data distribution checks (too many zeros or 255s)

**Tamper signatures**:
- Suspiciously aligned data (30% zeros)
- Missing natural variations
- Re-encoding markers
- Artificial periodicity

### ChallengeResponder

Active verification through zero-knowledge challenge-response tests. Adversaries can simulate noise and metadata, but struggle to maintain consistency under perturbations.

**Challenge types**:

1. **Perturbation test**: Apply small random jitter to signal, measure entropy drift
   - Real sensors: entropy drift < 0.5 bits
   - Synthetic: entropy can shift significantly (hidden patterns exposed)

2. **Compression test**: Compress/decompress at low quality, analyze artifacts
   - Real camera: artifact score 0.05-0.15, compression ratio 0.1-0.3
   - AI-generated: often too clean or too messy

3. **Noise injection**: Add Gaussian noise, measure SNR degradation
   - Real sensors: SNR degrades predictably (15-40 dB range)
   - Synthetic: SNR behaves inconsistently

4. **Temporal shift**: Shift all timestamps, verify relative intervals unchanged
   - Real data: intervals remain constant
   - Manipulated: intervals may change unexpectedly

**Implementation**:
```typescript
const challengeResult = await challengeResponder.challenge(
  dataBuffer,
  sensorType,
  { timestamps }
);

// Example output
{
  tests: [
    { type: 'perturbation', passed: true, confidence: 0.92 },
    { type: 'compression', passed: true, confidence: 0.85 },
    { type: 'noise_injection', passed: true, confidence: 0.88 },
    { type: 'temporal_shift', passed: true, confidence: 0.95 }
  ],
  score: 9.0,
  passRate: 1.0
}
```

### CrossModalChecker

Validates consistency across multiple sensor modalities. Real multi-sensor data has tight temporal and semantic coupling; synthetic datasets often fail cross-modal alignment.

**Alignment checks**:

1. **Temporal alignment**: Check timestamp overlap and frame rate consistency
   - Calculates overlap ratio and density similarity
   - Flags misaligned time ranges

2. **Spatial alignment**: Verify GPS consistency for co-located sensors
   - Sensors on same platform should be < 10m apart
   - Flags coordinate mismatches

3. **Embedding distance**: Semantic similarity using statistical features
   - Extract feature vectors from each modality
   - Calculate cosine similarity
   - High distance indicates inconsistent data

4. **Cross-correlation**: For expected-correlated sensors (camera-depth, GPS-IMU)
   - Measures signal correlation
   - Flags missing expected correlation

**Example**:
```typescript
const sensorStreams = [
  { type: 'camera', data: cameraBuffer, timestamps: ts1 },
  { type: 'lidar', data: lidarBuffer, timestamps: ts2 },
];

const result = await crossModalChecker.check(sensorStreams, {});

// Output
{
  alignments: [
    {
      modality1: 'camera',
      modality2: 'lidar',
      temporalAlignment: 0.95,
      embeddingDistance: 0.12,
      consistencyScore: 0.88
    }
  ],
  score: 8.8
}
```

### SensorRegistryManager

Tracks sensor fingerprints and uploader reputation over time. Shifts verifier from stateless tool to intelligent watchdog that learns.

**Fingerprinting**:
- Generates unique hash from robot model, sensors, hardware specs, and signal characteristics
- Same physical sensor produces same fingerprint
- Different sensors or manipulated data produce different fingerprints

**Reputation scoring**:
```typescript
{
  sensorFingerprint: "a3f2e1c9b4d8",
  uploaderId: "user123",
  uploadCount: 47,
  avgConfidence: 0.87,
  syntheticRate: 0.04,  // 4% synthetic detections
  anomalyRate: 0.08,    // 8% anomalies total
  reputationGrade: "A",
  flags: [],
  firstSeenAt: "2025-01-15",
  lastSeenAt: "2025-10-19"
}
```

**Reputation grades**:
- A+/A: Highly trustworthy (< 5% synthetic, > 85% confidence)
- B+/B: Generally reliable (< 15% synthetic, > 65% confidence)
- C: Moderate concerns (< 35% synthetic, > 50% confidence)
- D/F: Suspicious or unreliable

**Pattern detection**:
- Rapid burst uploads (> 10 in < 1 hour)
- Bot-like regular intervals (very low variance)
- Sudden quality drops (possible account compromise)

**Usage**:
```typescript
const registry = await registryManager.updateRegistry(
  fingerprint,
  datasetId,
  uploaderId,
  verdict,
  confidence,
  metadata
);

// Check uploader profile
const profile = await registryManager.getUploaderProfile(uploaderId);
// { totalSensors: 3, totalUploads: 52, avgReputation: "A", flags: [] }
```

## Scoring system

### Individual scores

Each module outputs 0-10:
- 10: Perfect, no issues
- 8-9: Minor anomalies
- 5-7: Moderate concerns
- 3-4: Significant issues
- 0-2: Critical failures

### Aggregate score

```
overallScore = avg(moduleScores) - weightedAnomalyPenalty

weights:
  critical: 4.0
  high: 2.0
  medium: 1.0
  low: 0.5
```

### Verdict logic

```typescript
if (criticalAnomalies > 0) return 'synthetic';
if (highAnomalies > 2) return 'likely_synthetic';
if (score < 5 || confidence < threshold) return 'suspicious';
if (score >= 8 && confidence >= 0.85) return 'authentic';
return 'likely_authentic';
```

## Performance

Processing time depends on dataset size and enabled modules:

| Size | Time | Notes |
|------|------|-------|
| < 1MB | ~50ms | All modules, full analysis |
| 1-10MB | ~500ms | All modules, sampling starts at 5MB |
| 10-100MB | ~2s | Streaming analysis, sample every 10th frame |
| > 100MB | ~5-10s | Aggressive sampling, cache results |

Memory usage stays under 500MB even for large files due to streaming.

## Deployment architecture

### Basic setup (single worker)

```
Upload -> API -> Verifier -> Database
```

Simple. Good for < 100 datasets/day.

### Production setup (queue + workers)

```
Upload -> API -> Kafka/Redis -> Workers -> Database
                                  ↓
                              Auto-scale based on queue depth
```

Workers pull jobs from queue, verify, write results. Scale horizontally.

### Infrastructure requirements

**Queue**: Redis Streams or Kafka
- Redis: Simpler, good for < 10k msgs/sec
- Kafka: More complex, handles millions/sec

**Workers**: Stateless Node/Bun processes
- CPU: 1-2 cores per worker
- Memory: 512MB-1GB per worker
- Scaling: 1 worker per 10 datasets in queue

**Database**: PostgreSQL
- Store verification reports
- Index on dataset_id, verdict, timestamp
- Keep reports for audit trail

**Object Storage**: S3/R2/Backblaze
- Store original datasets
- Verifier reads from URLs
- Don't store in DB (too large)

## Integration points

### Upload flow

```typescript
// packages/webapp/src/app/api/upload/route.ts
import { VerificationEngine } from '@exchainge/verifier';

export async function POST(req: Request) {
  const file = await req.formData();
  const metadata = extractMetadata(file);

  // Run verification
  const verifier = new VerificationEngine();
  const report = await verifier.verify(metadata, file.buffer);

  // Update dataset status based on verdict
  if (report.verdict === 'authentic' && report.overallConfidence > 0.85) {
    await db.datasets.update({
      id: metadata.id,
      status: 'verified',
      verificationScore: report.qualityScore
    });
  } else {
    await db.datasets.update({
      id: metadata.id,
      status: 'pending_review',
      verificationReport: JSON.stringify(report)
    });
  }

  return Response.json({ success: true, report });
}
```

### Background job (recommended for production)

```typescript
// packages/webapp/src/workers/verifier.ts
import { VerificationEngine } from '@exchainge/verifier';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const verifier = new VerificationEngine();

async function processJob(job) {
  const { datasetId, storageUrl } = job;

  // Fetch dataset from storage
  const response = await fetch(storageUrl);
  const buffer = await response.arrayBuffer();

  // Get metadata from database
  const metadata = await db.datasets.findById(datasetId);

  // Run verification
  const report = await verifier.verify(metadata, Buffer.from(buffer));

  // Save results
  await db.verificationReports.create({
    datasetId,
    verdict: report.verdict,
    confidence: report.overallConfidence,
    report: JSON.stringify(report),
  });

  await db.datasets.update({
    id: datasetId,
    status: report.verdict === 'authentic' ? 'verified' : 'pending_review',
  });
}

// Worker loop
while (true) {
  const job = await redis.lpop('verification:queue');
  if (job) {
    await processJob(JSON.parse(job));
  } else {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

## Training and calibration

### Sensor profile calibration

Update sensor profiles in `SensorSignatureClassifier.ts` based on real data:

```typescript
// Analyze known-good dataset
const samples = loadKnownGoodDataset('kitti-camera-01.bag');
const entropy = calculateEntropy(samples);
const noiseFloor = estimateNoiseFloor(samples);

// Update profile
sensorProfiles.set('camera', {
  entropy: 7.2,  // from analysis
  noiseFloor: 0.048  // from analysis
});
```

### Recommended datasets for training

**KITTI** (autonomous driving):
- Download: http://www.cvlibs.net/datasets/kitti/
- Formats: Velodyne LiDAR, stereo cameras, GPS/IMU
- Use for: LiDAR and camera profile calibration

**Waymo Open Dataset**:
- Download: https://waymo.com/open/
- Formats: LiDAR, camera, synchronized
- Use for: Multi-sensor temporal coherence baselines

**nuScenes**:
- Download: https://www.nuscenes.org/
- Formats: Full sensor suite
- Use for: Comprehensive sensor profile library

**Argoverse**:
- Download: https://www.argoverse.org/
- Formats: HD maps + sensor data
- Use for: GPS trajectory validation

### Calibration process

1. Download representative datasets
2. Run verifier in calibration mode (disable anomaly detection)
3. Collect entropy, noise, and spectral data
4. Update sensor profiles in classifier
5. Re-run verifier, adjust thresholds until false positive rate < 5%

## Error handling

### Module failures

If a module crashes, others continue. Partial results still generate a report:

```typescript
try {
  results.push(await metadataValidator.validate(metadata, data));
} catch (error) {
  console.error('Metadata validation failed:', error);
  results.push({
    moduleName: 'MetadataValidator',
    score: 0,
    confidence: 0,
    anomalies: [{
      type: 'quality_issue',
      severity: 'critical',
      description: 'Module failed',
      confidence: 1.0
    }],
    processingTimeMs: 0
  });
}
```

### Resource limits

Set timeouts and memory limits per verification:

```typescript
const engine = new VerificationEngine({
  timeout: 30000, // 30 second max
  maxMemory: 1024 * 1024 * 512, // 512MB max
});
```

If limits hit, return partial results with warning.

## Monitoring

### Key metrics to track

- Throughput (datasets/minute)
- Average processing time
- Verdicts distribution (authentic/suspicious/synthetic %)
- Anomaly rates per module
- Error rates

### Alerts

Set up alerts for:
- Processing time > 10s (slow performance)
- Confidence < 0.5 on authed datasets (possible false positive)
- Error rate > 5% (system issue)
- Queue depth > 1000 (backlog forming)

## Audit chain and reproducibility

Every verification generates a tamper-proof audit chain with hash tree for on-chain verification.

**Audit transcript**:
```typescript
{
  auditChain: [
    {
      stepId: "MetadataValidator-1729350000123",
      module: "MetadataValidator",
      inputHash: "a3f2e1...",
      preconditions: { sensorTypes: ["camera", "lidar"] },
      output: { score: 8.5, anomalies: [] },
      timestamp: 1729350000123,
      durationMs: 45
    },
    // ... more steps
  ],
  reproducibilityHash: "b7c4d2e9...",
  merkleRoot: "f1a8c3b5..."
}
```

**Reproducibility features**:
- Each anomaly includes `detectedBy` module name
- Optional `rawSignalFragmentUrl` for S3/IPFS evidence storage
- `visualizationBase64` with mini-chart (ASCII sparkline)
- Merkle tree root for efficient on-chain storage

**Replay verification**:
```typescript
// Export audit chain for external verification
const replayData = auditChain.exportForReplay();

// Verify specific step
const isValid = auditChain.verifyStep(2, expectedHash);

// Generate on-chain proof
const proof = auditChain.generateReproducibilityProof();
// { merkleRoot, chainLength, totalDuration, stepHashes }
```

## Advanced features

### Embedding models for production

Current implementation uses statistical features. For production, integrate:

**Vision models**:
- CLIP: Camera ⬄ LiDAR semantic alignment
- DINOv2: Self-supervised image features
- Segment Anything: Object-level consistency checks

**Point cloud models**:
- PointNet/PointNet++: LiDAR embedding extraction
- MinkowskiNet: Sparse 3D convolutions

**Time series models**:
- BERT-style encoders: IMU/GPS sequence embeddings
- Temporal CNNs: Motion pattern recognition

**Integration example**:
```typescript
// packages/verifier/src/models/CLIPEmbedder.ts
import { pipeline } from '@xenova/transformers';

const clipModel = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');

async function embedImage(imageBuffer: Buffer): Promise<number[]> {
  const result = await clipModel(imageBuffer);
  return result.embeddings;
}
```

### Challenge-response with TEE/ZK integration

For maximum trust, run challenges inside Trusted Execution Environments:

```typescript
// Run perturbation test in SGX enclave
const attestation = await teeExecute({
  code: challengeResponder.runPerturbationTest,
  data: dataBuffer,
  attestationKey: process.env.SGX_KEY
});

// Attach TEE attestation to report
report.teeAttestation = attestation.signature;
```

Or use zero-knowledge proofs:

```typescript
// Prove "entropy is within expected range" without revealing data
const zkProof = await generateZKProof({
  statement: "entropy ∈ [6.0, 8.0]",
  witness: actualEntropy,
  circuit: entropyCircuit
});

report.zkProofs.push(zkProof);
```

### Model suggestions by use case

| Use case | Model | Purpose |
|----------|-------|---------|
| Camera ⬄ LiDAR alignment | CLIP, OWL-ViT | Cross-modal semantic consistency |
| Image anomaly detection | DINOv2, Segment Anything | Self-supervised feature extraction |
| Point cloud features | PointNet, MinkowskiNet | LiDAR embedding generation |
| Time series patterns | TSFresh + XGBoost, LSTMs | IMU/GPS sequence validation |
| Noise detection | Autoencoders, Isolation Forests | Synthetic pattern identification |
| Embedding search | FAISS + custom encoders | Fast similarity lookup |

## Next steps

1. **Integrate into upload flow** - Add verifier to POST /api/upload
2. **Set up background workers** - Use Redis or Kafka for queue
3. **Calibrate sensor profiles** - Download KITTI/Waymo, run calibration
4. **Deploy registry storage** - Use Redis or PostgreSQL for reputation tracking
5. **Monitor and tune** - Collect metrics, adjust thresholds
6. **Scale horizontally** - Add workers as volume grows
7. **Add ML models** - Integrate CLIP/DINOv2 for production-grade cross-modal checks
