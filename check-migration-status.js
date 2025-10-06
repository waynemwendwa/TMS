#!/usr/bin/env node

/**
 * Script to check migration status in production
 */

const { execSync } = require('child_process');
const path = require('path');

async function checkMigrationStatus() {
  try {
    console.log('🔍 Checking migration status...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.log('Please set it with your production database URL:');
      console.log('export DATABASE_URL="postgresql://user:password@host:port/database"');
      process.exit(1);
    }
    
    console.log('✅ DATABASE_URL is set');
    console.log('📊 Database URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
    
    // Check migration status
    console.log('🔧 Checking migration status...');
    execSync('npx prisma migrate status --schema packages/db/prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: path.join(__dirname)
    });
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    process.exit(1);
  }
}

checkMigrationStatus();
