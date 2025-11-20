# ExchAInge

Physical AI dataset marketplace with onchain licensing and verification.

## What This Is

We built a marketplace where you can upload sensor data (drone footage, robot telemetry, whatever) and license it using blockchain-backed proof. Think of it as a way to prove "this dataset exists, I own it, and you have permission to use it" without needing lawyers or trust.

For the Hackathon, we added **Sui Move smart contracts** for atomic license issuance. The idea is simple: datasets get registered onchain, licenses are NFTs, and access is provably granted via events. This pattern works on any chain with events and shared objects.

## Why It Matters

The interoperability story is key here. Our architecture uses:
- **Event-driven sync** - Backend listens for `LicenseIssued` events from any chain
- **Chain-agnostic verification** - License verification checks the DB, which syncs from whatever chain you deployed on
- **Atomic licensing** - License minting and ownership transfer happen in one transaction
- **Extensible to other chains** - Same pattern works on Aptos, Solana, EVM chains with minimal changes

We already have a Solana program deployed on mainnet. Adding Sui took an afternoon because the event model is portable.

## Quick Start

### Prerequisites

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui

# Verify
sui --version
```

### Setup

```bash
# 1. Clone and install
git clone https://github.com/exchainge-ai/website
cd website
cp .env.example .env

# 2. Install dependencies
cd backend/packages/webapp && npm install
cd ../../../frontend && npm install

# 3. Setup Sui wallet
sui client
# Create or import a wallet, then fund it at https://faucet.sui.io

# 4. Deploy Move contract
cd ../contracts/move
sui move build
./deploy.sh
# Copy the Package ID it outputs

# 5. Configure environment
# Add to .env:
NEXT_PUBLIC_SUI_PACKAGE_ID=0x_your_package_id
NEXT_PUBLIC_SUI_NETWORK=testnet

# Plus your Supabase, Privy, R2, Redis credentials (see .env.example)

# 6. Run database migration
# Apply: backend/packages/supabase/migrations/20251119000000_add_onchain_licenses.sql

# 7. Start services
docker compose up -d

# OR run locally:
# Terminal 1: cd backend/packages/webapp && bun run dev
# Terminal 2: cd frontend && npm run dev
# Terminal 3: cd backend/packages/webapp && bun run workers/sync-sui-licenses.ts
```

### Test It

Run the test script to help you get started:

```bash
./test-local.sh
```

Or manually test:

```bash
# 1. Visit the license page
# Docker: http://localhost/license
# Local: http://localhost:3000/license

# 2. Connect your Sui wallet (install Sui Wallet extension first)

# 3. Click "Mint License" on any dataset

# 4. Approve the transaction in your wallet

# 5. Wait ~30 seconds for the sync worker to index it

# 6. Your license will appear in the "Your Licenses" table
```

Verify it worked via API:
```bash
curl -X POST http://localhost:4000/api/licenses/verify \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_cid": "your_dataset_storage_key",
    "licensee_address": "0x_your_sui_address"
  }'
```

Should return `{ "has_license": true }`.

## How It Works

### Architecture

```
User mints license → Sui Move Contract
                     ├─ Emits LicenseIssued event
                     └─ Transfers License NFT to user

Backend Worker polls events every 30s
                     ├─ Reads new events
                     ├─ Saves to Postgres (onchain_licenses table)
                     └─ Enables fast API queries

Frontend or API can verify license
                     └─ Query DB or check NFT ownership directly
```

### Smart Contract

The Move contract is intentionally minimal. Three functions:

1. **register_dataset** - Register a dataset CID onchain
2. **issue_license** - Mint a license NFT and transfer to buyer
3. **revoke_license** - Mark a license as revoked

License is an owned object, so transfer and ownership are native to Sui. Events get emitted for backend indexing.

See `contracts/move/sources/license.move` for the full implementation.

### Chain Extensibility

This pattern is portable:
- **Sui** - Uses shared objects and events (current implementation)
- **Aptos** - Same Move syntax, slightly different object model
- **Solana** - Events via CPI, anchor handles serialization
- **EVM chains** - Events via logs, similar sync pattern

The key insight: **events are the source of truth**. Backend syncs from events, DB is just a cache. Switching chains means swapping the event poller, not rewriting the app.

### Why Atomic Licensing Works

Traditional licensing requires:
1. User pays
2. System checks payment
3. System grants access
4. Hope nothing breaks between steps 2 and 3

Onchain licensing:
1. User signs transaction
2. Contract atomically: verifies payment, mints NFT, transfers ownership
3. Event proves it happened

No in-between state. No "payment succeeded but license failed to issue." Either the whole thing works or none of it does.

## What's Where

```
contracts/move/              # Sui Move license contract
  sources/license.move       # Core contract logic
  Move.toml                  # Package config
  deploy.sh                  # One-command deploy

backend/packages/webapp/
  lib/blockchain/
    sui-license.ts           # Transaction builders, event parsers
  lib/db/
    onchain-licenses.ts      # DB operations for licenses
  workers/
    sync-sui-licenses.ts     # Event indexer (polls every 30s)
  src/app/api/licenses/
    route.ts                 # Query user licenses or dataset licenses
    verify/route.ts          # Check if address has valid license

frontend/src/
  app/license/page.tsx       # UI for minting and viewing licenses
  components/providers/
    SuiProvider.tsx          # Sui wallet integration
```

## API

### GET /api/licenses

Query licenses by address or dataset.

```bash
# Get licenses owned by an address
GET /api/licenses?address=0x123...&active_only=true

# Get licenses issued for a dataset
GET /api/licenses?dataset_cid=Qm123...
```

### POST /api/licenses/verify

Check if an address has a valid license for a dataset.

```bash
POST /api/licenses/verify
{
  "dataset_cid": "storage_key_or_cid",
  "licensee_address": "0x123..."
}

# Returns:
{
  "has_license": true,
  "dataset_cid": "...",
  "licensee_address": "0x..."
}
```

### POST /api/licenses/sync

Manually trigger event sync from blockchain.

```bash
POST /api/licenses/sync

# Returns:
{
  "success": true,
  "synced": { "issued": 5, "revoked": 1 }
}
```

## Troubleshooting

**Contract not deployed?**
```bash
cd contracts/move && ./deploy.sh
# Add package ID to .env
```

**Wallet not connecting?**
- Install Sui Wallet browser extension
- Fund at https://faucet.sui.io

**Licenses not showing up?**
- Check sync worker is running
- Manually trigger: `POST /api/licenses/sync`
- Check Package ID in .env matches deployed contract

**Transaction fails?**
- Make sure wallet has SUI for gas
- Verify Package ID is correct
- Check browser console for errors

## Production Deployment

Standard Docker setup:

```bash
# On your VPS
curl -fsSL https://get.docker.com | sh
git clone https://github.com/exchainge-ai/website
cd website
cp .env.example .env
nano .env  # Add production credentials

# Update URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api

# Deploy
docker compose up -d
```

For SSL, use certbot:
```bash
apt-get install certbot
certbot certonly --standalone -d yourdomain.com
mkdir -p ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

## Repos

- **This monorepo**: https://github.com/exchainge-ai/website
- **Solana program**: https://github.com/exchainge-ai/exchainge-program
- **Solana mainnet**: [3tK3ejf1JWJPei5Nh19Wj3GZtvZ6KoCBfYTnPbhVAHk1](https://explorer.solana.com/address/3tK3ejf1JWJPei5Nh19Wj3GZtvZ6KoCBfYTnPbhVAHk1)

## TODO Post-Hackathon

This is hackathon code. It works, but here's what we'd change for production:

1. **Move contracts to separate repo** - Smart contracts should have their own versioning, CI/CD, and audit trails
2. **Persistent cursor storage** - Right now the sync worker resets on restart. Store cursor in DB.
3. **Retry logic** - Handle RPC failures, network issues, rate limits
4. **Mainnet deployment** - Currently on testnet
5. **Security audit** - Get the contract professionally audited before real money touches it

See `contracts/README.md` for notes on why contracts should be in a separate repo long-term.

## Built By

Two engineers who care about datasets being verifiable and licensing being provable. We think AI training data should come with receipts.
