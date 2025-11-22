/**
 * Licenses API
 *
 * GET /api/licenses - Get user's licenses or licenses for a dataset
 * POST /api/licenses/sync - Trigger manual sync (admin only)
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import {
  getLicensesByLicensee,
  getLicensesByDatasetCid,
  getActiveLicensesByLicensee,
} from "@/lib/db/onchain-licenses";
import { syncSuiLicenses } from "@/workers/sync-sui-licenses";

/**
 * GET /api/licenses
 * Query params:
 *   - address: Get licenses for this Sui address
 *   - dataset_cid: Get licenses for this dataset
 *   - active_only: Filter to active licenses only
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get("address");
    const datasetCid = url.searchParams.get("dataset_cid");
    const activeOnly = url.searchParams.get("active_only") === "true";

    let licenses;

    if (address) {
      // Get licenses owned by address
      if (activeOnly) {
        licenses = await getActiveLicensesByLicensee(address);
      } else {
        licenses = await getLicensesByLicensee(address);
      }
    } else if (datasetCid) {
      // Get licenses for a dataset
      licenses = await getLicensesByDatasetCid(datasetCid);
    } else {
      return NextResponse.json(
        { error: "Must provide either 'address' or 'dataset_cid' parameter" },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: licenses });
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/licenses/sync
 * Manually trigger license sync from blockchain
 * Requires authentication
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    await requireAuth(request);

    // Trigger sync
    const result = await syncSuiLicenses();

    return NextResponse.json({
      success: true,
      synced: {
        issued: result.issued,
        revoked: result.revoked,
      },
    });
  } catch (error) {
    console.error("Error syncing licenses:", error);
    return NextResponse.json(
      { error: "Failed to sync licenses" },
      { status: 500 }
    );
  }
}
