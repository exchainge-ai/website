#!/usr/bin/env bun

import process from "process";
import { registerDatasetWithBlockchain } from "../packages/webapp/src/lib/blockchain/register-dataset";
import { getDatasetById } from "../packages/webapp/src/lib/db/datasets";

async function main() {
  const datasetId = process.argv[2];

  if (!datasetId) {
    console.error("Usage: bun run scripts/debug-blockchain-registration.ts <dataset-id>");
    process.exit(1);
  }

  console.log("Fetching dataset", { datasetId });
  const dataset = await getDatasetById(datasetId, { skipCache: true });

  if (!dataset) {
    console.error("Dataset not found");
    process.exit(1);
  }

  if (!dataset.storage_key) {
    console.error("Dataset missing storage_key");
    process.exit(1);
  }

  if (!dataset.size_bytes) {
    console.error("Dataset missing size_bytes");
    process.exit(1);
  }

  console.log("Starting blockchain registration", {
    datasetId: dataset.id,
    userId: dataset.user_id,
    storageKeyPrefix: dataset.storage_key.slice(0, 24),
    sizeBytes: dataset.size_bytes,
  });

  const result = await registerDatasetWithBlockchain(
    dataset.id,
    dataset.user_id,
    dataset.storage_key,
    dataset.size_bytes,
  );

  if (result.success) {
    console.log("Blockchain registration succeeded", {
      txSignature: result.txSignature,
      registryAccount: result.registryAccount,
      explorerUrl: result.explorerUrl,
    });
    process.exit(0);
  } else {
    console.error("Blockchain registration failed", {
      error: result.error,
    });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Script error", error);
  process.exit(1);
});
