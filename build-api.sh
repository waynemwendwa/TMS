#!/bin/bash

# Build script specifically for API on Render
set -e

echo "🚀 Building TMS API for Render..."

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

# Build API
echo "🔨 Building API package..."
cd apps/api
npm install
# Ensure all dependencies are available
npm install express cors morgan multer bcryptjs jsonwebtoken dotenv @types/express @types/cors @types/morgan @types/multer @types/bcryptjs @types/jsonwebtoken @types/node
npm run build
cd ../..

echo "✅ API build completed successfully!"
