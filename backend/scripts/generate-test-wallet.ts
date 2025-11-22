/**
 * Generate a test wallet for Arweave testnet uploads
 * Run: bun run scripts/generate-test-wallet.ts
 */

import { Wallet } from 'ethers';

console.log('\n Generating test wallet for Arweave devnet...\n');

const wallet = Wallet.createRandom();

console.log('Wallet generated!\n');
console.log('Copy these values to your .env.local:\n');
console.log('─'.repeat(80));
console.log(`ARWEAVE_PRIVATE_KEY=${wallet.privateKey}`);
console.log('─'.repeat(80));
console.log('\n Your wallet address:', wallet.address);
console.log('\n Get FREE testnet MATIC:');
console.log('   1. Visit: https://mumbaifaucet.com/');
console.log(`   2. Paste address: ${wallet.address}`);
console.log('   3. Click "Send Me MATIC"');
console.log('   4. Wait ~30 seconds to receive 0.5 MATIC\n');
console.log('You can use multiple faucets to get more testnet MATIC!');
console.log('   - https://faucet.polygon.technology/ (0.2 MATIC)');
console.log('   - https://faucet.quicknode.com/polygon/mumbai (0.1 MATIC)\n');
console.log('Check balance: https://mumbai.polygonscan.com/address/' + wallet.address + '\n');
