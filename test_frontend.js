const fs = require('fs');
const axios = require('axios');

// Test CORS and frontend API integration
async function testFrontendIntegration() {
  try {
    console.log('Testing frontend API integration...');
    
    // Test CORS preflight
    console.log('Testing CORS preflight...');
    const corsResponse = await axios.options('https://txg2r8rk27.execute-api.us-east-1.amazonaws.com/prod/upload', {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('CORS preflight successful');
    
    // Test upload from frontend origin
    console.log('Testing upload from frontend origin...');
    const uploadResponse = await axios.post('https://txg2r8rk27.execute-api.us-east-1.amazonaws.com/prod/upload', {
      fileName: 'test-frontend.jpg',
      fileType: 'image/jpeg'
    }, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Frontend upload test successful:', uploadResponse.data.jobId);
    
    // Test status endpoint
    const statusResponse = await axios.get(`https://txg2r8rk27.execute-api.us-east-1.amazonaws.com/prod/status/${uploadResponse.data.jobId}`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('Status endpoint test successful:', statusResponse.data.status);
    
    console.log('All frontend integration tests passed!');
    
  } catch (error) {
    console.error('Frontend integration test failed:', error.response?.data || error.message);
  }
}

testFrontendIntegration();
