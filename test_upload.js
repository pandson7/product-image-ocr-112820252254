const fs = require('fs');
const axios = require('axios');
const path = require('path');

const API_BASE_URL = 'https://txg2r8rk27.execute-api.us-east-1.amazonaws.com/prod';
const IMAGE_PATH = '/home/pandson/ea_sample_docs/ocr/VitaminTabs.jpeg';

async function testUpload() {
  try {
    console.log('Starting upload test...');
    
    // Read the image file
    const imageBuffer = fs.readFileSync(IMAGE_PATH);
    const fileName = path.basename(IMAGE_PATH);
    const fileType = 'image/jpeg';
    
    console.log(`File: ${fileName}, Size: ${imageBuffer.length} bytes`);
    
    // Step 1: Get upload URL
    console.log('Getting upload URL...');
    const uploadResponse = await axios.post(`${API_BASE_URL}/upload`, {
      fileName: fileName,
      fileType: fileType
    });
    
    const { jobId, uploadUrl } = uploadResponse.data;
    console.log(`Job ID: ${jobId}`);
    
    // Step 2: Upload file to S3
    console.log('Uploading file to S3...');
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'Content-Type': fileType,
      },
    });
    
    console.log('File uploaded successfully!');
    
    // Step 3: Poll for results
    console.log('Polling for results...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts}`);
      
      try {
        const statusResponse = await axios.get(`${API_BASE_URL}/status/${jobId}`);
        const status = statusResponse.data.status;
        
        console.log(`Status: ${status}`);
        
        if (status === 'completed') {
          const resultsResponse = await axios.get(`${API_BASE_URL}/results/${jobId}`);
          console.log('Results:', JSON.stringify(resultsResponse.data.extractedData, null, 2));
          break;
        } else if (status === 'failed') {
          console.log('Processing failed:', statusResponse.data.errorMessage);
          break;
        }
        
        // Wait 3 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (pollError) {
        console.log('Polling error:', pollError.message);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('Timeout waiting for results');
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testUpload();
