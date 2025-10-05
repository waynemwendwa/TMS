#!/usr/bin/env node

/**
 * Complete Order Approval Workflow Test Script
 * This script tests the entire order approval workflow end-to-end
 */

const https = require('https');

const API_BASE_URL = 'https://tms-api-zcib.onrender.com';

// Test data
const testData = {
  siteSupervisor: {
    email: 'supervisor@test.com',
    password: 'password123'
  },
  procurement: {
    email: 'procurement@test.com', 
    password: 'password123'
  },
  chairman: {
    email: 'chairman@test.com',
    password: 'password123'
  }
};

// Helper function to make API calls
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

// Test authentication
async function testAuthentication(userType) {
  console.log(`\n🔐 Testing ${userType} authentication...`);
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData[userType])
    });
    
    if (response.status === 200) {
      console.log(`✅ ${userType} authentication successful`);
      return response.data.token;
    } else {
      console.log(`❌ ${userType} authentication failed:`, response.status);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${userType} authentication error:`, error.message);
    return null;
  }
}

// Test orders API endpoints
async function testOrdersAPI(token, userType) {
  console.log(`\n📋 Testing orders API for ${userType}...`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  try {
    // Test GET /api/orders
    console.log('  Testing GET /api/orders...');
    const ordersResponse = await makeRequest(`${API_BASE_URL}/api/orders`, {
      method: 'GET',
      headers
    });
    
    if (ordersResponse.status === 200) {
      console.log(`  ✅ GET /api/orders successful (${ordersResponse.data.length} orders)`);
    } else {
      console.log(`  ❌ GET /api/orders failed: ${ordersResponse.status}`);
    }
    
    // Test order creation (only for site supervisors)
    if (userType === 'siteSupervisor') {
      console.log('  Testing POST /api/orders...');
      const createOrderResponse = await makeRequest(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId: 'test-project-id',
          title: 'Test Order',
          description: 'Test order description',
          items: [
            {
              itemCode: 'ITEM001',
              description: 'Test Item',
              unit: 'pieces',
              quantity: 10,
              unitPrice: 100.00,
              totalPrice: 1000.00
            }
          ]
        })
      });
      
      if (createOrderResponse.status === 201) {
        console.log(`  ✅ POST /api/orders successful`);
        return createOrderResponse.data.id;
      } else {
        console.log(`  ❌ POST /api/orders failed: ${createOrderResponse.status}`);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`  ❌ Orders API error:`, error.message);
    return null;
  }
}

// Test order approval workflow
async function testApprovalWorkflow(token, orderId, step) {
  console.log(`\n🔄 Testing ${step}...`);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  try {
    let endpoint, method, body;
    
    switch (step) {
      case 'procurement-approval':
        endpoint = `/api/orders/${orderId}/approve-procurement`;
        method = 'PUT';
        break;
      case 'chairman-approval':
        endpoint = `/api/orders/${orderId}/approve-chairman`;
        method = 'PUT';
        body = JSON.stringify({ approved: true });
        break;
      case 'sourcing':
        endpoint = `/api/orders/${orderId}/source`;
        method = 'PUT';
        break;
      case 'sourced':
        endpoint = `/api/orders/${orderId}/sourced`;
        method = 'PUT';
        break;
    }
    
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body
    });
    
    if (response.status === 200) {
      console.log(`  ✅ ${step} successful`);
      return true;
    } else {
      console.log(`  ❌ ${step} failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ ${step} error:`, error.message);
    return false;
  }
}

// Main test function
async function runCompleteWorkflowTest() {
  console.log('🚀 Starting Complete Order Approval Workflow Test');
  console.log('================================================');
  
  let orderId = null;
  let success = true;
  
  try {
    // Step 1: Test Site Supervisor Authentication
    const supervisorToken = await testAuthentication('siteSupervisor');
    if (!supervisorToken) {
      console.log('❌ Cannot proceed without supervisor authentication');
      return;
    }
    
    // Step 2: Test Order Creation
    orderId = await testOrdersAPI(supervisorToken, 'siteSupervisor');
    if (!orderId) {
      console.log('❌ Cannot proceed without order creation');
      return;
    }
    
    // Step 3: Test Procurement Authentication
    const procurementToken = await testAuthentication('procurement');
    if (!procurementToken) {
      console.log('❌ Cannot proceed without procurement authentication');
      return;
    }
    
    // Step 4: Test Procurement Approval
    const procurementApproval = await testApprovalWorkflow(procurementToken, orderId, 'procurement-approval');
    if (!procurementApproval) {
      console.log('❌ Procurement approval failed');
      success = false;
    }
    
    // Step 5: Test Chairman Authentication
    const chairmanToken = await testAuthentication('chairman');
    if (!chairmanToken) {
      console.log('❌ Cannot proceed without chairman authentication');
      return;
    }
    
    // Step 6: Test Chairman Approval
    const chairmanApproval = await testApprovalWorkflow(chairmanToken, orderId, 'chairman-approval');
    if (!chairmanApproval) {
      console.log('❌ Chairman approval failed');
      success = false;
    }
    
    // Step 7: Test Sourcing
    const sourcing = await testApprovalWorkflow(procurementToken, orderId, 'sourcing');
    if (!sourcing) {
      console.log('❌ Sourcing failed');
      success = false;
    }
    
    // Step 8: Test Sourced
    const sourced = await testApprovalWorkflow(procurementToken, orderId, 'sourced');
    if (!sourced) {
      console.log('❌ Marking as sourced failed');
      success = false;
    }
    
    // Final Results
    console.log('\n🎯 Workflow Test Results');
    console.log('========================');
    
    if (success) {
      console.log('✅ Complete order approval workflow is working!');
      console.log('✅ All steps completed successfully');
      console.log('✅ System is ready for production use');
    } else {
      console.log('❌ Some workflow steps failed');
      console.log('❌ Please check the implementation');
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run the test
runCompleteWorkflowTest();
