#!/bin/bash
set -e

echo "🚀 ExchAInge Smart Contract - Testnet Deployment"
echo "================================================"
echo ""

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor not found. Please install: https://www.anchor-lang.com/docs/installation"
    exit 1
fi

echo "✅ Solana CLI and Anchor found"
echo ""

# Switch to testnet
echo "📡 Switching to Solana testnet..."
solana config set --url testnet

# Check wallet balance
echo ""
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

# Parse balance (remove " SOL" suffix)
BALANCE_NUM=$(echo $BALANCE | sed 's/ SOL//')

# Check if balance is sufficient (need at least 2 SOL for deployment)
if (( $(echo "$BALANCE_NUM < 2" | bc -l) )); then
    echo ""
    echo "⚠️  Low balance detected. You need at least 2 SOL for deployment."
    echo "Getting testnet SOL from faucet (0.5 SOL at a time to avoid rate limits)..."
    echo ""

    # Request smaller airdrops to avoid rate limiting (0.5 SOL usually works)
    SUCCESS=0
    for i in {1..6}; do
        echo "Request $i/6: Requesting 0.5 SOL..."
        if solana airdrop 0.5 2>/dev/null; then
            echo "✅ Got 0.5 SOL"
            SUCCESS=$((SUCCESS + 1))
            sleep 2
        else
            echo "⚠️  Rate limited or failed. Waiting 8 seconds..."
            sleep 8
        fi

        # Check if we have enough now
        CURRENT=$(solana balance | sed 's/ SOL//')
        if (( $(echo "$CURRENT >= 2" | bc -l) )); then
            echo "✅ Sufficient balance reached!"
            break
        fi
    done

    echo ""
    BALANCE=$(solana balance)
    echo "Final balance: $BALANCE"

    BALANCE_NUM=$(echo $BALANCE | sed 's/ SOL//')
    if (( $(echo "$BALANCE_NUM < 1" | bc -l) )); then
        echo ""
        echo "⚠️  Still low balance ($BALANCE_NUM SOL). Options:"
        echo "1. Wait 5-10 minutes and run: solana airdrop 0.5 (repeat as needed)"
        echo "2. Use web faucet: https://faucet.solana.com/"
        echo "3. Try devnet instead: solana config set --url devnet"
        echo ""
        echo "Exiting. Please get more SOL and run this script again."
        exit 1
    fi
fi

echo ""
echo "🔨 Building smart contract..."
cd packages/smart_contracts
anchor build

echo ""
echo "📤 Deploying to testnet..."
echo ""

# Deploy with confirmation
anchor deploy --provider.cluster testnet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the deployed Program ID from output above"
echo "2. Update Anchor.toml [programs.testnet] with new Program ID"
echo "3. Update lib.rs declare_id!() with new Program ID"
echo "4. Run 'anchor build' again to rebuild with correct ID"
echo "5. Update NEXT_PUBLIC_SOLANA_PROGRAM_ID in .env"
echo "6. Test the deployment with: bun run scripts/test-testnet.ts"
echo ""
echo "🔗 View your program on Solana Explorer:"
echo "https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=testnet"
