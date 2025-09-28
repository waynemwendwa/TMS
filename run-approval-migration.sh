#!/bin/bash

echo "🚀 Running Approval Workflow Database Migration"
echo "=============================================="

# Navigate to the database package directory
cd packages/db

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running Prisma migration..."
npx prisma migrate dev --name add_approval_workflow

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Migration completed successfully!"
echo "🎉 Approval workflow tables have been created"
echo "📋 New tables:"
echo "   - approval_requests"
echo "   - approval_notifications"
echo "   - Updated enums: ApprovalStatus, ApprovalPriority, NotificationType"
