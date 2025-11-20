# ExchAInge

**Provably authentic physical AI datasets with atomic onchain licensing.**

Built for hackathon - Data Economy & Marketplaces track.

## What This Is

A marketplace for physical AI training data (drone footage, robot telemetry, sensor logs) with blockchain-backed licensing that makes data **reliable, valuable, and governable**.

The problem: AI companies need training data. Dataset creators need proof they own it and control who uses it. Current solutions rely on legal contracts and trust.

Our solution: Onchain licensing using Sui Move. Upload a dataset, register its hash onchain, issue license NFTs to buyers. No lawyers, no ambiguity, just cryptographic proof.

We built **atomic license issuance** where minting and ownership transfer happen in one transaction. The license is an NFT, ownership is native to Sui, and events create an immutable audit trail. This makes physical AI datasets provably authentic and traceable.

## Why It Matters

**Data Economy & Marketplaces**: Physical AI datasets are valuable but hard to monetize without proof of ownership. Our onchain licensing creates a transparent marketplace where creators set terms and buyers get cryptographic proof.

**Provably Authentic**: Every license is an NFT with an immutable creation event. You can prove when it was issued, to whom, and under what terms. No he-said-she-said.

**Interoperable by Design**: Our architecture is chain-agnostic:
- **Event-driven sync** - Backend listens for `LicenseIssued` events from any chain
- **Portable verification** - License checks work regardless of which chain issued them
- **Atomic guarantees** - Transaction either fully succeeds or fully fails
- **Cross-chain ready** - Same pattern works on Aptos, Solana, EVM chains

We already have a Solana program deployed on mainnet. Adding Sui took an afternoon because events are universal.

**Walrus Integration Opportunity**: Dataset storage could use Walrus for provable, tamper-resistant large file storage. License metadata lives onchain, actual data lives on Walrus, creating end-to-end verifiability.

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

## Walrus Integration

We integrated Walrus decentralized storage for provably authentic dataset hosting:

**Flow**:
1. Upload dataset file → Walrus storage → Get blob ID
2. Register blob ID onchain → Sui Move contract → Emit event
3. Issue license NFT → References Walrus blob ID → Atomic ownership
4. Retrieve dataset → Walrus blob ID → Tamper-proof verification

**Benefits**:
- **Provable storage** - Guarantee dataset hasn't been modified since registration
- **Decentralized** - No single point of failure, censorship-resistant
- **Cost-efficient** - Store gigabytes of sensor data at reasonable cost
- **High performance** - Fast reads for AI training pipelines

**How to Upload**:
```bash
# Via frontend
Visit: http://localhost:3000/upload
# Fill in metadata and drag-drop your dataset file

# Via API
curl -X POST http://localhost:4000/api/upload-to-walrus \
  -F "file=@mydata.zip" \
  -F "title=My Dataset" \
  -F "description=Physical AI sensor data"

# Returns blob ID for onchain registration
```

**Demo Script**:
```bash
./demo-walrus-flow.sh your-dataset.zip
# Shows complete upload → register → verify flow
```

## Built By

Two engineers who think AI training data should come with cryptographic receipts, not legal PDFs.
