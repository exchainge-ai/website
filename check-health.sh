#!/bin/bash

# Health check script to verify all services are running correctly

echo "ExchAInge Health Check"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker Compose is running
if ! docker compose ps | grep -q "Up"; then
    echo -e "${RED}Error: Services are not running${NC}"
    echo "Start services with: ./deploy.sh"
    exit 1
fi

echo "Checking service status..."
echo ""

# Check backend health
echo -n "Backend (port 4000): "
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# Check frontend
echo -n "Frontend (port 3000): "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# Check nginx
echo -n "Nginx (port 80): "
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

echo ""
echo "Container status:"
docker compose ps

echo ""
echo "Resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
