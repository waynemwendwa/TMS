#!/bin/bash

# Build script specifically for Web on Render
set -e

echo "🚀 Building TMS Web for Render..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install workspace dependencies
echo "📦 Installing workspace dependencies..."
npm -ws install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
cd packages/db
npm install
npx prisma generate
cd ../..

# Build database package
echo "🔨 Building database package..."
cd packages/db
npm run build
cd ../..

# Build web
echo "🔨 Building web package..."
cd apps/web
npm install
npm run build
cd ../..

echo "✅ Web build completed successfully!"
