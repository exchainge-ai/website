#!/bin/bash
# Quick test script for local development

set -e

echo "Testing ExchAInge Sui Licensing Locally"
echo ""

# Check if dependencies are installed
echo "1. Checking dependencies..."

if [ ! -d "backend/packages/webapp/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend/packages/webapp
    npm install
    cd ../../..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "✓ Dependencies installed"
echo ""

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "Please edit .env and add your credentials before continuing"
    exit 1
fi

echo "✓ .env file exists"
echo ""

# Check if Sui package is configured
if ! grep -q "NEXT_PUBLIC_SUI_PACKAGE_ID" .env || grep -q "0x_your" .env; then
    echo "⚠ Sui contract not deployed yet"
    echo ""
    echo "Deploy it with:"
    echo "  cd contracts/move"
    echo "  sui move build"
    echo "  ./deploy.sh"
    echo ""
    echo "Then add the Package ID to .env"
    echo ""
fi

# Start services
echo "========================================="
echo "Starting Services"
echo "========================================="
echo ""
echo "Choose mode:"
echo "1. Docker Compose"
echo "2. Local development (3 terminals)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "Starting with Docker Compose..."
    docker compose up -d
    echo ""
    echo "Services started!"
    echo "Frontend: http://localhost"
    echo "Backend: http://localhost/api"
    echo "License page: http://localhost/license"
    echo ""
    echo "View logs: docker compose logs -f"
    echo "Stop: docker compose down"

elif [ "$choice" == "2" ]; then
    echo ""
    echo "Starting local development servers..."
    echo ""
    echo "Open 3 terminals and run:"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd backend/packages/webapp"
    echo "  bun run dev"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd frontend"
    echo "  npm run dev"
    echo ""
    echo "Terminal 3 (License Sync Worker):"
    echo "  cd backend/packages/webapp"
    echo "  bun run workers/sync-sui-licenses.ts"
    echo ""
    echo "Then visit:"
    echo "  Frontend: http://localhost:3000"
    echo "  License page: http://localhost:3000/license"
    echo ""
fi

echo ""
echo "========================================="
echo "Testing Checklist"
echo "========================================="
echo ""
echo "1. Visit http://localhost:3000/license (or http://localhost/license for Docker)"
echo "2. Click 'Connect Wallet'"
echo "3. Connect your Sui wallet"
echo "4. Click 'Mint License' on a dataset"
echo "5. Approve transaction in wallet"
echo "6. Wait ~30 seconds"
echo "7. License should appear in table"
echo ""
echo "Verify via API:"
echo "  curl -X POST http://localhost:4000/api/licenses/verify \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"dataset_cid\": \"your_cid\", \"licensee_address\": \"0x_your_address\"}'"
echo ""
