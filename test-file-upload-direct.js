const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const https = require('https');
const http = require('http');

async function testFileUploadDirect() {
  try {
    console.log('🧪 Testing file upload with direct buffer data...');
    
    // Create a real PNG file buffer (minimal PNG structure)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // IEND CRC
    ]);
    
    console.log('📦 PNG buffer created:', {
      size: pngHeader.length,
      preview: pngHeader.slice(0, 8).toString('hex')
    });
    
    // Create form data
    const formData = new FormData();
    formData.append('profilePicture', pngHeader, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    console.log('📤 Uploading to server...');
    
    // Make the request manually
    const options = {
      hostname: 'localhost',
      port: 5003,
      path: '/api/authority/upload-profile-picture',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk0LCJlbWFpbCI6ImF1dGhvcml0eUB0b3VyZWFzZS5jb20iLCJyb2xlIjoiQXV0aG9yaXR5IiwiaWF0IjoxNzM2NjQwODc3LCJleHAiOjE3MzY2NDQ0Nzd9.K_xNvFgO_qy8yIzMOZuQiQvp8fW2kL3m_HBmgm2P2FU',
        ...formData.getHeaders()
      }
    };
    
    const req = http.request(options, (res) => {
      console.log('📊 Response status:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📋 Response data:', result);
        } catch (e) {
          console.log('📋 Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
    });
    
    formData.pipe(req);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFileUploadDirect();
