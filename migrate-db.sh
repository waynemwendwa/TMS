#!/bin/bash
set -e

echo "🔄 Starting database migration..."
echo "=========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo "📊 Database URL: ${DATABASE_URL:0:50}..."

# Navigate to the database package
cd packages/db

echo "📦 Installing database dependencies..."
npm install

echo "🗄️ Running database migration..."
echo "=========================================="
npx prisma migrate deploy
echo "=========================================="

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "=========================================="
echo "✅ DATABASE MIGRATION COMPLETED SUCCESSFULLY!"
echo "✅ All database tables have been created"
echo "✅ Prisma client has been generated"
echo "✅ Database is ready for use"
echo "=========================================="
