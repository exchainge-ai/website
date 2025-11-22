# Walrus Integration Setup

## Deployed and Working

- Sui Move contract deployed: 0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb
- Sui wallet funded and active: 0xfaf139fe9c3bf108d0bb5e9c01b71a8232016fbd7415f9ea5bc21a09534f4004
- Walrus testnet integration complete
- Database schema migrated with Walrus fields

## Running Locally

```bash
git clone https://github.com/exchainge-ai/website
cd website
cp .env.example .env
# Edit .env with your credentials
```

### 2. Install Dependencies

```bash
cd backend/packages/webapp && npm install
cd ../../../frontend && npm install
```

### 3. Start Services

```bash
# Terminal 1 - Backend
cd backend/packages/webapp && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 4. Test Upload

1. Visit http://localhost:3000/upload
2. Select file
3. Enter title and description
4. Click upload
5. Verify receipt modal shows transaction digest

## Docker Deployment

```bash
cp .env.example .env
# Edit .env
docker compose up -d
docker compose ps
docker compose logs -f
```

Access at http://localhost

## Verify Integration

Check transactions:
- SuiScan: https://suiscan.xyz/testnet/tx/{digest}
- Wallet: https://suiscan.xyz/testnet/account/0xfaf139fe9c3bf108d0bb5e9c01b71a8232016fbd7415f9ea5bc21a09534f4004
- Contract: https://suiscan.xyz/testnet/object/0x7b79e60b89146533b040ee32ac8e6f6bbcda92169ce1bb70882e59de0062f0cb

## Configuration

- Walrus Network: testnet
- Storage Duration: 5 epochs
- Publisher: https://publisher.walrus-testnet.walrus.space
- Aggregator: https://aggregator.walrus-testnet.walrus.space

## Troubleshooting

**Upload fails with 404:**
- Verify WALRUS_NETWORK=testnet in .env
- Check Walrus testnet is online

**Transaction fails:**
- Check wallet has sufficient SUI for gas
- Verify NEXT_PUBLIC_SUI_PACKAGE_ID is correct
- Confirm WALRUS_SIGNER_KEY is base64 encoded

**Database errors:**
- Run migration: backend/packages/supabase/migrations/20251121000000_add_walrus_sui_fields.sql
- Check SUPABASE_SERVICE_ROLE_KEY has write permissions

**Connection refused:**
- Verify backend running on port 3001
- Verify frontend running on port 3000
- Check NEXT_PUBLIC_API_BASE_URL matches backend port
