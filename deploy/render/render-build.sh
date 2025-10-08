#!/bin/bash

# Render build script with proper memory allocation
echo "🚀 Starting Render build process..."

# Set memory limit for Node.js
export NODE_OPTIONS="--max-old-space-size=2048"
echo "✅ Memory limit set to 2048MB"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run prebuild (optimize assets)
echo "🔧 Running prebuild optimization..."
npm run prebuild

# Build the frontend with explicit memory setting
echo "🏗️ Building frontend..."
NODE_OPTIONS="--max-old-space-size=2048" npx vite build

# Run postbuild (restore assets)
echo "🔄 Running postbuild restoration..."
npm run postbuild

# Install microservice dependencies
echo "📦 Installing microservice dependencies..."
cd microservice && npm install

echo "✅ Build complete!"
