/**
 * Dataset Registration API
 *
 * POST /api/datasets/register
 * Registers a dataset onchain after Walrus upload.
 * Links Walrus blob ID to Sui Move contract.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/server/auth";
import { buildRegisterDatasetTx, getSuiClient } from "@/lib/blockchain/sui-license";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { createDataset } from "@/lib/db/datasets";
import { getSupabaseAdmin } from "@/lib/db/supabase";

const registerSchema = z.object({
  blobId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  filename: z.string().min(1),
  size: z.number().int().positive(),
  category: z.string().optional(),
  priceUsd: z.number().optional(),
  licenseType: z.string().optional(),
});

/**
 * POST /api/datasets/register
 *
 * Body:
 * {
 *   blobId: string,        // Walrus blob ID
 *   title: string,
 *   description: string,
 *   filename: string,
 *   size: number,
 *   category?: string,
 *   priceUsd?: number,
 *   licenseType?: string
 * }
 *
 * Returns:
 * {
 *   datasetId: string,
 *   txDigest: string,
 *   blobId: string
 * }
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const auth = await requireAuth(request);

    // Parse and validate request
    const body = await request.json();
    const data = registerSchema.parse(body);

    console.log("Registering dataset onchain:", {
      blobId: data.blobId,
      title: data.title,
    });

    // Build transaction to register dataset onchain
    const tx = buildRegisterDatasetTx({
      cid: data.blobId, // Use Walrus blob ID as CID
      title: data.title,
    });

    // Get signer (in production, use user's wallet)
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

    // Execute transaction
    const client = getSuiClient();
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    console.log("Dataset registered onchain:", {
      digest: result.digest,
      effects: result.effects?.status,
    });

    // Store in database
    const adminClient = getSupabaseAdmin();
    const dataset = await createDataset(
      auth.userId,
      {
        title: data.title,
        description: data.description,
        category: (data.category as any) || "other",
        price_usdc: data.priceUsd || 0,
        license_type: data.licenseType || "view_only",
        file_format: data.filename.split(".").pop() || "unknown",
        size_bytes: data.size,
        size_formatted: formatBytes(data.size),
        storage_provider: "walrus",
        storage_key: data.blobId, // Walrus blob ID
        storage_bucket: "walrus-" + (process.env.WALRUS_NETWORK || "testnet"),
        status: "live",
        verification_score: 100, // Auto-approve for demo
        verification_status: true,
        published_at: new Date().toISOString(),
        tags: [],
        upload_status: "complete",
        upload_progress: 100,
        // Licensing defaults
        commercial_use: false,
        derivative_works_allowed: false,
        redistribution_allowed: false,
        attribution_required: true,
        ai_training_allowed: true,
        geographic_restrictions: false,
        geographic_regions: null,
        royalty_bps: 0,
        max_owners: null,
        license_duration_days: null,
        thumbnail_url: null,
        preview_files: null,
        hardware_verified: false,
        sp1_commitment: null,
        sp1_proof_hash: null,
        is_marketplace_only: false,
        can_commercial_use: false,
        can_resale: false,
        attestations: [],
        semantic_tags: {},
        attestation_source: "user",
      },
      { client: adminClient }
    );

    if (!dataset) {
      throw new Error("Failed to create dataset in database");
    }

    console.log("Dataset created in database:", dataset.id);

    return NextResponse.json({
      datasetId: dataset.id,
      txDigest: result.digest,
      blobId: data.blobId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Dataset registration failed:", error);
    return NextResponse.json(
      {
        error: "Failed to register dataset",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
