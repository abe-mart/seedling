#!/bin/bash
# Start the application on the next available port above 3005
# This script finds an available port and starts the app with PM2

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

START_PORT=${1:-3005}

echo -e "${GREEN}🔍 Finding available port starting from ${START_PORT}...${NC}"

# Find available port using the Node.js script
AVAILABLE_PORT=$(node find-port.js "$START_PORT")

if [ -z "$AVAILABLE_PORT" ]; then
    echo -e "${RED}❌ Could not find an available port${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found available port: ${AVAILABLE_PORT}${NC}"

# Create logs directory
mkdir -p logs

# Check if app is already running
if pm2 list | grep -q "seedling"; then
    echo -e "${YELLOW}⚠️  Seedling is already running. Stopping...${NC}"
    pm2 delete seedling
fi

# Start the application with the available port
echo -e "${GREEN}🚀 Starting Seedling on port ${AVAILABLE_PORT}...${NC}"
PORT="$AVAILABLE_PORT" pm2 start npx --name seedling -- serve -s dist -l "$AVAILABLE_PORT" \
    --log ./logs/pm2-combined.log \
    --error ./logs/pm2-error.log \
    --out ./logs/pm2-out.log \
    --time

# Save PM2 process list
pm2 save

# Display status
pm2 status

echo ""
echo -e "${GREEN}✅ Seedling is now running on port ${AVAILABLE_PORT}${NC}"
echo ""
echo "Access the app at:"
echo "  Local: http://localhost:${AVAILABLE_PORT}"
echo "  Network: http://$(hostname -I | awk '{print $1}'):${AVAILABLE_PORT}"
echo ""
echo "Useful commands:"
echo "  pm2 logs seedling    - View logs"
echo "  pm2 restart seedling - Restart app"
echo "  pm2 stop seedling    - Stop app"
