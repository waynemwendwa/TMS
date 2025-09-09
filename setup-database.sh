#!/bin/bash

echo "🗄️ Setting up database..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in TMS root directory"
    echo "Current directory: $(pwd)"
    echo "Expected: /root/TMS"
    exit 1
fi

# Navigate to database package
cd packages/db

# Check if Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: Prisma schema not found at packages/db/prisma/schema.prisma"
    exit 1
fi

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Go back to root
cd ../..

echo "✅ Database setup complete!"
