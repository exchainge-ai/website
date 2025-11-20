/**
 * Sui License Integration
 *
 * Utilities for interacting with the Sui Move license contract.
 * Handles license minting, verification, and event querying.
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import type { SuiEvent, SuiTransactionBlockResponse } from "@mysten/sui/client";

// Environment configuration
const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
const PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID;
const CLOCK_OBJECT_ID = "0x6"; // Sui Clock object

// Initialize Sui client
export function getSuiClient(): SuiClient {
  const rpcUrl = getFullnodeUrl(SUI_NETWORK as "testnet" | "mainnet" | "devnet");
  return new SuiClient({ url: rpcUrl });
}

// Validate configuration
export function validateSuiConfig(): { valid: boolean; error?: string } {
  if (!PACKAGE_ID) {
    return {
      valid: false,
      error: "NEXT_PUBLIC_SUI_PACKAGE_ID not set. Deploy contract first.",
    };
  }
  return { valid: true };
}

/**
 * Build transaction to register a dataset onchain
 */
export function buildRegisterDatasetTx(args: {
  cid: string;
  title: string;
}): Transaction {
  if (!PACKAGE_ID) throw new Error("Package ID not configured");

  const tx = new Transaction();

  // Convert strings to byte vectors
  const cidBytes = Array.from(new TextEncoder().encode(args.cid));
  const titleBytes = Array.from(new TextEncoder().encode(args.title));

  // Call register_dataset function
  tx.moveCall({
    target: `${PACKAGE_ID}::license::register_dataset`,
    arguments: [
      tx.pure(cidBytes),       // cid: vector<u8>
      tx.pure(titleBytes),     // title: vector<u8>
      tx.object(CLOCK_OBJECT_ID), // clock: &Clock
    ],
  });

  return tx;
}

/**
 * Build transaction to issue a license
 */
export function buildIssueLicenseTx(args: {
  datasetCid: string;
  licenseeAddress: string;
  licenseType: string;
  expiryDurationMs?: number; // Optional, 0 = never expires
}): Transaction {
  if (!PACKAGE_ID) throw new Error("Package ID not configured");

  const tx = new Transaction();

  // Convert arguments
  const cidBytes = Array.from(new TextEncoder().encode(args.datasetCid));
  const typeBytes = Array.from(new TextEncoder().encode(args.licenseType));
  const expiryMs = args.expiryDurationMs || 0;

  // Call issue_license function
  tx.moveCall({
    target: `${PACKAGE_ID}::license::issue_license`,
    arguments: [
      tx.pure(cidBytes),                   // dataset_cid: vector<u8>
      tx.pure(args.licenseeAddress),       // licensee: address
      tx.pure(typeBytes),                  // license_type: vector<u8>
      tx.pure(expiryMs, "u64"),            // expiry_duration_ms: u64
      tx.object(CLOCK_OBJECT_ID),          // clock: &Clock
    ],
  });

  return tx;
}

/**
 * Query license events from the blockchain
 * Used by the sync worker to index new licenses
 */
export async function queryLicenseEvents(args: {
  eventType: "LicenseIssued" | "LicenseRevoked" | "DatasetRegistered";
  cursor?: string | null;
  limit?: number;
}): Promise<{ data: SuiEvent[]; nextCursor: string | null; hasNextPage: boolean }> {
  if (!PACKAGE_ID) throw new Error("Package ID not configured");

  const client = getSuiClient();

  // Build event type filter
  const eventTypeFilter = `${PACKAGE_ID}::license::${args.eventType}`;

  const result = await client.queryEvents({
    query: { MoveEventType: eventTypeFilter },
    cursor: args.cursor || undefined,
    limit: args.limit || 50,
    order: "ascending",
  });

  return result;
}

/**
 * Get license details from blockchain by object ID
 */
export async function getLicenseObject(licenseId: string) {
  const client = getSuiClient();

  const object = await client.getObject({
    id: licenseId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  return object;
}

/**
 * Parse LicenseIssued event data
 */
export interface LicenseIssuedEvent {
  license_id: string;
  dataset_cid: string;
  licensee: string;
  license_type: string;
  issued_at: string; // u64 as string
  expires_at: string; // u64 as string
  dataset_owner: string;
}

export function parseLicenseIssuedEvent(event: SuiEvent): LicenseIssuedEvent | null {
  try {
    const parsedJson = event.parsedJson as any;
    return {
      license_id: parsedJson.license_id,
      dataset_cid: parsedJson.dataset_cid,
      licensee: parsedJson.licensee,
      license_type: parsedJson.license_type,
      issued_at: parsedJson.issued_at,
      expires_at: parsedJson.expires_at,
      dataset_owner: parsedJson.dataset_owner,
    };
  } catch (error) {
    console.error("Failed to parse LicenseIssued event:", error);
    return null;
  }
}

/**
 * Parse LicenseRevoked event data
 */
export interface LicenseRevokedEvent {
  license_id: string;
  dataset_cid: string;
  licensee: string;
  revoked_at: string;
  revoked_by: string;
}

export function parseLicenseRevokedEvent(event: SuiEvent): LicenseRevokedEvent | null {
  try {
    const parsedJson = event.parsedJson as any;
    return {
      license_id: parsedJson.license_id,
      dataset_cid: parsedJson.dataset_cid,
      licensee: parsedJson.licensee,
      revoked_at: parsedJson.revoked_at,
      revoked_by: parsedJson.revoked_by,
    };
  } catch (error) {
    console.error("Failed to parse LicenseRevoked event:", error);
    return null;
  }
}
