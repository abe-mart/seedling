#!/bin/bash
# Quick deployment script for PostgreSQL + Express backend

set -e

echo "🚀 Seedling PostgreSQL Setup - Quick Deploy"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${YELLOW}Warning: Not running on Raspberry Pi${NC}"
fi

# Step 1: Database
echo -e "${GREEN}Step 1/5: Setting up database...${NC}"
if [ ! -f "setup-database.sh" ]; then
    echo -e "${RED}Error: setup-database.sh not found${NC}"
    exit 1
fi

chmod +x setup-database.sh
./setup-database.sh

# Step 2: API Setup
echo ""
echo -e "${GREEN}Step 2/5: Setting up API...${NC}"
cd api

if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: api/package.json not found${NC}"
    exit 1
fi

npm install

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating API .env file...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  IMPORTANT: Edit api/.env and set:${NC}"
    echo "1. DATABASE_URL with your database password"
    echo "2. JWT_SECRET to a random string"
    echo ""
    read -p "Press Enter after you've edited api/.env..."
fi

mkdir -p logs
cd ..

# Step 3: Frontend Setup
echo ""
echo -e "${GREEN}Step 3/5: Setting up frontend...${NC}"
npm install

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    echo "VITE_API_URL=http://localhost:3006" > .env
    echo -e "${GREEN}✅ Created .env with API URL${NC}"
fi

# Step 4: Build
echo ""
echo -e "${GREEN}Step 4/5: Building application...${NC}"
npm run build

# Step 5: Start Services
echo ""
echo -e "${GREEN}Step 5/5: Starting services with PM2...${NC}"

# Start API
cd api
pm2 start ecosystem.config.cjs
cd ..

# Start frontend
pm2 start ecosystem.config.cjs

# Save PM2 state
pm2 save

# Configure PM2 to start on boot (first time only)
if ! pm2 startup | grep -q "already"; then
    echo -e "${YELLOW}Configuring PM2 to start on boot...${NC}"
    pm2 startup
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Services Status:"
pm2 status
echo ""
echo "Access your app:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):3005"
echo "  API:      http://$(hostname -I | awk '{print $1}'):3006"
echo ""
echo "Useful commands:"
echo "  pm2 logs           - View all logs"
echo "  pm2 logs seedling  - View frontend logs"
echo "  pm2 logs seedling-api - View API logs"
echo "  pm2 restart all    - Restart everything"
echo "  pm2 status         - Check status"
echo ""
echo -e "${GREEN}Happy writing! 📝${NC}"
