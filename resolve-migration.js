#!/usr/bin/env node

/**
 * Script to resolve the stuck migration in production
 * Run this with the production DATABASE_URL set
 */

const { execSync } = require('child_process');
const path = require('path');

async function resolveMigration() {
  try {
    console.log('🔄 Resolving stuck migration...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.log('Please set it with your production database URL:');
      console.log('export DATABASE_URL="postgresql://user:password@host:port/database"');
      process.exit(1);
    }
    
    console.log('✅ DATABASE_URL is set');
    console.log('📊 Database URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
    
    // Resolve the failed migration
    console.log('🔧 Marking migration as rolled back...');
    execSync('npx prisma migrate resolve --rolled-back 20251005_ensure_orders --schema packages/db/prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: path.join(__dirname)
    });
    
    console.log('✅ Migration resolved successfully!');
    console.log('🚀 You can now redeploy your application');
    
  } catch (error) {
    console.error('❌ Error resolving migration:', error.message);
    process.exit(1);
  }
}

resolveMigration();
