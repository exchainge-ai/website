# ExchAInge

Data marketplace for physical AI datasets with decentralized storage and onchain licensing.

## Smart Contracts

**Sui Move Contract (Testnet)**
Package: `0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb`
Explorer: https://suiscan.xyz/testnet/object/0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/exchainge-ai/website
cd website
cp .env.example .env

# 2. Configure .env
# - Add Supabase credentials (https://supabase.com/dashboard)
# - Add Privy credentials (https://console.privy.io)
# - Add Redis credentials (https://console.upstash.com)
# - Add R2 credentials (https://dash.cloudflare.com)
# - Add Walrus signer key (base64-encoded Sui private key)
# - Set SUI_PACKAGE_ID to deployed contract address above

# 3. Setup database
# Go to Supabase SQL Editor and run all migrations in order:
# - backend/packages/supabase/migrations/001_initial_schema.sql
# - backend/packages/supabase/migrations/20251023213540_add_blockchain_fields.sql
# - backend/packages/supabase/migrations/20251023215417_add_upload_tracking.sql
# - backend/packages/supabase/migrations/20251024011919_add_licensing_and_attestations.sql
# - backend/packages/supabase/migrations/20251024014956_update_license_type_constraint.sql
# - backend/packages/supabase/migrations/20251025021000_add_discovery_entries.sql
# - backend/packages/supabase/migrations/20251025030000_fix_security_vulnerabilities.sql
# - backend/packages/supabase/migrations/20251119000000_add_onchain_licenses.sql
# - backend/packages/supabase/migrations/20251121000000_add_walrus_sui_fields.sql

# 4. Install and run
cd backend/packages/webapp && npm install && npm run dev  # Port 4000
cd frontend && npm install && npm run dev                 # Port 3000
```

Open http://localhost:3000

## How It Works

**Upload Flow:**
1. User uploads dataset file -> Walrus decentralized storage -> Returns blob ID
2. Register blob ID -> Sui Move contract ([sui-license.ts:28](backend/packages/webapp/src/lib/blockchain/sui-license.ts#L28))
3. Transaction signed and executed -> Returns digest
4. Save to database -> Dataset appears in marketplace

**License Flow:**
1. User mints license NFT -> Calls contract ([sui-license.ts:49](backend/packages/webapp/src/lib/blockchain/sui-license.ts#L49))
2. NFT transferred to buyer wallet -> Atomic ownership
3. Emits event → Backend indexes it -> Queryable via API

**Key Files:**
- Upload API: [backend/packages/webapp/src/app/api/upload-to-walrus/route.ts](backend/packages/webapp/src/app/api/upload-to-walrus/route.ts)
- Register API: [backend/packages/webapp/src/app/api/datasets/register/route.ts](backend/packages/webapp/src/app/api/datasets/register/route.ts)
- Walrus client: [backend/packages/webapp/src/lib/walrus/client.ts](backend/packages/webapp/src/lib/walrus/client.ts)
- Sui blockchain: [backend/packages/webapp/src/lib/blockchain/sui-license.ts](backend/packages/webapp/src/lib/blockchain/sui-license.ts)
- Move contract: [contracts/move/sources/license.move](contracts/move/sources/license.move)

## Project Structure

```
backend/packages/webapp/     # Next.js API backend
  src/app/api/               # REST endpoints
  src/lib/blockchain/        # Sui transaction builders
  src/lib/walrus/            # Walrus storage client
  src/lib/db/                # Database queries

frontend/                    # Next.js frontend
  src/app/                   # Pages
  src/components/            # UI components
  src/lib/                   # API clients

contracts/move/              # Sui Move smart contract
  sources/license.move       # Core licensing logic
```

## Tech Stack

- **Storage:** Walrus decentralized storage (testnet)
- **Blockchain:** Sui (testnet)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash Redis
- **Auth:** Privy
- **Backend:** Next.js 15 API routes
- **Frontend:** Next.js 15 + React 19

## API

See [backend/packages/webapp/API.md](backend/packages/webapp/API.md) for full API documentation.

**Quick examples:**
```bash
# Upload to Walrus
POST /api/upload-to-walrus
# Returns: { blobId, size, epochs }

# Register dataset
POST /api/datasets/register
# Returns: { datasetId, txDigest, blobId }

# List datasets
GET /api/datasets
# Returns: { datasets: [...] }
```

## Deployment

See [WALRUS_SETUP.md](WALRUS_SETUP.md) for Walrus configuration and deployment notes.

## Features

- **Walrus Storage** - Datasets stored on decentralized storage, up to 13.3 GiB per file
- **Sui Smart Contracts** - On-chain dataset registry and NFT licenses for purchases
- **Privy Auth** - Login with email, socials, or wallets
- **Direct Downloads** - Buy once, download directly from Walrus
- **Platform-Sponsored Transactions** - No gas fees for demo users

**Coming Soon:**
- x402 integration which will be integrated into this branch(walrus) from x402 branch
- LLM that verifies dataset contents(already implemented an early version, needs improvement but will also be copied into walrus branch).

Essentially, features are 80% done just needs improvements and battle tested. Then implementations should be smooth to integrate into walrus then into main branch soon!


## Note 

As shown in demo, this Sui + walrus storage integration does work. If for some reason you have any issues, email me at rtavarez.cs@gmail.com!