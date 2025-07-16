// Direct test of authority login
const https = require('https');
const http = require('http');

const API_BASE_URL = 'http://localhost:5003';

// Simple fetch implementation
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLogin() {
  try {
    console.log('🔐 Testing direct login with authority credentials...\n');

    const credentials = {
      email: 'authority@tourease.com',
      password: 'admin123'
    };

    console.log('Attempting login with:', credentials);

    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response ok:', loginResponse.ok);

    const responseText = await loginResponse.text();
    console.log('Login response body:', responseText);

    if (loginResponse.ok) {
      const loginData = JSON.parse(responseText);
      console.log('✅ Login successful!');
      console.log('Token received:', loginData.token ? 'Yes' : 'No');
      
      if (loginData.token) {
        // Test profile endpoint
        console.log('\n📋 Testing profile endpoint...');
        const profileResponse = await fetch(`${API_BASE_URL}/api/authority/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Profile response status:', profileResponse.status);
        const profileText = await profileResponse.text();
        console.log('Profile response:', profileText);
      }
    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin();
