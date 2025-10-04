#!/usr/bin/env node

/**
 * Orders API Test Script
 * This script tests the orders API endpoints after migration
 */

const https = require('https');

const API_BASE_URL = 'https://tms-api-zcib.onrender.com';

// Test function to make API calls
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

async function testOrdersAPI() {
  console.log('🧪 Testing Orders API after Migration...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing API health...');
    const healthResponse = await makeRequest(`${API_BASE_URL}/api/health`);
    if (healthResponse.status === 200) {
      console.log('✅ API is healthy');
    } else {
      console.log('❌ API health check failed:', healthResponse.status);
      return;
    }
    
    // Test 2: Test orders endpoint (should return 401 without auth)
    console.log('\n2️⃣ Testing orders endpoint...');
    const ordersResponse = await makeRequest(`${API_BASE_URL}/api/orders`);
    if (ordersResponse.status === 401) {
      console.log('✅ Orders endpoint exists (401 Unauthorized - expected without auth)');
    } else if (ordersResponse.status === 200) {
      console.log('✅ Orders endpoint working (200 OK)');
    } else {
      console.log('⚠️ Unexpected response:', ordersResponse.status, ordersResponse.data);
    }
    
    // Test 3: Test specific order endpoints
    console.log('\n3️⃣ Testing order approval endpoints...');
    const testEndpoints = [
      '/api/orders/test-id/approve-procurement',
      '/api/orders/test-id/approve-chairman',
      '/api/orders/test-id/source',
      '/api/orders/test-id/sourced'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await makeRequest(`${API_BASE_URL}${endpoint}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.status === 401) {
          console.log(`✅ ${endpoint} - exists (401 Unauthorized - expected)`);
        } else if (response.status === 404) {
          console.log(`⚠️ ${endpoint} - not found (404)`);
        } else {
          console.log(`✅ ${endpoint} - working (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - error:`, error.message);
      }
    }
    
    console.log('\n🎉 Orders API test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ If you see mostly 401 errors, the API is working correctly');
    console.log('✅ 401 means the endpoints exist but require authentication');
    console.log('❌ 404 errors mean the endpoints are not found (migration may have failed)');
    console.log('❌ 500 errors mean there are server issues');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOrdersAPI();
