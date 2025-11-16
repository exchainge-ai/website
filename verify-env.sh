#!/bin/bash

# ExchAInge Environment Variable Verification Script
# Checks that all required environment variables are set before deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "ExchAInge Environment Verification"
echo ""

MISSING=0
WARNINGS=0

# Function to check required variable
check_required() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d'=' -f2-)

    if [ -z "$var_value" ] || [[ "$var_value" == *"your_"* ]] || [[ "$var_value" == *"https://your-"* ]]; then
        echo -e "${RED}✗ MISSING${NC} $var_name"
        MISSING=$((MISSING + 1))
        return 1
    else
        echo -e "${GREEN}✓${NC} $var_name"
        return 0
    fi
}

# Function to check optional variable
check_optional() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d'=' -f2-)

    if [ -z "$var_value" ] || [[ "$var_value" == *"your_"* ]]; then
        echo -e "${YELLOW}⚠ OPTIONAL${NC} $var_name (not set)"
        WARNINGS=$((WARNINGS + 1))
        return 1
    else
        echo -e "${GREEN}✓${NC} $var_name"
        return 0
    fi
}

# Check .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo "Run: cp .env.example .env"
    echo "Then fill in your credentials"
    exit 1
fi

echo "=== Core Application ==="
check_required "NEXT_PUBLIC_SUPABASE_URL"
check_required "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_required "SUPABASE_SERVICE_ROLE_KEY"
echo ""

echo "=== Application URLs ==="
check_required "NEXT_PUBLIC_APP_URL"
check_required "NEXT_PUBLIC_API_BASE_URL"
echo ""

echo "=== Privy Authentication ==="
check_required "NEXT_PUBLIC_PRIVY_APP_ID"
check_required "NEXT_PUBLIC_PRIVY_CLIENT_ID"
check_required "PRIVY_APP_SECRET"
echo ""

echo "=== Redis Cache ==="
check_required "UPSTASH_REDIS_REST_URL"
check_required "UPSTASH_REDIS_REST_TOKEN"
echo ""

echo "=== Cloudflare R2 Storage ==="
check_required "R2_ACCESS_KEY_ID"
check_required "R2_SECRET_ACCESS_KEY"
check_required "R2_ENDPOINT"
check_required "R2_BUCKET_NAME"
echo ""

echo "=== Solana Blockchain ==="
check_required "NEXT_PUBLIC_SOLANA_RPC_URL"
check_required "SOLANA_WALLET_PRIVATE_KEY"
check_required "SOLANA_DATASET_PRICE_SOL"
echo ""

echo "=== Optional Features ==="
check_optional "AGENT_WALLET_PRIVATE_KEY"
check_optional "AGENT_ACCESS_TOKEN"
check_optional "AGENT_MAX_PRICE"
echo ""

# Validate URL formats
echo "=== URL Validation ==="

APP_URL=$(grep "^NEXT_PUBLIC_APP_URL=" .env | cut -d'=' -f2-)
if [[ "$APP_URL" == http://localhost* ]]; then
    echo -e "${GREEN}✓${NC} NEXT_PUBLIC_APP_URL is localhost (development mode)"
elif [[ "$APP_URL" == https://* ]]; then
    echo -e "${GREEN}✓${NC} NEXT_PUBLIC_APP_URL is HTTPS (production mode)"
else
    echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_APP_URL should use http://localhost or https://"
    WARNINGS=$((WARNINGS + 1))
fi

API_URL=$(grep "^NEXT_PUBLIC_API_BASE_URL=" .env | cut -d'=' -f2-)
if [[ "$API_URL" == http://localhost/api* ]] || [[ "$API_URL" == https://*/api ]]; then
    echo -e "${GREEN}✓${NC} NEXT_PUBLIC_API_BASE_URL points to nginx reverse proxy"
elif [[ "$API_URL" == *"backend"* ]] || [[ "$API_URL" == *":4000"* ]]; then
    echo -e "${RED}✗ ERROR${NC} NEXT_PUBLIC_API_BASE_URL points to Docker internal hostname"
    echo "   Browser cannot resolve 'backend' or port 4000"
    echo "   Change to: http://localhost/api (or your domain + /api)"
    MISSING=$((MISSING + 1))
else
    echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_API_BASE_URL format looks unusual"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Summary
echo "========================================"
if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✓ All required variables are set${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS optional variables not set${NC}"
    fi
    echo ""
    echo "Ready to deploy:"
    echo "  docker compose build"
    echo "  docker compose up -d"
    exit 0
else
    echo -e "${RED}✗ $MISSING required variables missing${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS optional variables not set${NC}"
    fi
    echo ""
    echo "Fix .env file before deploying"
    exit 1
fi
