import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
  | "testnet"
  | "mainnet";
const SUI_PACKAGE_ID =
  process.env.NEXT_PUBLIC_SUI_PACKAGE_ID ||
  "0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb";

/**
 * Get configured Sui RPC client
 */
export function getSuiClient(): SuiClient {
  return new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
}

/**
 * Build transaction to register dataset onchain
 */
export function buildRegisterDatasetTx(params: {
  blobId: string;
  title: string;
  description?: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${SUI_PACKAGE_ID}::license::register_dataset`,
    arguments: [
      tx.pure.string(params.blobId),
      tx.pure.string(params.title),
      tx.object("0x6"),
    ],
  });
  return tx;
}

/**
 * Build transaction to issue license NFT
 */
export function buildIssueLicenseTx(params: {
  datasetBlobId: string;
  licensee: string;
  licenseType: string;
  expiryDurationMs: number;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${SUI_PACKAGE_ID}::license::issue_license`,
    arguments: [
      tx.pure.string(params.datasetBlobId),
      tx.pure.address(params.licensee),
      tx.pure.string(params.licenseType),
      tx.pure.u64(params.expiryDurationMs),
      tx.object("0x6"),
    ],
  });
  return tx;
}

/**
 * Load keypair from base64-encoded bech32 private key
 */
export function getSuiKeypair(): Ed25519Keypair {
  const signerKey = process.env.WALRUS_SIGNER_KEY;
  if (!signerKey) {
    throw new Error("WALRUS_SIGNER_KEY not configured");
  }

  const bech32Key = Buffer.from(signerKey, "base64").toString("utf-8");
  const { schema, secretKey } = decodeSuiPrivateKey(bech32Key);

  if (schema !== "ED25519") {
    throw new Error(`Unsupported key schema: ${schema}`);
  }

  return Ed25519Keypair.fromSecretKey(secretKey);
}
