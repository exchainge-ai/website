# Sui Move License Contract

Simple onchain licensing for physical AI datasets.

## Contract Overview

The contract provides three main functions:

1. **register_dataset** - Register a dataset with CID
2. **issue_license** - Issue a license NFT to a user
3. **revoke_license** - Revoke an existing license

## Local Development

### Prerequisites

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### Build

```bash
cd contracts/move
sui move build
```

### Test

```bash
sui move test
```

### Deploy to Testnet

```bash
# Set up Sui wallet if needed
sui client

# Publish contract
sui client publish --gas-budget 100000000
```

The publish command will output:
- Package ID (save this to .env as NEXT_PUBLIC_SUI_PACKAGE_ID)
- Transaction digest

## Contract Functions

### register_dataset

Registers a dataset onchain.

```typescript
// Arguments
cid: string          // Dataset content identifier
title: string        // Dataset title
clock: Clock         // Sui clock object (0x6)
```

### issue_license

Issues a license NFT to a user.

```typescript
// Arguments
dataset_cid: string           // CID of the dataset
licensee: address             // Who receives the license
license_type: string          // Type: "personal", "commercial", etc
expiry_duration_ms: number    // Duration in ms (0 = never expires)
clock: Clock                  // Sui clock object (0x6)
```

### revoke_license

Revokes a previously issued license.

```typescript
// Arguments
license: License      // License object to revoke
clock: Clock          // Sui clock object (0x6)
```

## Events

The contract emits events that the backend indexes:

- **DatasetRegistered** - When a dataset is registered
- **LicenseIssued** - When a license is created
- **LicenseRevoked** - When a license is revoked

## Integration

See backend integration in:
- `backend/packages/webapp/lib/blockchain/sui-license.ts`
- `backend/packages/webapp/workers/sync-sui-licenses.ts`

Frontend integration in:
- `frontend/src/app/license/page.tsx`
