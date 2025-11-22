/**
 * Generate a Sui keypair for Walrus uploads
 * Run: bun run scripts/generate-sui-keypair.ts
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

console.log('\n🔑 Generating Sui keypair for Walrus uploads...\n');

// Generate new keypair
const keypair = new Ed25519Keypair();

// Get address
const address = keypair.getPublicKey().toSuiAddress();

// Get private key as base64
const privateKeyBytes = keypair.getSecretKey();
const privateKeyBase64 = Buffer.from(privateKeyBytes).toString('base64');

console.log('✅ Keypair generated!\n');
console.log('Copy these values to your .env or .env.local:\n');
console.log('─'.repeat(80));
console.log(`WALRUS_SIGNER_KEY=${privateKeyBase64}`);
console.log('─'.repeat(80));
console.log('\n📍 Your Sui address:', address);
console.log('\n💰 Get FREE testnet SUI:');
console.log('   1. Visit: https://faucet.testnet.sui.io/');
console.log(`   2. Paste address: ${address}`);
console.log('   3. Click "Request SUI Tokens"');
console.log('   4. Wait ~10 seconds to receive 1 SUI\n');
console.log('📊 Check balance: https://suiscan.xyz/testnet/account/' + address + '\n');
