/**
 * Verifiable Compute Transcript & Reproducibility
 *
 * Creates tamper-proof audit chains for verification decisions.
 * Enables post-facto audits, trustless verification challenges, and on-chain scoring.
 */

import { createHash } from 'crypto';
import type { ComputeTranscript, ModuleResult } from '../types';

export class AuditChainBuilder {
  private chain: ComputeTranscript[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Record a computation step in the audit chain
   */
  recordStep(
    module: string,
    input: unknown,
    preconditions: Record<string, unknown>,
    output: Record<string, unknown>,
    score: number
  ): void {
    const timestamp = Date.now();
    const inputHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');

    const step: ComputeTranscript = {
      stepId: `${module}-${timestamp}`,
      module,
      inputHash,
      preconditions,
      output,
      score,
      timestamp,
      durationMs: timestamp - (this.chain.length > 0 ? this.chain[this.chain.length - 1].timestamp : this.startTime),
    };

    this.chain.push(step);
  }

  /**
   * Add a module result to the audit chain
   */
  recordModuleResult(result: ModuleResult): void {
    this.recordStep(
      result.moduleName,
      result.inputHash ?? 'unknown',
      result.preconditions ?? {},
      result.intermediateOutputs ?? {},
      result.score
    );
  }

  /**
   * Get the complete audit chain
   */
  getChain(): ComputeTranscript[] {
    return [...this.chain];
  }

  /**
   * Calculate Merkle root of the audit chain (for on-chain verification)
   */
  calculateMerkleRoot(): string {
    if (this.chain.length === 0) return '';

    const hashes = this.chain.map(step =>
      createHash('sha256').update(JSON.stringify(step)).digest('hex')
    );

    return this.buildMerkleTree(hashes);
  }

  /**
   * Build Merkle tree from hashes
   */
  private buildMerkleTree(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];

    const nextLevel: string[] = [];

    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left;

      const combined = createHash('sha256')
        .update(left + right)
        .digest('hex');

      nextLevel.push(combined);
    }

    return this.buildMerkleTree(nextLevel);
  }

  /**
   * Generate reproducibility proof
   */
  generateReproducibilityProof(): {
    merkleRoot: string;
    chainLength: number;
    totalDuration: number;
    stepHashes: string[];
  } {
    const stepHashes = this.chain.map(step =>
      createHash('sha256').update(JSON.stringify(step)).digest('hex')
    );

    return {
      merkleRoot: this.calculateMerkleRoot(),
      chainLength: this.chain.length,
      totalDuration: Date.now() - this.startTime,
      stepHashes,
    };
  }

  /**
   * Verify a specific step in the chain
   */
  verifyStep(stepIndex: number, expectedHash: string): boolean {
    if (stepIndex < 0 || stepIndex >= this.chain.length) return false;

    const step = this.chain[stepIndex];
    const actualHash = createHash('sha256').update(JSON.stringify(step)).digest('hex');

    return actualHash === expectedHash;
  }

  /**
   * Export chain for external verification (e.g., WASM replay)
   */
  exportForReplay(): string {
    return JSON.stringify({
      version: '1.0',
      startTime: this.startTime,
      chain: this.chain,
      merkleRoot: this.calculateMerkleRoot(),
    }, null, 2);
  }
}

/**
 * Generate reproducibility hash from verification inputs and outputs
 */
export function generateReproducibilityHash(
  datasetId: string,
  inputHash: string,
  moduleResults: ModuleResult[],
  auditChain: ComputeTranscript[]
): string {
  const components = {
    datasetId,
    inputHash,
    moduleScores: moduleResults.map(r => ({ module: r.moduleName, score: r.score })),
    chainRoot: new AuditChainBuilder().calculateMerkleRoot(),
  };

  return createHash('sha256').update(JSON.stringify(components)).digest('hex');
}

/**
 * Create visualization data for anomalies (base64 mini-charts)
 */
export function generateAnomalyVisualization(
  anomalyType: string,
  data: number[]
): string {
  // Generate simple ASCII sparkline
  if (data.length === 0) return '';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const ticks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const sparkline = data.map(val => {
    const normalized = (val - min) / range;
    const index = Math.min(ticks.length - 1, Math.floor(normalized * ticks.length));
    return ticks[index];
  }).join('');

  // Convert to base64 for storage
  return Buffer.from(JSON.stringify({
    type: 'sparkline',
    data: sparkline,
    min,
    max,
    count: data.length,
  })).toString('base64');
}
