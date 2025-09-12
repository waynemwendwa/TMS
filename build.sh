#!/bin/bash

# Build script for TMS application
set -e

echo "🚀 Starting TMS build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install workspace dependencies
echo "📦 Installing workspace dependencies..."
npm -ws install

# Generate Prisma client first
echo "🗄️ Generating Prisma client..."
npm -w packages/db run generate

# Build packages in order
echo "🔨 Building database package..."
npm -w packages/db run build

echo "🔨 Building API package..."
# Ensure API dependencies are installed
cd apps/api
npm install
cd ../..

# Build API
npm -w apps/api run build

echo "🔨 Building web package..."
# Ensure web dependencies are installed
cd apps/web
npm install
cd ../..

# Build web
npm -w apps/web run build

echo "✅ Build completed successfully!"
