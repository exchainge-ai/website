/**
 * Example usage of the Solana smart contract client.
 *
 * Run with:
 *   node --loader ts-node/esm packages/webapp/src/lib/solana/example.ts
 * (ensure env vars are configured first)
 */

import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import crypto from "crypto";
import {
  bufferToDatasetHashNumber,
  fetchDatasetAccount,
  fetchDatasetsByOwner,
  initSolanaClient,
  registerDatasetOnChain,
} from "./client";

async function main() {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
  const privateKeyBase58 = process.env.SOLANA_WALLET_PRIVATE_KEY!;
  const walletKeypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));

  const { program } = initSolanaClient(rpcUrl, walletKeypair);

  // Simulate deriving hash from your dataset metadata
  const datasetHashBuffer = crypto
    .createHash("sha256")
    .update("file-key:dataset-id:file-size")
    .digest();

  const datasetHashNumber = bufferToDatasetHashNumber(datasetHashBuffer);

  console.log("Dataset hash (u32):", datasetHashNumber);

  const priceLamports = Math.round(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL

  const result = await registerDatasetOnChain(
    program,
    datasetHashBuffer,
    priceLamports,
  );

  console.log("Transaction signature:", result.signature);
  console.log("Dataset account PDA:", result.datasetAccount);

  const fetched = await fetchDatasetAccount(program, datasetHashNumber);

  if (fetched) {
    console.log("On-chain owner:", fetched.owner.toBase58());
    console.log("Stored hash:", fetched.datasetHash);
    console.log("Stored price (lamports):", fetched.price.toString());
  }

  const ownedDatasets = await fetchDatasetsByOwner(program);
  console.log(`Datasets owned by ${walletKeypair.publicKey.toBase58()}:`, ownedDatasets.length);
}

void main();
