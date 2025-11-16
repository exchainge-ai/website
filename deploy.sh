#!/bin/bash
set -e

echo "ExchAInge Deployment Script"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Copy .env.example to .env and configure your values:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Pull latest code
echo -e "${YELLOW}Pulling latest code from GitHub...${NC}"
cd backend && git pull origin main && cd ..
cd frontend && git pull origin main && cd ..

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker compose down

# Build and start services
echo -e "${YELLOW}Building and starting services (this may take a few minutes)...${NC}"
docker compose up --build -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for health checks...${NC}"
sleep 15

# Check status
echo -e "${GREEN}Service status:${NC}"
docker compose ps

# Show logs
echo ""
echo -e "${GREEN}Recent logs:${NC}"
docker compose logs --tail=30

echo ""
echo -e "${GREEN}Deployment complete.${NC}"
echo ""
echo "Application endpoints:"
echo "  - Frontend (via nginx):  http://localhost"
echo "  - Backend API (via nginx): http://localhost/api"
echo "  - Frontend (direct):     http://localhost:3000"
echo "  - Backend (direct):      http://localhost:4000"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f              # Follow logs"
echo "  docker compose logs -f backend      # Backend logs only"
echo "  docker compose logs -f frontend     # Frontend logs only"
echo "  docker compose down                 # Stop all services"
echo "  docker compose restart              # Restart all services"
echo "  docker compose restart backend      # Restart backend only"
