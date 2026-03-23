#!/bin/bash

# Build script for Traffic Light Simulation
# This script is used by the Heroku/Auto-DevOps build process

set -e

echo "=== Building Traffic Light Simulation ==="

# Increase Node memory limit for build process to prevent OOM errors
export NODE_OPTIONS="--max-old-space-size=2048"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install

# Build client
echo "🔨 Building React client..."
CI=false npm run build

# Go back to root
cd ..

echo "✅ Build completed successfully!"
