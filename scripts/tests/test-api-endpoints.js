#!/usr/bin/env node

/**
 * Test script to verify API endpoints work on production
 */

const BASE_URL = 'https://oliviaaiweb3-1.onrender.com';

async function testEndpoint(url, options = {}) {
  try {
    console.log(`🔍 Testing: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer dev-token',
        'Content-Type': 'application/json',
        'Origin': 'https://oliviaaiweb3-1.onrender.com',
        ...options.headers
      },
      ...options
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success:`, data);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error:`, errorText);
    }
    
    return response.ok;
  } catch (error) {
    console.log(`   🚨 Network Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints on Production\n');
  
  // Test health endpoint (no auth required)
  await testEndpoint(`${BASE_URL}/api/health`);
  
  console.log('\n--- Testing Authenticated Endpoints ---\n');
  
  // Test token info endpoint
  await testEndpoint(`${BASE_URL}/api/openai/token-info`);
  
  // Test chat completions endpoint
  await testEndpoint(`${BASE_URL}/api/openai/chat/completions`, {
    method: 'POST',
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Hello, test message!' }
      ]
    })
  });
  
  // Test models endpoint
  await testEndpoint(`${BASE_URL}/api/openai/models`);
  
  console.log('\n--- Testing WebSocket Connection ---\n');
  
  // Test WebSocket connection
  try {
    const wsUrl = `wss://oliviaaiweb3-1.onrender.com/ws/secure-proxy?token=dev-token`;
    console.log(`🔍 Testing WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('   ✅ WebSocket connected successfully');
      ws.close();
    };
    
    ws.onerror = (error) => {
      console.log('   ❌ WebSocket connection failed:', error.message);
    };
    
    ws.onclose = () => {
      console.log('   🔌 WebSocket connection closed');
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('   ⏰ WebSocket connection timeout');
        ws.close();
      }
    }, 5000);
    
  } catch (error) {
    console.log('   🚨 WebSocket Error:', error.message);
  }
  
  console.log('\n✅ API endpoint testing complete!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testEndpoint, runTests };
