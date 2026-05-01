// Simple test to check API connectivity
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API connectivity...');
    
    // Test 1: Check if server is running
    console.log('\n1. Testing server health...');
    const response = await fetch('http://127.0.0.1:5000/api/auth/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testAPI();
