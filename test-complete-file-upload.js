const http = require('http');

async function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'authority@tourease.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 5003,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('Login response:', result);
          resolve(result);
        } catch (e) {
          reject(new Error('Invalid response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testFileUpload() {
  try {
    // First login
    console.log('🔐 Logging in...');
    const loginResult = await login();
    
    if (!loginResult.success) {
      throw new Error('Login failed: ' + loginResult.message);
    }
    
    const token = loginResult.token;
    console.log('✅ Login successful, token received');
    
    // Now test file upload
    const FormData = require('form-data');
    
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
      filename: 'test-upload.png',
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
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        console.log('📊 Response status:', res.statusCode);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('📋 Response data:', result);
            resolve(result);
          } catch (e) {
            console.log('📋 Raw response:', data);
            resolve({ raw: data });
          }
        });
      });
      
      req.on('error', reject);
      formData.pipe(req);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFileUpload();
