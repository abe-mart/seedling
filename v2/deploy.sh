#!/bin/bash

# Deploy script for StorySeed v2 on Raspberry Pi

set -e

echo "🚀 Deploying StorySeed v2..."

# Navigate to project directory
cd /home/pi/seedling/v2

# Pull latest changes (if using git)
# git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Stop existing PM2 process
echo "⏸️  Stopping existing process..."
pm2 stop seedling-v2 2>/dev/null || echo "No existing process to stop"

# Start with PM2
echo "▶️  Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Show status
echo "✅ Deployment complete!"
pm2 status
pm2 logs seedling-v2 --lines 20
