# Migration Fix Guide

## Problem
The deployment is failing because there's a stuck migration `20251005_ensure_orders` that needs to be resolved.

## Solution Steps

### Option 1: Fix via Production Database (Recommended)

1. **Set your production DATABASE_URL** (replace with your actual production database URL):
   ```bash
   export DATABASE_URL="postgresql://tms_t05g_user:YOUR_PASSWORD@dpg-d31vg8ur433s738sobr0-a.oregon-postgres.render.com:5432/tms_t05g"
   ```

2. **Check migration status**:
   ```bash
   cd /home/wayne/Desktop/TMS
   node check-migration-status.js
   ```

3. **Resolve the stuck migration**:
   ```bash
   node resolve-migration.js
   ```

4. **Redeploy your application**:
   ```bash
   git add .
   git commit -m "fix: resolve stuck migration and update file upload styling"
   git push
   ```

### Option 2: Manual Database Fix

If you have direct access to your production database:

1. Connect to your PostgreSQL database
2. Run this SQL to mark the migration as rolled back:
   ```sql
   UPDATE "_prisma_migrations" 
   SET "finished_at" = NOW(), 
       "rolled_back_at" = NOW() 
   WHERE "migration_name" = '20251005_ensure_orders' 
   AND "finished_at" IS NULL;
   ```

### Option 3: Reset Migration History (Last Resort)

⚠️ **WARNING**: This will reset all migration history. Only use if other options fail.

1. **Backup your database first**
2. **Reset migration history**:
   ```bash
   export DATABASE_URL="your_production_url"
   npx prisma migrate reset --force --schema packages/db/prisma/schema.prisma
   ```

## What This Fixes

- ✅ Resolves the stuck migration preventing deployment
- ✅ Allows new migrations to be applied
- ✅ Enables the updated file upload styling to be deployed
- ✅ Fixes the document delete/upload issues

## After Fixing

Once the migration is resolved:
1. Your deployment should succeed
2. Document deletion will work (404 errors fixed)
3. Payment/drawing uploads will work (500 errors fixed)
4. File input areas will have light grey backgrounds for better visibility

## Verification

After deployment, test:
- [ ] Document deletion works
- [ ] Payment document upload works
- [ ] Drawing document upload works
- [ ] File input areas are light grey
- [ ] Orders page loads without errors
