#!/bin/bash

# 🚀 ALTERGEN - Bootstrap Script
# Goal: Setup environment, install requirements, and launch project.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Starting ALTERGEN Bootstrap...${NC}"

# 1. Check Requirements
echo -e "${BLUE}Step 1/5: Checking system requirements...${NC}"
COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${RED}Error: docker-compose or docker compose is not installed.${NC}"
    exit 1
fi

for cmd in docker npm node; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Error: $cmd is not installed.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ System requirements met using $COMPOSE_CMD.${NC}"

# 2. Install Dependencies
echo -e "${BLUE}Step 2/5: Installing project dependencies...${NC}"
echo "Installing API dependencies..."
cd api && npm install && cd ..
echo "Installing Web dependencies..."
if [ -d "web/kassy-kube" ]; then
    cd web/kassy-kube && npm install && cd ../..
fi
echo -e "${GREEN}✓ Dependencies installed.${NC}"

# 3. Environment Setup
echo -e "${BLUE}Step 3/5: Setting up environment files...${NC}"
if [ ! -f ".env" ]; then
    cp api/.env.example .env || touch .env
    echo -e "${GREEN}✓ Created root .env (Please update it)${NC}"
fi
echo -e "${GREEN}✓ Environment ready.${NC}"

# 4. Launch Project
echo -e "${BLUE}Step 4/5: Launching infrastructure with Docker...${NC}"
$COMPOSE_CMD up -d --build
echo -e "${GREEN}✓ Infrastructure launched.${NC}"

# 5. Initialization
echo -e "${BLUE}Step 5/5: Running migrations and health checks...${NC}"
sleep 15 # Wait for DB
$COMPOSE_CMD exec -T api npx prisma migrate deploy
$COMPOSE_CMD exec -T api npx prisma generate

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 ALTERGEN IS UP AND RUNNING!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "API:        http://localhost:3001"
echo -e "Frontend:   http://localhost:3000"
echo -e "Prometheus: http://localhost:9090"
echo -e "Health:     http://localhost:3001/health"
echo -e "========================================${NC}"
