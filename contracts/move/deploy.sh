#!/bin/bash
# Deploy script for Sui Move license contract

set -e

echo "Building Sui Move contract..."
sui move build

echo ""
echo "Publishing to Sui testnet..."
echo "Make sure you have SUI tokens in your wallet for gas"
echo ""

# Publish contract
PUBLISH_OUTPUT=$(sui client publish --gas-budget 100000000 --json)

# Extract package ID
PACKAGE_ID=$(echo $PUBLISH_OUTPUT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')

echo ""
echo "Contract deployed successfully!"
echo ""
echo "Package ID: $PACKAGE_ID"
echo ""
echo "Add this to your .env files:"
echo "NEXT_PUBLIC_SUI_PACKAGE_ID=$PACKAGE_ID"
echo "NEXT_PUBLIC_SUI_NETWORK=testnet"
echo ""
