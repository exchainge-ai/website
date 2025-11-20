#!/bin/bash
# Demo script for Walrus + Sui licensing flow
# Shows complete end-to-end dataset upload and licensing

set -e

API_URL="${API_URL:-http://localhost:4000/api}"
DATASET_FILE="${1:-example-dataset.zip}"

echo "ExchAInge - Walrus Licensing Demo"
echo ""

# Check if dataset file exists
if [ ! -f "$DATASET_FILE" ]; then
    echo "Error: Dataset file not found: $DATASET_FILE"
    echo ""
    echo "Usage: ./demo-walrus-flow.sh <dataset-file>"
    echo "Example: ./demo-walrus-flow.sh mydata.zip"
    exit 1
fi

echo "Dataset file: $DATASET_FILE"
echo "API URL: $API_URL"
echo ""

# Step 1: Upload to Walrus
echo "Step 1: Uploading dataset to Walrus..."

UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/upload-to-walrus" \
  -F "file=@$DATASET_FILE" \
  -F "title=Demo Dataset - $(date +%Y%m%d%H%M%S)" \
  -F "description=Test dataset for Walrus hackathon demo")

echo "Response: $UPLOAD_RESPONSE"
echo ""

# Extract blob ID
BLOB_ID=$(echo $UPLOAD_RESPONSE | jq -r '.blobId')

if [ "$BLOB_ID" == "null" ] || [ -z "$BLOB_ID" ]; then
    echo "Error: Failed to upload to Walrus"
    echo "Response: $UPLOAD_RESPONSE"
    exit 1
fi

echo "✓ Upload complete!"
echo "Blob ID: $BLOB_ID"
echo ""

# Step 2: Register onchain
echo "Step 2: Registering dataset onchain..."

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/datasets/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"blobId\": \"$BLOB_ID\",
    \"title\": \"Demo Dataset\",
    \"description\": \"Physical AI dataset stored on Walrus\",
    \"filename\": \"$(basename $DATASET_FILE)\",
    \"size\": $(stat -f%z "$DATASET_FILE"),
    \"category\": \"sensor_data\",
    \"priceUsd\": 10,
    \"licenseType\": \"view_only\"
  }")

echo "Response: $REGISTER_RESPONSE"
echo ""

DATASET_ID=$(echo $REGISTER_RESPONSE | jq -r '.datasetId')
TX_DIGEST=$(echo $REGISTER_RESPONSE | jq -r '.txDigest')

if [ "$DATASET_ID" == "null" ] || [ -z "$DATASET_ID" ]; then
    echo "Error: Failed to register dataset"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

echo "✓ Dataset registered!"
echo "Dataset ID: $DATASET_ID"
echo "Transaction: $TX_DIGEST"
echo ""

# Step 3: Sync events
echo "Step 3: Syncing blockchain events..."

sleep 2 # Wait for events to be available

SYNC_RESPONSE=$(curl -s -X POST "$API_URL/licenses/sync")
echo "Response: $SYNC_RESPONSE"
echo ""

# Step 4: Verify dataset exists
echo "Step 4: Verifying dataset in marketplace..."

DATASETS_RESPONSE=$(curl -s "$API_URL/datasets")
DATASET_COUNT=$(echo $DATASETS_RESPONSE | jq '.data | length')

echo "✓ Found $DATASET_COUNT datasets in marketplace"
echo ""

# Step 5: Show next steps
echo "Demo Complete!"
echo ""
echo "What happened:"
echo "1. Dataset uploaded to Walrus → Blob ID: $BLOB_ID"
echo "2. Dataset registered onchain → Tx: $TX_DIGEST"
echo "3. Dataset stored in database → ID: $DATASET_ID"
echo "4. Dataset now available in marketplace"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3000/marketplace to see the dataset"
echo "2. Visit http://localhost:3000/license to mint a license"
echo "3. Verify license ownership via API:"
echo ""
echo "   curl -X POST $API_URL/licenses/verify \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"dataset_cid\": \"$BLOB_ID\", \"licensee_address\": \"0x_your_address\"}'"
echo ""
