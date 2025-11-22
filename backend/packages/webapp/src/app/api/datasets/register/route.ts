// TODO: Add download access control - verify license ownership before allowing download
// TODO: Implement license verification endpoint
// TODO: Add earnings tracking for dataset creators

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildRegisterDatasetTx,
  getSuiClient,
  getSuiKeypair,
} from "@/lib/blockchain/sui-license";
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
 * Register dataset onchain and save to database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const client = getSuiClient();
    const keypair = getSuiKeypair();
    const tx = buildRegisterDatasetTx({
      blobId: data.blobId,
      title: data.title,
      description: data.description,
    });

    tx.setSender(keypair.toSuiAddress());
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: { showEffects: true, showObjectChanges: true },
    });

    const txDigest = result.digest;
    const supabase = getSupabaseAdmin();

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
        storage_key: data.blobId,
        price_usdc: data.priceUsd || 0,
        license_type: data.licenseType || "view_only",
        solana_tx_signature: txDigest,
        status: "live",
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

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

    return NextResponse.json(
      {
        error: "Failed to register dataset",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
