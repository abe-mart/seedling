#!/bin/bash
# Simple script to create PWA icon placeholders using ImageMagick
# Install: sudo apt-get install imagemagick

if ! command -v convert &> /dev/null; then
    echo "ImageMagick not installed. Creating placeholder files..."
    # Create simple colored squares as placeholders
    echo "Creating 192x192 placeholder..."
    convert -size 192x192 xc:'#10b981' -pointsize 80 -fill white -gravity center -annotate +0+0 'SS' pwa-192x192.png 2>/dev/null || echo "Skipped"
    echo "Creating 512x512 placeholder..."
    convert -size 512x512 xc:'#10b981' -pointsize 200 -fill white -gravity center -annotate +0+0 'SS' pwa-512x512.png 2>/dev/null || echo "Skipped"
else
    echo "Creating PWA icons from favicon..."
    convert favicon.svg -resize 192x192 pwa-192x192.png
    convert favicon.svg -resize 512x512 pwa-512x512.png
fi

echo "PWA icons created!"
