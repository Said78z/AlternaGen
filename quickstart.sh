#!/bin/bash

# AlternaGen Quick Start Script
# This script sets up the local development environment

set -e

echo "🚀 AlternaGen Quick Start"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1/6: Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL not found. Installing...${NC}"
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
fi
echo -e "${GREEN}✓ PostgreSQL ready${NC}"

echo -e "${BLUE}Step 2/6: Creating database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE altergen;" 2>/dev/null || echo "Database already exists"
echo -e "${GREEN}✓ Database ready${NC}"

echo -e "${BLUE}Step 3/6: Installing API dependencies...${NC}"
cd api
npm install
echo -e "${GREEN}✓ API dependencies installed${NC}"

echo -e "${BLUE}Step 4/6: Running database migrations...${NC}"
npx prisma migrate deploy
npx prisma generate
echo -e "${GREEN}✓ Migrations applied${NC}"

echo -e "${BLUE}Step 5/6: Installing Web dependencies...${NC}"
cd ../web
npm install
echo -e "${GREEN}✓ Web dependencies installed${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You still need to configure Stripe:${NC}"
echo ""
echo "1. Go to: https://dashboard.stripe.com/test"
echo "2. Developers → API Keys → Copy 'Secret key'"
echo "3. Update api/.env:"
echo "   STRIPE_SECRET_KEY=sk_test_YOUR_KEY"
echo ""
echo "4. Products → Create product:"
echo "   - Name: AlternaGen PRO"
echo "   - Price: €20/month (recurring)"
echo "   - Copy Price ID"
echo "5. Update api/.env:"
echo "   STRIPE_PRICE_ID=price_YOUR_ID"
echo ""
echo -e "${BLUE}To start the application:${NC}"
echo ""
echo "Terminal 1 (API):"
echo "  cd api && npm run dev"
echo ""
echo "Terminal 2 (Web):"
echo "  cd web && npm run dev"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
