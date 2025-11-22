/**
 * Dataset Blockchain Registration
 * Helper function to register datasets on Solana after DB creation
 */

import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { initSolanaClient, registerDatasetOnChain } from "../solana/client";
import { getSupabaseAdmin } from "../db/supabase";
import { logger } from "../server/logger";
import crypto from "crypto";

function maskRpcUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.username) {
      parsed.username = "***";
    }
    if (parsed.password) {
      parsed.password = "***";
    }
    if (parsed.search) {
      parsed.search = "?***";
    }
    return parsed.toString();
  } catch {
    return url.replace(/\?.*/, "?***");
  }
}

/**
 * Register dataset on blockchain and update database
 *
 * @param datasetId - Database dataset ID
 * @param userId - User ID (owner)
 * @param fileKey - R2 storage key
 * @param fileSize - File size in bytes
 * @returns Blockchain transaction info
 */
export async function registerDatasetWithBlockchain(
  datasetId: string,
  userId: string,
  fileKey: string,
  fileSize: number
): Promise<{
  success: boolean;
  txSignature?: string;
  registryAccount?: string;
  explorerUrl?: string;
  error?: string;
}> {
  try {
    logger.info("[Blockchain] Starting registration", { datasetId });

    // Generate dataset hash (deterministic from file metadata)
    const datasetHash = crypto
      .createHash("sha256")
      .update(`${fileKey}:${datasetId}:${fileSize}`)
      .digest("hex");

    logger.info("[Blockchain] Dataset hash generated", {
      datasetId,
      hashPrefix: datasetHash.substring(0, 16)
    });

    const privateKey = process.env.SOLANA_WALLET_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("SOLANA_WALLET_PRIVATE_KEY not configured");
    }

    const walletKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const walletAddress = walletKeypair.publicKey.toBase58();

    logger.info("[Blockchain] Wallet loaded", {
      datasetId,
      walletAddress,
    });

    const configuredRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    const fallbackRpcUrl = configuredRpcUrl?.includes("devnet")
      ? "https://api.devnet.solana.com"
      : "https://api.testnet.solana.com";
    const rpcCandidates = [configuredRpcUrl, fallbackRpcUrl].filter(
      (value, index, array): value is string =>
        Boolean(value) && array.indexOf(value) === index
    );

    if (rpcCandidates.length === 0) {
      rpcCandidates.push("https://api.testnet.solana.com");
    }

    let activeClient: ReturnType<typeof initSolanaClient> | null = null;
    let activeRpcUrl: string | null = null;
    let balanceLamports: number | null = null;
    let lastRpcError: unknown = null;

    for (const candidate of rpcCandidates) {
      try {
        const client = initSolanaClient(candidate, walletKeypair);
        const currentBalance = await client.connection.getBalance(walletKeypair.publicKey);

        activeClient = client;
        activeRpcUrl = candidate;
        balanceLamports = currentBalance;

        if (candidate !== rpcCandidates[0]) {
          logger.warn("[Blockchain] Using fallback Solana RPC endpoint", {
            datasetId,
            rpcUrl: maskRpcUrl(candidate),
          });
        }
        break;
      } catch (rpcError) {
        lastRpcError = rpcError;
        logger.error("[Blockchain] RPC connection failed", {
          datasetId,
          rpcUrl: maskRpcUrl(candidate),
          error: rpcError instanceof Error ? rpcError.message : String(rpcError),
        });
      }
    }

    if (!activeClient || !activeRpcUrl || balanceLamports === null) {
      const message =
        lastRpcError instanceof Error
          ? `Unable to connect to Solana RPC endpoint: ${lastRpcError.message}`
          : "Unable to connect to Solana RPC endpoint";
      throw new Error(message);
    }

    const { program } = activeClient;
    const balance = balanceLamports;
    const balanceSOL = balance / 1e9;

    logger.info("[Blockchain] Wallet initialized", {
      datasetId,
      walletAddress,
      rpcUrl: maskRpcUrl(activeRpcUrl)
    });

    logger.info("[Blockchain] Wallet balance checked", {
      datasetId,
      walletAddress,
      balanceSOL
    });

    if (balance < 5000000) { // 0.005 SOL minimum
      const errorMsg = `Insufficient balance: ${balanceSOL} SOL (need at least 0.005 SOL for transaction fees)`;
      logger.error("[Blockchain] Insufficient balance", {
        datasetId,
        walletAddress,
        balanceSOL,
        required: 0.005
      });
      throw new Error(errorMsg);
    }

    const hashBuffer = Buffer.from(datasetHash, "hex");
    const datasetHashNumeric = hashBuffer.readUInt32LE(0);

    const priceSolEnv = process.env.SOLANA_DATASET_PRICE_SOL ?? "0.1";
    const priceSol = Number(priceSolEnv);

    if (!Number.isFinite(priceSol) || priceSol < 0) {
      throw new Error(`Invalid SOLANA_DATASET_PRICE_SOL value: ${priceSolEnv}`);
    }

    const priceLamports = Math.round(priceSol * LAMPORTS_PER_SOL);

    logger.info("[Blockchain] Sending transaction", {
      datasetId,
      datasetHashNumeric,
      priceLamports,
    });
    const blockchainResult = await registerDatasetOnChain(
      program,
      hashBuffer,
      priceLamports,
    );

    logger.success("[Blockchain] Registration successful", {
      datasetId,
      txSignature: blockchainResult.signature,
      registryAccount: blockchainResult.datasetAccount,
    });

    // Generate explorer URL
    const network = activeRpcUrl.includes("testnet")
      ? "testnet"
      : activeRpcUrl.includes("devnet")
        ? "devnet"
        : "mainnet-beta";
    const networkParam = network === "mainnet-beta" ? "" : `?cluster=${network}`;
    const explorerUrl = `https://explorer.solana.com/tx/${blockchainResult.signature}${networkParam}`;

    // Update database with blockchain info
    const supabase = getSupabaseAdmin();
    const { error: updateError } = await (supabase
      .from("datasets")
      .update as any)({
        dataset_hash: datasetHash,
        blockchain_tx_hash: blockchainResult.signature,
        blockchain_registry_account: blockchainResult.datasetAccount,
        blockchain_explorer_url: explorerUrl,
        blockchain_registered_at: new Date().toISOString(),
      })
      .eq("id", datasetId);

    if (updateError) {
      logger.error("[Blockchain] Failed to update database", {
        datasetId,
        error: updateError.message
      });
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    logger.success("[Blockchain] Database updated", { datasetId });

    return {
      success: true,
      txSignature: blockchainResult.signature,
      registryAccount: blockchainResult.datasetAccount,
      explorerUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("[Blockchain] Registration failed", {
      datasetId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    try {
      const supabase = getSupabaseAdmin();
      await (supabase
        .from("datasets")
        .update as any)({
          status_reason: `blockchain_failed: ${errorMessage.slice(0, 200)}`,
        })
        .eq("id", datasetId);
    } catch (updateError) {
      logger.error("[Blockchain] Failed to persist error status", {
        datasetId,
        error: updateError instanceof Error ? updateError.message : String(updateError),
      });
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}
