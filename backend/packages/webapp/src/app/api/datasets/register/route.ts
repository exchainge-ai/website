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
import {
  buildRegisterDatasetTx,
  getSuiClient,
  getSuiKeypair,
} from "@/lib/blockchain/sui-license";
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
    // TODO: Add authentication for production
    // For hackathon/demo, allow unauthenticated uploads
    // const auth = await requireAuth(request);

    // Parse and validate request
    const body = await request.json();
    const data = registerSchema.parse(body);

    console.log("Registering dataset onchain:", {
      blobId: data.blobId,
      title: data.title,
    });

    // Step 1: Build and execute Sui blockchain transaction
    const client = getSuiClient();
    const keypair = getSuiKeypair();

    const tx = buildRegisterDatasetTx({
      blobId: data.blobId,
      title: data.title,
      description: data.description,
    });

    // Set sender and execute transaction
    tx.setSender(keypair.toSuiAddress());

    console.log("Executing Sui transaction...");
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    const txDigest = result.digest;
    console.log("Transaction executed successfully:", txDigest);

    // Step 2: Save to Supabase database
    const supabase = getSupabaseAdmin();

    // Get or create a default user for hackathon demo
    // In production, use actual authenticated user
    const { data: defaultUser } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", "demo-user")
      .single();

    let userId = defaultUser?.id;
    if (!userId) {
      const { data: newUser } = await supabase
        .from("users")
        .insert({ privy_id: "demo-user", display_name: "Demo User" })
        .select("id")
        .single();
      userId = newUser?.id;
    }

    const { data: dataset, error: dbError } = await supabase
      .from("datasets")
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        category: data.category || "other",
        file_format: data.filename.split(".").pop() || "unknown",
        size_bytes: data.size,
        size_formatted: formatBytes(data.size),
        storage_provider: "walrus",
        storage_key: data.blobId, // Use storage_key for blob_id
        price_usdc: data.priceUsd || 0,
        license_type: data.licenseType || "view_only",
        solana_tx_signature: txDigest, // Reuse this field for Sui tx
        status: "live",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to save dataset to database:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log("Dataset registered successfully:", {
      id: dataset.id,
      blobId: data.blobId,
      txDigest,
    });

    return NextResponse.json({
      datasetId: dataset.id,
      txDigest,
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
