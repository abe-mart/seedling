#!/bin/bash
# Raspberry Pi deployment script
# Run this script on your Raspberry Pi to deploy/update the application

set -e

echo "🚀 Starting Seedling deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${YELLOW}Warning: This script is designed for Raspberry Pi${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ first"
    exit 1
fi

echo "Node.js version: $(node --version)"

# Check PM2 installation
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 is not installed. Installing...${NC}"
    sudo npm install -g pm2
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from example...${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit .env file with your configuration before continuing!${NC}"
    echo "Run: nano .env"
    exit 1
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

# Install API dependencies if using PostgreSQL backend
if [ -d "api" ] && [ -f "api/package.json" ]; then
    echo -e "${GREEN}Installing API dependencies...${NC}"
    cd api
    npm install
    
    # Create logs directory for API
    mkdir -p logs
    
    # Check if API .env exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  API .env file not found!${NC}"
        echo -e "${YELLOW}Copy api/.env.example to api/.env and configure it${NC}"
    fi
    
    cd ..
fi

# Run TypeScript check
echo -e "${GREEN}Running type check...${NC}"
npm run typecheck

# Build application
echo -e "${GREEN}Building application...${NC}"
if ! npm run build; then
    echo -e "${RED}Build failed! Trying with limited memory...${NC}"
    NODE_OPTIONS="--max-old-space-size=512" npm run build
fi

# Create logs directory
mkdir -p logs

# Ask user about port selection
echo ""
read -p "Start on next available port? (y/n, default=n): " USE_AUTO_PORT
echo ""

# Check if app is already running
if pm2 list | grep -q "seedling"; then
    echo -e "${GREEN}Restarting existing PM2 process...${NC}"
    npm run pm2:restart
    
    # Also restart API if it exists
    if pm2 list | grep -q "seedling-api"; then
        echo -e "${GREEN}Restarting API server...${NC}"
        cd api && pm2 restart seedling-api && cd ..
    fi
else
    echo -e "${GREEN}Starting new PM2 process...${NC}"
    
    # Start API first if it exists
    if [ -d "api" ] && [ -f "api/ecosystem.config.cjs" ]; then
        echo -e "${GREEN}Starting API server...${NC}"
        cd api
        pm2 start ecosystem.config.cjs
        pm2 save
        cd ..
    fi
    
    if [[ "$USE_AUTO_PORT" =~ ^[Yy]$ ]]; then
        # Use auto port selection
        chmod +x start-on-available-port.sh
        ./start-on-available-port.sh 3005
    else
        # Use default port 3005
        npm run pm2:start
        pm2 save
        
        # Show status
        pm2 status
        
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Application is running on port 3005"
        echo "Access it at: http://$(hostname -I | awk '{print $1}'):3005"
        
        if [ -d "api" ]; then
            echo "API is running on port 3006"
            echo "API URL: http://$(hostname -I | awk '{print $1}'):3006"
        fi
    fi
fi

echo ""
echo "Useful commands:"
echo "  npm run pm2:logs     - View logs"
echo "  npm run pm2:status   - Check status"
echo "  npm run pm2:restart  - Restart app"
echo "  npm run pm2:stop     - Stop app"
