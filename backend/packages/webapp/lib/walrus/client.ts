/**
 * Walrus Storage Client
 *
 * Handles file uploads to Walrus decentralized storage.
 * Files are stored as public blobs with unique blob IDs.
 */

import { WalrusClient } from "@mysten/walrus";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// Environment configuration
const WALRUS_NETWORK = process.env.WALRUS_NETWORK || "testnet";
const WALRUS_EPOCHS = parseInt(process.env.WALRUS_EPOCHS || "5", 10);

/**
 * Initialize Walrus client
 */
export function getWalrusClient(): WalrusClient {
  // Create Sui client for Walrus
  const suiClient = new SuiClient({
    url: getFullnodeUrl(WALRUS_NETWORK as "testnet" | "mainnet"),
  });

  // Create Walrus client with Sui client
  return new WalrusClient({
    network: WALRUS_NETWORK as "testnet" | "mainnet",
    suiClient,
  });
}

/**
 * Upload file to Walrus
 * Returns blob ID that can be used to retrieve the file
 */
export async function uploadToWalrus(args: {
  fileBuffer: Buffer;
  filename: string;
  signer: any; // Sui keypair for signing
}): Promise<{
  blobId: string;
  size: number;
  epochs: number;
}> {
  const client = getWalrusClient();

  // Upload blob to Walrus
  const result = await client.writeBlob({
    blob: new Uint8Array(args.fileBuffer),
    deletable: true,
    epochs: WALRUS_EPOCHS,
    signer: args.signer,
  });

  if (!result || !result.blobId) {
    throw new Error("Failed to upload to Walrus");
  }

  return {
    blobId: result.blobId,
    size: args.fileBuffer.length,
    epochs: WALRUS_EPOCHS,
  };
}

/**
 * Retrieve file from Walrus by blob ID
 */
export async function getFromWalrus(blobId: string): Promise<{
  data: Buffer;
  metadata: any;
}> {
  const client = getWalrusClient();

  // Read blob by ID
  const blob = await client.readBlob({
    blobId,
  });

  if (!blob) {
    throw new Error(`Blob not found: ${blobId}`);
  }

  return {
    data: Buffer.from(blob),
    metadata: {},
  };
}

/**
 * Validate Walrus configuration
 */
export function validateWalrusConfig(): { valid: boolean; error?: string } {
  // Walrus doesn't require API keys for public uploads
  // Just check network is valid
  if (!["testnet", "mainnet"].includes(WALRUS_NETWORK)) {
    return {
      valid: false,
      error: `Invalid WALRUS_NETWORK: ${WALRUS_NETWORK}`,
    };
  }

  return { valid: true };
}
