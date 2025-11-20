/**
 * Walrus Upload API
 *
 * POST /api/upload-to-walrus
 * Accepts file upload and stores it on Walrus decentralized storage.
 * Returns blob ID for later retrieval.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { uploadToWalrus, validateWalrusConfig } from "@/lib/walrus/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * POST /api/upload-to-walrus
 *
 * Multipart form data with:
 * - file: The file to upload
 * - title: Dataset title
 * - description: Dataset description
 *
 * Returns:
 * {
 *   blobId: string,
 *   size: number,
 *   filename: string
 * }
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const auth = await requireAuth(request);

    // Validate Walrus config
    const config = validateWalrusConfig();
    if (!config.valid) {
      return NextResponse.json(
        { error: config.error },
        { status: 500 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get or create Sui keypair for signing
    // In production, use user's wallet or a service account
    const signerKey = process.env.WALRUS_SIGNER_KEY;
    if (!signerKey) {
      return NextResponse.json(
        { error: "WALRUS_SIGNER_KEY not configured" },
        { status: 500 }
      );
    }

    const signer = Ed25519Keypair.fromSecretKey(
      Buffer.from(signerKey, "base64")
    );

    console.log("Uploading to Walrus:", {
      filename: file.name,
      size: file.size,
      type: file.type,
    });

    // Upload to Walrus
    const result = await uploadToWalrus({
      fileBuffer: buffer,
      filename: file.name,
      signer,
    });

    console.log("Walrus upload complete:", result);

    return NextResponse.json({
      blobId: result.blobId,
      size: result.size,
      filename: file.name,
      title,
      description,
      epochs: result.epochs,
    });
  } catch (error) {
    console.error("Upload to Walrus failed:", error);
    return NextResponse.json(
      {
        error: "Failed to upload to Walrus",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
