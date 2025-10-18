#!/bin/bash

# Quick restart script for StorySeed v2

set -e

echo "🔄 Restarting StorySeed v2..."

cd /home/pi/seedling/v2

# Build frontend if needed
if [ "$1" == "--build" ]; then
  echo "🏗️  Building frontend..."
  npm run build
fi

# Restart PM2 process
pm2 restart seedling-v2

echo "✅ Restart complete!"
pm2 status
