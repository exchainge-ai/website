const WALRUS_NETWORK = process.env.WALRUS_NETWORK || "testnet";
const WALRUS_EPOCHS = parseInt(process.env.WALRUS_EPOCHS || "5", 10);

const WALRUS_PUBLISHER_URL =
  WALRUS_NETWORK === "mainnet"
    ? "https://publisher.walrus.space"
    : "https://publisher.walrus-testnet.walrus.space";

const WALRUS_AGGREGATOR_URL =
  WALRUS_NETWORK === "mainnet"
    ? "https://aggregator.walrus.space"
    : "https://aggregator.walrus-testnet.walrus.space";

/**
 * TODO: Add duplicate detection by checking if blob ID already exists
 * TODO: Implement resumable uploads for large files
 * TODO: Add progress callbacks for upload tracking
 *
 * Upload file to Walrus decentralized storage
 */
export async function uploadToWalrus(args: {
  fileBuffer: Buffer;
  filename: string;
}): Promise<{
  blobId: string;
  size: number;
  epochs: number;
}> {
  const url = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${WALRUS_EPOCHS}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: args.fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Walrus upload failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const result = await response.json();
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
}

/**
 * TODO: Add duplicate detection by checking if blob ID already exists
 * TODO: Implement resumable uploads for large files
 * TODO: Add progress callbacks for upload tracking
 *
 * Retrieve file from Walrus by blob ID
 */
export async function getFromWalrus(blobId: string): Promise<{
  data: Buffer;
  metadata: { blobId: string; size: number };
}> {
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
}

/**
 * TODO: Add duplicate detection by checking if blob ID already exists
 * TODO: Implement resumable uploads for large files
 * TODO: Add progress callbacks for upload tracking
 *
 * Get public URL for Walrus blob
 */
export function getWalrusBlobUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}
