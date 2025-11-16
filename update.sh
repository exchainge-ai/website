#!/bin/bash
set -e

# Quick update script - pulls code and restarts without rebuilding
# Use this when you know dependencies haven't changed

echo "ExchAInge Quick Update"
echo ""

# Pull latest code
echo "Pulling latest changes..."
cd backend && git pull origin main && cd ..
cd frontend && git pull origin main && cd ..

# Restart services (no rebuild)
echo "Restarting services..."
docker compose restart

echo ""
echo "Update complete. Services restarted."
echo ""
echo "Note: If dependencies changed, run ./deploy.sh instead to rebuild."
