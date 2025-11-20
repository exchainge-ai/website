/**
 * Sui License Event Sync Worker
 *
 * Polls Sui blockchain for license events and syncs them to the database.
 * Run this as a cron job or background worker.
 *
 * Usage:
 *   bun run workers/sync-sui-licenses.ts
 */

import {
  queryLicenseEvents,
  parseLicenseIssuedEvent,
  parseLicenseRevokedEvent,
  validateSuiConfig,
} from "@/lib/blockchain/sui-license";
import {
  createOnchainLicense,
  revokeOnchainLicense,
  getOnchainLicenseByLicenseId,
} from "@/lib/db/onchain-licenses";

// Track last processed cursor (in production, store this in DB)
let lastIssuedCursor: string | null = null;
let lastRevokedCursor: string | null = null;

/**
 * Sync LicenseIssued events
 */
async function syncLicenseIssuedEvents(): Promise<number> {
  let syncedCount = 0;

  try {
    // Query events from blockchain
    const result = await queryLicenseEvents({
      eventType: "LicenseIssued",
      cursor: lastIssuedCursor,
      limit: 50,
    });

    console.log(`Found ${result.data.length} LicenseIssued events`);

    // Process each event
    for (const event of result.data) {
      const parsed = parseLicenseIssuedEvent(event);
      if (!parsed) {
        console.warn("Failed to parse event, skipping");
        continue;
      }

      // Check if already synced
      const existing = await getOnchainLicenseByLicenseId(parsed.license_id);
      if (existing) {
        console.log(`License ${parsed.license_id} already synced, skipping`);
        continue;
      }

      // Insert into database
      const license = await createOnchainLicense({
        license_id: parsed.license_id,
        transaction_hash: event.id.txDigest,
        dataset_cid: parsed.dataset_cid,
        licensee_address: parsed.licensee,
        license_type: parsed.license_type,
        issued_at: parseInt(parsed.issued_at),
        expires_at: parseInt(parsed.expires_at) || null,
        dataset_owner_address: parsed.dataset_owner,
      });

      if (license) {
        console.log(`Synced license ${parsed.license_id}`);
        syncedCount++;
      }
    }

    // Update cursor for next run
    if (result.nextCursor) {
      lastIssuedCursor = result.nextCursor;
    }
  } catch (error) {
    console.error("Error syncing LicenseIssued events:", error);
  }

  return syncedCount;
}

/**
 * Sync LicenseRevoked events
 */
async function syncLicenseRevokedEvents(): Promise<number> {
  let syncedCount = 0;

  try {
    // Query events from blockchain
    const result = await queryLicenseEvents({
      eventType: "LicenseRevoked",
      cursor: lastRevokedCursor,
      limit: 50,
    });

    console.log(`Found ${result.data.length} LicenseRevoked events`);

    // Process each event
    for (const event of result.data) {
      const parsed = parseLicenseRevokedEvent(event);
      if (!parsed) {
        console.warn("Failed to parse revoked event, skipping");
        continue;
      }

      // Update license in database
      const success = await revokeOnchainLicense(
        parsed.license_id,
        parseInt(parsed.revoked_at),
        parsed.revoked_by
      );

      if (success) {
        console.log(`Revoked license ${parsed.license_id}`);
        syncedCount++;
      }
    }

    // Update cursor for next run
    if (result.nextCursor) {
      lastRevokedCursor = result.nextCursor;
    }
  } catch (error) {
    console.error("Error syncing LicenseRevoked events:", error);
  }

  return syncedCount;
}

/**
 * Main sync function
 * Call this periodically (e.g., every 30 seconds)
 */
export async function syncSuiLicenses(): Promise<{
  issued: number;
  revoked: number;
}> {
  // Validate config first
  const config = validateSuiConfig();
  if (!config.valid) {
    console.error("Sui config invalid:", config.error);
    return { issued: 0, revoked: 0 };
  }

  console.log("Starting Sui license sync...");

  const issuedCount = await syncLicenseIssuedEvents();
  const revokedCount = await syncLicenseRevokedEvents();

  console.log(`Sync complete: ${issuedCount} issued, ${revokedCount} revoked`);

  return {
    issued: issuedCount,
    revoked: revokedCount,
  };
}

// Run sync if executed directly
if (import.meta.main) {
  console.log("Sui License Sync Worker started");

  // Run once immediately
  await syncSuiLicenses();

  // Then run every 30 seconds
  setInterval(async () => {
    await syncSuiLicenses();
  }, 30000);
}
