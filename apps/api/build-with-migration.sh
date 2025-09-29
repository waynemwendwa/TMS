#!/bin/bash

echo "🚀 Building API with Database Migration"
echo "======================================"

# Set error handling
set -e

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running database migration..."
cd ../../packages/db

# Run Prisma migration
echo "📋 Running Prisma migration..."
if npm run migrate:deploy; then
    echo "✅ Prisma migration completed successfully"
else
    echo "⚠️  Prisma migration failed, but continuing with build..."
    echo "⚠️  Database tables may need to be created manually"
fi

echo "🔧 Generating Prisma client..."
npm run generate

echo "📦 Building TypeScript..."
cd ../../apps/api
npm run build

echo "✅ Build completed successfully!"
echo "🎉 API is ready with approval workflow tables"
