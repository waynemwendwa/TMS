#!/bin/bash
echo "🔄 Running database migration..."
cd packages/db
npx prisma migrate deploy
echo "✅ Migration completed!"
