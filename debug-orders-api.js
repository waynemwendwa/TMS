#!/usr/bin/env node

/**
 * Debug Orders API - Check if the issue is with the database migration
 */

const https = require('https');

const API_BASE_URL = 'https://tms-api-zcib.onrender.com';

console.log('🔍 Debugging Orders API Issue');
console.log('==============================');

// Test 1: Check if the API is responding
async function testAPIHealth() {
  console.log('\n1. 🏥 Testing API Health...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/health`);
    if (response.status === 200) {
      console.log('  ✅ API is responding');
      return true;
    } else {
      console.log(`  ❌ API health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ API health check error: ${error.message}`);
    return false;
  }
}

// Test 2: Check if orders endpoint exists
async function testOrdersEndpoint() {
  console.log('\n2. 📋 Testing Orders Endpoint...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/orders`);
    console.log(`  📊 Orders endpoint response: ${response.status}`);
    
    if (response.status === 500) {
      console.log('  ❌ 500 Internal Server Error - Database issue likely');
      console.log('  💡 This suggests the Order model doesn\'t exist in the database');
      return false;
    } else if (response.status === 401) {
      console.log('  ✅ Endpoint exists but requires authentication');
      return true;
    } else if (response.status === 200) {
      console.log('  ✅ Orders endpoint working');
      return true;
    } else {
      console.log(`  ⚠️  Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Orders endpoint error: ${error.message}`);
    return false;
  }
}

// Test 3: Check database schema
async function testDatabaseSchema() {
  console.log('\n3. 🗄️ Testing Database Schema...');
  
  try {
    // Try to access a known working endpoint to see if database is working
    const response = await makeRequest(`${API_BASE_URL}/api/projects`);
    if (response.status === 200) {
      console.log('  ✅ Database connection working (projects endpoint)');
      console.log('  💡 The issue is likely that the Order model migration hasn\'t been applied');
      return false;
    } else {
      console.log(`  ❌ Database connection issue: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Database test error: ${error.message}`);
    return false;
  }
}

// Helper function to make requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Main debug function
async function debugOrdersAPI() {
  console.log('Starting Orders API Debug...\n');
  
  const apiHealth = await testAPIHealth();
  const ordersEndpoint = await testOrdersEndpoint();
  const databaseSchema = await testDatabaseSchema();
  
  console.log('\n🎯 Debug Results');
  console.log('================');
  
  if (apiHealth && !ordersEndpoint) {
    console.log('✅ API is healthy but orders endpoint has issues');
    console.log('💡 Most likely cause: Database migration not applied');
    console.log('🔧 Solution: Apply the database migration to production');
  } else if (!apiHealth) {
    console.log('❌ API is not responding');
    console.log('💡 Check if the API server is running');
  } else if (ordersEndpoint) {
    console.log('✅ Orders API is working correctly');
  } else {
    console.log('❌ Multiple issues detected');
  }
  
  console.log('\n📋 Recommended Actions:');
  console.log('1. Apply database migration to production');
  console.log('2. Restart the API server');
  console.log('3. Test the orders endpoint again');
}

// Run the debug
debugOrdersAPI();
