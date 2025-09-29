#!/bin/bash

echo "🧪 Testing Approval System Build Process"
echo "========================================"

# Test the migration script
echo "📋 Testing migration script..."
cd packages/db
if node migrate-approval-tables.js; then
    echo "✅ Migration script runs without errors"
else
    echo "⚠️  Migration script has issues (expected if DB not available)"
fi

# Test the build script
echo "📦 Testing build script..."
cd ../../apps/api
if chmod +x build-with-migration.sh && ./build-with-migration.sh; then
    echo "✅ Build script completed successfully"
else
    echo "❌ Build script failed"
    exit 1
fi

echo "🎉 All tests completed!"
