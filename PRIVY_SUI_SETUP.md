# Privy + Sui Wallet Setup

Automated wallet creation and funding for seamless user onboarding.

## How It Works

### User Authentication
Users sign in via Privy using email, Google, GitHub, or an external wallet. Privy automatically creates embedded wallets without requiring seed phrases or manual configuration.

### Testnet Auto-Funding
When a user initiates a purchase on testnet, the system automatically funds their Sui wallet by calling the Sui testnet faucet API. This provides 1 SUI for gas fees without user intervention.

### Purchase Flow
1. User clicks "Purchase" on a dataset
2. Payment transaction built with SUI transfer to seller
3. User approves transaction in Privy modal
4. Backend verifies payment and mints license NFT
5. User receives license in their wallet

## Configuration

### Privy Dashboard
Configure at https://dashboard.privy.io:
- Enable embedded wallets
- Set creation mode to "users-without-wallets"
- Add Sui testnet to supported chains

### Environment Variables
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_client_id
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## Implementation

### Frontend Wallet Provider
File: `frontend/src/components/providers/PrivyWrapper.tsx`

Configures Privy with embedded wallet creation and Sui chain support. Wraps app with necessary providers for Sui dApp Kit integration.

### Backend Faucet Endpoint
File: `backend/packages/webapp/src/app/api/sui/fund-wallet/route.ts`

Calls Sui testnet faucet to fund user wallets automatically before purchase transactions.

### Purchase Modal
File: `frontend/src/components/modals/PurchaseLicenseModal.tsx`

Handles auto-funding check, transaction building, and user approval flow for dataset purchases.

## Testnet vs Production

**Testnet:**
- Wallets auto-funded via faucet
- No real value at risk
- Ideal for demos and testing

**Production:**
- Users fund wallets manually or connect external wallets
- Real SUI required for transactions
- Same purchase flow otherwise

## Testing

1. Navigate to http://localhost:3000
2. Sign in with any supported method
3. Wallet created automatically
4. Click "Purchase" on marketplace dataset
5. Approve transaction (wallet funded if testnet)
6. Verify license NFT and transactions on SuiScan

Total time from sign-in to license ownership: approximately 30 seconds.
