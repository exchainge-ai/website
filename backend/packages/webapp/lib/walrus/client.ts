/**
 * Walrus Storage Client
 *
 * Handles file uploads to Walrus decentralized storage.
 * Files are stored as public blobs with unique blob IDs.
 */

import { WalrusClient, WalrusFile } from "@mysten/walrus";

// Environment configuration
const WALRUS_NETWORK = process.env.WALRUS_NETWORK || "testnet";
const WALRUS_EPOCHS = parseInt(process.env.WALRUS_EPOCHS || "5", 10);

/**
 * Initialize Walrus client
 */
export function getWalrusClient(): WalrusClient {
  return new WalrusClient({
    network: WALRUS_NETWORK as "testnet" | "mainnet",
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

  // Create Walrus file from buffer
  const file = WalrusFile.from({
    contents: new Uint8Array(args.fileBuffer),
    identifier: args.filename,
  });

  // Upload to Walrus
  const results = await client.walrus.writeFiles({
    files: [file],
    epochs: WALRUS_EPOCHS,
    deletable: true,
    signer: args.signer,
  });

  // Extract blob ID from result
  const result = results[0];
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

  // Read file by blob ID
  const [file] = await client.walrus.getFiles({
    ids: [blobId],
  });

  if (!file) {
    throw new Error(`Blob not found: ${blobId}`);
  }

  // Get file contents as bytes
  const bytes = await file.bytes();

  return {
    data: Buffer.from(bytes),
    metadata: file.metadata || {},
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
