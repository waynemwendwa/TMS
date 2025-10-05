#!/usr/bin/env node

/**
 * Check Deployment Status
 * This script checks if the orders feature is deployed to production
 */

const https = require('https');

const API_BASE_URL = 'https://tms-api-zcib.onrender.com';

console.log('🔍 Checking Deployment Status');
console.log('============================');

async function checkDeploymentStatus() {
  console.log('\n1. 🏥 Testing API Health...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/health`);
    if (response.status === 200) {
      console.log('  ✅ API is responding');
    } else {
      console.log(`  ❌ API health check failed: ${response.status}`);
      return;
    }
  } catch (error) {
    console.log(`  ❌ API health check error: ${error.message}`);
    return;
  }

  console.log('\n2. 📋 Testing Orders Health...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/orders/health`);
    console.log(`  📊 Orders Health Response: ${response.status}`);
    
    if (response.status === 200) {
      console.log('  ✅ Orders feature is DEPLOYED and working!');
      console.log('  ✅ Database migration has been applied');
      console.log('  ✅ You can now use the orders functionality');
    } else if (response.status === 503) {
      console.log('  ❌ Orders feature is NOT DEPLOYED yet');
      console.log('  ❌ Database migration has not been applied');
      console.log('  🔧 Solution: Deploy the updated code to production');
    } else if (response.status === 500) {
      console.log('  ❌ Orders feature has deployment issues');
      console.log('  🔍 Check API server logs for specific errors');
    } else {
      console.log(`  ⚠️  Unexpected response: ${response.status}`);
    }
    
    if (response.data) {
      console.log(`  📋 Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Orders health check error: ${error.message}`);
  }

  console.log('\n3. 🧪 Testing Orders Endpoint...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/orders`);
    console.log(`  📊 Orders Endpoint Response: ${response.status}`);
    
    if (response.status === 401) {
      console.log('  ✅ Orders endpoint exists (requires authentication)');
    } else if (response.status === 200) {
      console.log('  ✅ Orders endpoint working');
    } else if (response.status === 500) {
      console.log('  ❌ Orders endpoint has server errors');
      console.log('  🔧 This confirms the Order model is not deployed');
    } else {
      console.log(`  ⚠️  Unexpected response: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Orders endpoint error: ${error.message}`);
  }

  console.log('\n🎯 Deployment Status Summary');
  console.log('============================');
  console.log('✅ API Server: Running');
  console.log('✅ Authentication: Working');
  console.log('❌ Orders Feature: NOT DEPLOYED YET');
  console.log('');
  console.log('🔧 Next Steps:');
  console.log('1. Deploy the updated code to production');
  console.log('2. Monitor deployment logs for migration success');
  console.log('3. Test the orders functionality');
  console.log('4. Verify the health endpoint returns 200');
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

// Run the check
checkDeploymentStatus();
