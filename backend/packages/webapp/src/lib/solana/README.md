# Solana Smart Contract Integration

Everything you need to connect your backend to the deployed Solana program.

## Setup

### 1. Environment Variables

Add these to your `.env.local` in `packages/webapp/`:

```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com
SOLANA_WALLET_PRIVATE_KEY=your_base58_private_key
```

Get your wallet's private key in base58 format if you have a JSON keypair file:
```bash
node -e "console.log(require('bs58').encode(Buffer.from(require('./keypair.json'))))"
```

### 2. Start Using It

See [example.ts](./example.ts) for complete examples. The main functions you'll use are in [client.ts](./client.ts):

- **Register a dataset** - Creates new on-chain record (~0.002 SOL rent + small tx fee)
- **Update a dataset** - Change the hash for existing record (small tx fee)
- **Fetch registry** - Read data from chain (free)
- **Fetch all by owner** - Get all your registries (free)
- **Close registry** - Delete and get rent back (small tx fee, refunds ~0.002 SOL)

## What's Deployed

**Program ID:** `ERtSQNoAiE3p1zP6W6hmyc4da6HxrpPED2SsD7Ds3Mck`
**Network:** Devnet
**Explorer:** [View here](https://explorer.solana.com/address/ERtSQNoAiE3p1zP6W6hmyc4da6HxrpPED2SsD7Ds3Mck?cluster=devnet)

Optional price override for on-chain registrations:

```
SOLANA_DATASET_PRICE_SOL=0.1
```

## Files

- `idl.json` - Contract interface (auto-generated from program)
- `client.ts` - Main functions to interact with the contract
- `example.ts` - Working examples showing how to use each function

## Notes

- Dependencies are already installed in your package.json
- For mainnet, just change the RPC URL to `https://api.mainnet-beta.solana.com`
- Max 64 characters for both internal_key and dataset_hash
