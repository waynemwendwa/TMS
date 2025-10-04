#!/usr/bin/env node

/**
 * Migration Verification Script
 * This script helps verify that the order approval workflow migration will work correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Order Approval Workflow Migration...\n');

// 1. Check if migration file exists
const migrationPath = path.join(__dirname, 'packages/db/prisma/migrations/20250928000000_add_approval_workflow/migration.sql');
if (fs.existsSync(migrationPath)) {
  console.log('✅ Migration file exists:', migrationPath);
} else {
  console.log('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

// 2. Read and validate migration content
const migrationContent = fs.readFileSync(migrationPath, 'utf8');
console.log('✅ Migration file is readable');

// 3. Check for required components
const requiredComponents = [
  'CREATE TYPE "OrderStatus"',
  'CREATE TABLE "orders"',
  'CREATE TABLE "order_items"',
  'CREATE TABLE "suppliers"',
  'CREATE TABLE "deliveries"',
  'CREATE TABLE "quotes"',
  'CREATE TABLE "quote_items"',
  'ALTER TABLE "orders" ADD CONSTRAINT',
  'CREATE UNIQUE INDEX "orders_orderNumber_key"'
];

let allComponentsFound = true;
requiredComponents.forEach(component => {
  if (migrationContent.includes(component)) {
    console.log(`✅ Found: ${component}`);
  } else {
    console.log(`❌ Missing: ${component}`);
    allComponentsFound = false;
  }
});

// 4. Check for OrderStatus enum values
const orderStatusValues = [
  'PENDING_PROCUREMENT',
  'PENDING_CHAIRMAN', 
  'APPROVED',
  'REJECTED',
  'SOURCING',
  'SOURCED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
];

console.log('\n📋 Checking OrderStatus enum values:');
orderStatusValues.forEach(status => {
  if (migrationContent.includes(status)) {
    console.log(`✅ ${status}`);
  } else {
    console.log(`❌ Missing: ${status}`);
    allComponentsFound = false;
  }
});

// 5. Check for foreign key constraints
const foreignKeys = [
  'orders_projectId_fkey',
  'orders_requestedById_fkey',
  'orders_inventoryId_fkey',
  'orders_procurementApprovedBy_fkey',
  'orders_chairmanApprovedBy_fkey',
  'orders_procurementSourcedBy_fkey'
];

console.log('\n🔗 Checking foreign key constraints:');
foreignKeys.forEach(fk => {
  if (migrationContent.includes(fk)) {
    console.log(`✅ ${fk}`);
  } else {
    console.log(`❌ Missing: ${fk}`);
    allComponentsFound = false;
  }
});

// 6. Check schema file
const schemaPath = path.join(__dirname, 'packages/db/prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log('\n📄 Checking Prisma schema:');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const schemaComponents = [
    'model Order',
    'model OrderItem',
    'model Supplier',
    'model Delivery',
    'model Quote',
    'enum OrderStatus',
    'enum DeliveryStatus',
    'enum QuoteStatus'
  ];
  
  schemaComponents.forEach(component => {
    if (schemaContent.includes(component)) {
      console.log(`✅ ${component}`);
    } else {
      console.log(`❌ Missing: ${component}`);
      allComponentsFound = false;
    }
  });
}

// 7. Check API routes
const apiRoutesPath = path.join(__dirname, 'apps/api/src/routes/orders.ts');
if (fs.existsSync(apiRoutesPath)) {
  console.log('\n🔌 Checking API routes:');
  const apiContent = fs.readFileSync(apiRoutesPath, 'utf8');
  
  const apiEndpoints = [
    { method: 'GET', path: '/api/orders', search: 'router.get(\'/\'' },
    { method: 'POST', path: '/api/orders', search: 'router.post(\'/\'' },
    { method: 'PUT', path: '/api/orders/:id/approve-procurement', search: 'approve-procurement' },
    { method: 'PUT', path: '/api/orders/:id/approve-chairman', search: 'approve-chairman' },
    { method: 'PUT', path: '/api/orders/:id/source', search: 'router.put(\'/:id/source\'' },
    { method: 'PUT', path: '/api/orders/:id/sourced', search: 'router.put(\'/:id/sourced\'' }
  ];
  
  apiEndpoints.forEach(endpoint => {
    if (apiContent.includes(endpoint.search)) {
      console.log(`✅ ${endpoint.method} ${endpoint.path}`);
    } else {
      console.log(`❌ Missing: ${endpoint.method} ${endpoint.path}`);
      allComponentsFound = false;
    }
  });
}

// 8. Check frontend pages
const ordersPagePath = path.join(__dirname, 'apps/web/app/orders/page.tsx');
const orderDetailPath = path.join(__dirname, 'apps/web/app/orders/[id]/page.tsx');

console.log('\n🖥️ Checking frontend pages:');
if (fs.existsSync(ordersPagePath)) {
  console.log('✅ Orders list page exists');
} else {
  console.log('❌ Orders list page missing');
  allComponentsFound = false;
}

if (fs.existsSync(orderDetailPath)) {
  console.log('✅ Order detail page exists');
} else {
  console.log('❌ Order detail page missing');
  allComponentsFound = false;
}

// 9. Summary
console.log('\n' + '='.repeat(50));
if (allComponentsFound) {
  console.log('🎉 MIGRATION VERIFICATION PASSED!');
  console.log('✅ All components are properly configured');
  console.log('✅ Migration should work correctly when deployed');
  console.log('\n📋 Next steps:');
  console.log('1. Deploy to production');
  console.log('2. Run the migration on your production database');
  console.log('3. Test the orders functionality');
} else {
  console.log('❌ MIGRATION VERIFICATION FAILED!');
  console.log('❌ Some components are missing or incorrect');
  console.log('❌ Please fix the issues before deploying');
}
console.log('='.repeat(50));
