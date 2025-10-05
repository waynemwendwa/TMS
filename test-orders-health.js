#!/usr/bin/env node

/**
 * Test Orders Health Endpoint
 * This script tests if the orders feature is available in production
 */

const https = require('https');

const API_BASE_URL = 'https://tms-api-zcib.onrender.com';

console.log('🏥 Testing Orders Health Endpoint');
console.log('==================================');

async function testOrdersHealth() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/orders/health`);
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('\n✅ Orders feature is available!');
      console.log('✅ Database migration has been applied');
      console.log('✅ You can now use the orders functionality');
    } else if (response.status === 503) {
      console.log('\n❌ Orders feature is not available');
      console.log('❌ Database migration has not been applied');
      console.log('🔧 Solution: Deploy the updated code to apply the migration');
    } else {
      console.log('\n⚠️ Unexpected response');
      console.log('🔍 Check the API server logs for more details');
    }
    
  } catch (error) {
    console.log(`❌ Error testing orders health: ${error.message}`);
  }
}

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

// Run the test
testOrdersHealth();
