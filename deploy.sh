#!/bin/bash

# 🚀 ALTERGEN - Production Deployment Script
# Domain: altergenz.fr

set -e

echo "🚀 Starting ALTERGEN deployment..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (sudo)${NC}"
  exit 1
fi

echo -e "${BLUE}Step 1/6: Checking environment files...${NC}"
if [ ! -f "api/.env" ]; then
  echo -e "${RED}Error: api/.env not found${NC}"
  echo "Please create api/.env from api/.env.example"
  exit 1
fi

if [ ! -f "web/my-clek-app/.env" ]; then
  echo -e "${RED}Error: web/my-clek-app/.env not found${NC}"
  echo "Please create web/my-clek-app/.env from web/my-clek-app/.env.example"
  exit 1
fi

echo -e "${GREEN}✓ Environment files found${NC}"

echo -e "${BLUE}Step 2/6: Stopping existing containers...${NC}"
docker-compose down || true
echo -e "${GREEN}✓ Containers stopped${NC}"

echo -e "${BLUE}Step 3/6: Building Docker images...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✓ Images built${NC}"

echo -e "${BLUE}Step 4/6: Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"

echo -e "${BLUE}Step 5/6: Running database migrations...${NC}"
sleep 10 # Wait for DB to be ready
docker-compose exec -T api npx prisma migrate deploy
docker-compose exec -T api npx prisma generate
echo -e "${GREEN}✓ Migrations applied${NC}"

echo -e "${BLUE}Step 6/6: Health checks...${NC}"
sleep 5

# Check API health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ API is healthy${NC}"
else
  echo -e "${RED}✗ API health check failed${NC}"
  docker-compose logs api
  exit 1
fi

# Check frontend
if curl -f http://localhost:3001 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
  echo -e "${RED}✗ Frontend check failed${NC}"
  docker-compose logs web
  exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Frontend: ${BLUE}http://localhost:3001${NC}"
echo -e "API:      ${BLUE}http://localhost:3001/health${NC}"
echo ""
echo -e "View logs: ${BLUE}docker-compose logs -f${NC}"
echo -e "Stop:      ${BLUE}docker-compose down${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Configure DNS: altergenz.fr → YOUR_SERVER_IP"
echo "2. Setup SSL: sudo certbot certonly --standalone -d altergenz.fr"
echo "3. Configure Nginx (see production-deploy.md)"
echo ""
