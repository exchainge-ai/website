/**
 * Walrus Storage Client
 *
 * Handles file uploads to Walrus decentralized storage via HTTP API.
 * Files are stored as public blobs with unique blob IDs.
 *
 * DEMO MODE: For hackathon, uses mock storage until Walrus testnet API is stable
 */

import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";

// Environment configuration
const WALRUS_NETWORK = process.env.WALRUS_NETWORK || "testnet";
const WALRUS_EPOCHS = parseInt(process.env.WALRUS_EPOCHS || "5", 10);
const DEMO_MODE = process.env.WALRUS_DEMO_MODE === "true"; // Disable demo mode - use real Walrus

// Walrus HTTP API endpoints
const WALRUS_PUBLISHER_URL =
  WALRUS_NETWORK === "mainnet"
    ? "https://publisher.walrus.space"
    : "https://publisher.walrus-testnet.walrus.space";

const WALRUS_AGGREGATOR_URL =
  WALRUS_NETWORK === "mainnet"
    ? "https://aggregator.walrus.space"
    : "https://aggregator.walrus-testnet.walrus.space";

// Mock storage directory for demo
const MOCK_STORAGE_DIR = "/tmp/walrus-demo-storage";

/**
 * Initialize mock storage directory
 */
async function ensureMockStorageDir() {
  try {
    await fs.mkdir(MOCK_STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create mock storage dir:", error);
  }
}

/**
 * Generate mock blob ID from file content
 */
function generateBlobId(buffer: Buffer): string {
  const hash = createHash("sha256").update(buffer).digest("hex");
  // Format similar to Walrus blob IDs
  return `${hash.slice(0, 16)}-${hash.slice(16, 32)}-${hash.slice(32, 48)}`;
}

/**
 * Upload file to Walrus using HTTP API
 * Returns blob ID that can be used to retrieve the file
 */
export async function uploadToWalrus(args: {
  fileBuffer: Buffer;
  filename: string;
  signer?: any; // Optional - HTTP API handles signing
}): Promise<{
  blobId: string;
  size: number;
  epochs: number;
}> {
  if (DEMO_MODE) {
    // Demo mode: Store locally and return mock blob ID
    console.log("[DEMO MODE] Storing file locally instead of Walrus");

    await ensureMockStorageDir();
    const blobId = generateBlobId(args.fileBuffer);
    const filePath = path.join(MOCK_STORAGE_DIR, blobId);

    await fs.writeFile(filePath, args.fileBuffer);

    console.log("[DEMO MODE] Stored file:", {
      blobId,
      size: args.fileBuffer.length,
      path: filePath,
    });

    return {
      blobId,
      size: args.fileBuffer.length,
      epochs: WALRUS_EPOCHS,
    };
  }

  // Real Walrus upload (when testnet API is available)
  try {
    const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${WALRUS_EPOCHS}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: args.fileBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Walrus upload failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    // Response format: { newlyCreated: { blobObject: { blobId, ... } } } or { alreadyCertified: { ... } }
    const blobId =
      result.newlyCreated?.blobObject?.blobId ||
      result.alreadyCertified?.blobId;

    if (!blobId) {
      throw new Error("No blob ID in Walrus response");
    }

    return {
      blobId,
      size: args.fileBuffer.length,
      epochs: WALRUS_EPOCHS,
    };
  } catch (error) {
    console.error("Walrus upload error:", error);
    throw error;
  }
}

/**
 * Retrieve file from Walrus by blob ID using HTTP API
 */
export async function getFromWalrus(
  blobId: string
): Promise<{
  data: Buffer;
  metadata: any;
}> {
  if (DEMO_MODE) {
    // Demo mode: Retrieve from local storage
    const filePath = path.join(MOCK_STORAGE_DIR, blobId);

    try {
      const data = await fs.readFile(filePath);
      return {
        data,
        metadata: {
          blobId,
          size: data.length,
        },
      };
    } catch (error) {
      throw new Error(`Blob not found in demo storage: ${blobId}`);
    }
  }

  // Real Walrus retrieval
  try {
    const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`);

    if (!response.ok) {
      throw new Error(
        `Walrus download failed: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      data: Buffer.from(arrayBuffer),
      metadata: {
        blobId,
        size: arrayBuffer.byteLength,
      },
    };
  } catch (error) {
    console.error("Walrus download error:", error);
    throw error;
  }
}

/**
 * Validate Walrus configuration
 */
export function validateWalrusConfig(): { valid: boolean; error?: string } {
  // Walrus HTTP API doesn't require API keys for public uploads
  // Just check network is valid
  if (!["testnet", "mainnet", "devnet"].includes(WALRUS_NETWORK)) {
    return {
      valid: false,
      error: `Invalid WALRUS_NETWORK: ${WALRUS_NETWORK}`,
    };
  }

  if (DEMO_MODE) {
    console.log("[DEMO MODE] Using local storage for Walrus demo");
  }

  return { valid: true };
}

/**
 * Get Walrus blob URL for direct access
 */
export function getWalrusBlobUrl(blobId: string): string {
  if (DEMO_MODE) {
    // Return local endpoint for demo
    return `/api/walrus-demo/${blobId}`;
  }
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}
