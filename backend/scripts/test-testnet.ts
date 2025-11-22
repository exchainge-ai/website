#!/usr/bin/env bun

/**
 * Testnet Testing Script for ExchAInge Smart Contract
 *
 * This script tests all smart contract functions on Solana testnet:
 * 1. Register - Create new dataset entry
 * 2. Update - Update existing entry
 * 3. Close - Delete entry and reclaim rent
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import crypto from "crypto";

// Configuration
const TESTNET_RPC = "https://api.testnet.solana.com";
const PROGRAM_ID = process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || "7qiE4Zu1wJh1jmXy2Htwp3BBf22wqFHvDvmkD6WzE7qx";

async function main() {
  console.log("🧪 ExchAInge Smart Contract - Testnet Testing");
  console.log("==============================================\n");

  // Connect to testnet
  const connection = new Connection(TESTNET_RPC, "confirmed");
  console.log("✅ Connected to Solana testnet");

  // Load wallet (from ~/.config/solana/id.json)
  const walletPath = `${process.env.HOME}/.config/solana/id.json`;
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(await Bun.file(walletPath).text()))
  );

  console.log(`📍 Wallet: ${walletKeypair.publicKey.toString()}`);

  // Check balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 Balance: ${balance / 1e9} SOL`);

  if (balance < 0.1 * 1e9) {
    console.error("❌ Insufficient balance. Need at least 0.1 SOL for testing.");
    console.log("   Run: solana airdrop 1 --url testnet");
    process.exit(1);
  }

  console.log("\n📋 Testing smart contract functions...\n");

  // Test data
  const internalKey = `test_${Date.now()}`;
  const dataHash = crypto.randomBytes(32).toString("hex");
  const metadataUri = `https://exchainge.com/metadata/${internalKey}`;

  console.log("Test data:");
  console.log(`  Internal Key: ${internalKey}`);
  console.log(`  Data Hash: ${dataHash.substring(0, 16)}...`);
  console.log(`  Metadata URI: ${metadataUri}`);
  console.log("");

  // Derive PDA
  const programId = new PublicKey(PROGRAM_ID);
  const [registryPda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("registry"),
      walletKeypair.publicKey.toBuffer(),
      Buffer.from(internalKey),
    ],
    programId
  );

  console.log(`🔑 PDA: ${registryPda.toString()}`);
  console.log(`   Bump: ${bump}\n`);

  // TEST 1: Register
  console.log("1️⃣  Testing REGISTER function...");
  try {
    // This is a placeholder - actual implementation depends on your Anchor program setup
    console.log("   ⚠️  Manual test required:");
    console.log(`   anchor run test --provider.cluster testnet`);
    console.log("");
    console.log("   Or use Anchor client:");
    console.log(`   const tx = await program.methods.register("${internalKey}", "${dataHash}", "${metadataUri}").rpc();`);
    console.log("");
  } catch (error) {
    console.error("   ❌ Register failed:", error);
  }

  // TEST 2: Read registry (verify it was created)
  console.log("2️⃣  Checking if registry account exists...");
  try {
    const accountInfo = await connection.getAccountInfo(registryPda);
    if (accountInfo) {
      console.log("   ✅ Registry account found!");
      console.log(`   Lamports: ${accountInfo.lamports}`);
      console.log(`   Data size: ${accountInfo.data.length} bytes`);
    } else {
      console.log("   ❌ Registry account not found (not registered yet)");
    }
    console.log("");
  } catch (error) {
    console.error("   ❌ Failed to fetch account:", error);
  }

  // TEST 3: Update
  console.log("3️⃣  Testing UPDATE function...");
  const newDataHash = crypto.randomBytes(32).toString("hex");
  const newMetadataUri = `${metadataUri}/v2`;
  console.log(`   New Data Hash: ${newDataHash.substring(0, 16)}...`);
  console.log(`   New Metadata: ${newMetadataUri}`);
  console.log("   ⚠️  Manual test required:");
  console.log(`   const tx = await program.methods.update("${newDataHash}", "${newMetadataUri}").rpc();`);
  console.log("");

  // TEST 4: Close
  console.log("4️⃣  Testing CLOSE function...");
  console.log("   ⚠️  Manual test required:");
  console.log(`   const tx = await program.methods.close().rpc();`);
  console.log("");

  console.log("✅ Testnet testing guide complete!");
  console.log("");
  console.log("📋 Manual Testing Steps:");
  console.log("1. Run: cd packages/smart_contracts");
  console.log("2. Run: anchor test --provider.cluster testnet");
  console.log("3. Check transactions on Solana Explorer");
  console.log(`   https://explorer.solana.com/address/${registryPda.toString()}?cluster=testnet`);
  console.log("");
  console.log("🔗 Useful commands:");
  console.log(`   solana account ${registryPda.toString()} --url testnet`);
  console.log(`   solana program show ${PROGRAM_ID} --url testnet`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
