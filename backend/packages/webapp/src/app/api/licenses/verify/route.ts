/**
 * License Verification API
 *
 * POST /api/licenses/verify - Check if user has valid license for dataset
 */

import { NextResponse } from "next/server";
import { hasValidLicense } from "@/lib/db/onchain-licenses";
import { z } from "zod";

const verifySchema = z.object({
  dataset_cid: z.string().min(1),
  licensee_address: z.string().min(1),
});

/**
 * POST /api/licenses/verify
 * Check if address has valid license for dataset
 *
 * Body:
 *   {
 *     "dataset_cid": "Qm...",
 *     "licensee_address": "0x..."
 *   }
 *
 * Response:
 *   {
 *     "has_license": boolean
 *   }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dataset_cid, licensee_address } = verifySchema.parse(body);

    // Check license validity
    const hasLicense = await hasValidLicense(dataset_cid, licensee_address);

    return NextResponse.json({
      has_license: hasLicense,
      dataset_cid,
      licensee_address,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Error verifying license:", error);
    return NextResponse.json(
      { error: "Failed to verify license" },
      { status: 500 }
    );
  }
}
