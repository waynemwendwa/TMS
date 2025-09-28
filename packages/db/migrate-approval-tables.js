#!/usr/bin/env node

// Migration script to create approval tables
// This runs during the build process to ensure tables exist

const { Client } = require('pg');

// Check if we're in a build environment
const isBuildEnvironment = process.env.NODE_ENV === 'production' || process.env.RENDER;

async function runMigration() {
  // Skip migration if no database URL
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  No DATABASE_URL found, skipping migration');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Create enums
    console.log('📝 Creating enums...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "ApprovalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUEST', 'APPROVAL_UPDATE', 'GENERAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables
    console.log('📋 Creating approval_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "approval_requests" (
        "id" TEXT NOT NULL,
        "orderTemplateId" TEXT,
        "projectId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "totalAmount" DECIMAL(15,2),
        "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
        "priority" "ApprovalPriority" NOT NULL DEFAULT 'MEDIUM',
        "requestedBy" TEXT NOT NULL,
        "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reviewedBy" TEXT,
        "reviewedAt" TIMESTAMP(3),
        "comments" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('📋 Creating approval_notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "approval_notifications" (
        "id" TEXT NOT NULL,
        "approvalRequestId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" "NotificationType" NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "approval_notifications_pkey" PRIMARY KEY ("id")
      );
    `);

    // Add foreign keys
    console.log('🔗 Adding foreign keys...');
    
    try {
      await client.query(`
        ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_orderTemplateId_fkey" 
        FOREIGN KEY ("orderTemplateId") REFERENCES "order_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('⚠️  Foreign key constraint already exists or order_templates table not found');
    }

    try {
      await client.query(`
        ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_projectId_fkey" 
        FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('⚠️  Foreign key constraint already exists');
    }

    try {
      await client.query(`
        ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requestedBy_fkey" 
        FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('⚠️  Foreign key constraint already exists');
    }

    try {
      await client.query(`
        ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_reviewedBy_fkey" 
        FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('⚠️  Foreign key constraint already exists');
    }

    try {
      await client.query(`
        ALTER TABLE "approval_notifications" ADD CONSTRAINT "approval_notifications_approvalRequestId_fkey" 
        FOREIGN KEY ("approvalRequestId") REFERENCES "approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('⚠️  Foreign key constraint already exists');
    }

    try {
      await client.query(`
        ALTER TABLE "approval_notifications" ADD CONSTRAINT "approval_notifications_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('⚠️  Foreign key constraint already exists');
    }

    console.log('✅ Migration completed successfully!');
    console.log('🎉 Approval workflow tables have been created');
    console.log('📋 New tables:');
    console.log('   - approval_requests');
    console.log('   - approval_notifications');
    console.log('   - Updated enums: ApprovalStatus, ApprovalPriority, NotificationType');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
