/**
 * Sui Blockchain Integration for Dataset Licensing
 *
 * Handles interaction with the Sui Move smart contract for dataset registration and licensing.
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

// Environment configuration
const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
  | "testnet"
  | "mainnet";
const SUI_PACKAGE_ID =
  process.env.NEXT_PUBLIC_SUI_PACKAGE_ID ||
  "0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb";

/**
 * Get Sui client instance
 */
export function getSuiClient(): SuiClient {
  return new SuiClient({
    url: getFullnodeUrl(SUI_NETWORK),
  });
}

/**
 * Build transaction to register a dataset onchain
 */
export function buildRegisterDatasetTx(params: {
  blobId: string;
  title: string;
  description?: string;
}): Transaction {
  const tx = new Transaction();

  // Call the register_dataset function from the Move contract
  tx.moveCall({
    target: `${SUI_PACKAGE_ID}::license::register_dataset`,
    arguments: [
      tx.pure.string(params.blobId), // CID/blob ID
      tx.pure.string(params.title), // Title
      tx.object("0x6"), // Clock object (Sui system clock)
    ],
  });

  return tx;
}

/**
 * Build transaction to issue a license for a dataset
 */
export function buildIssueLicenseTx(params: {
  datasetBlobId: string;
  licensee: string; // Sui address
  licenseType: string;
  expiryDurationMs: number;
}): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${SUI_PACKAGE_ID}::license::issue_license`,
    arguments: [
      tx.pure.string(params.datasetBlobId),
      tx.pure.address(params.licensee),
      tx.pure.string(params.licenseType),
      tx.pure.u64(params.expiryDurationMs),
      tx.object("0x6"), // Clock object
    ],
  });

  return tx;
}

/**
 * Load Sui keypair from environment variable
 * Supports both bech32 format (suiprivkey1...) and base64 format
 */
export function getSuiKeypair(): Ed25519Keypair {
  const signerKey = process.env.WALRUS_SIGNER_KEY;
  if (!signerKey) {
    throw new Error("WALRUS_SIGNER_KEY not configured in environment");
  }

  try {
    // Decode base64 to get the bech32 string
    const bech32Key = Buffer.from(signerKey, "base64").toString("utf-8");

    // Use Sui SDK's decodeSuiPrivateKey to handle bech32 format
    const { schema, secretKey } = decodeSuiPrivateKey(bech32Key);

    if (schema !== "ED25519") {
      throw new Error(`Unsupported key schema: ${schema}. Expected ED25519`);
    }

    // Create keypair from raw secret key bytes
    return Ed25519Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error(
      `Failed to load Sui keypair: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate Sui configuration
 */
export function validateSuiConfig(): { valid: boolean; error?: string } {
  if (!SUI_PACKAGE_ID || SUI_PACKAGE_ID === "0x0") {
    return {
      valid: false,
      error: "SUI_PACKAGE_ID not configured",
    };
  }

  if (!["testnet", "mainnet"].includes(SUI_NETWORK)) {
    return {
      valid: false,
      error: `Invalid SUI_NETWORK: ${SUI_NETWORK}`,
    };
  }

  return { valid: true };
}
