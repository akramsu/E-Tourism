// Test existing users and create test data if needed
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

async function testWithExistingUser() {
  try {
    console.log('🧪 Testing Authority Profile API with test credentials...\n');

    // Common test credentials that might exist
    const testCredentials = [
      { username: 'admin', password: 'admin' },
      { username: 'authority', password: 'password' },
      { username: 'test', password: 'test' },
      { username: 'admin', password: 'admin123' },
      { username: 'authority', password: 'admin123' }
    ];

    let token = null;
    let successfulCredentials = null;

    // Try each set of credentials
    for (const creds of testCredentials) {
      console.log(`🔐 Trying login with username: ${creds.username}`);
      
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creds)
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.success && loginData.token) {
          token = loginData.token;
          successfulCredentials = creds;
          console.log(`✅ Login successful with ${creds.username}`);
          break;
        }
      }
    }

    if (!token) {
      console.log('❌ No valid credentials found. Authority profile cannot be tested without a valid authority user.');
      console.log('💡 Please create an authority user manually or check if any test users exist in the database.');
      return;
    }

    console.log(`\n🎯 Using credentials: ${successfulCredentials.username}/${successfulCredentials.password}`);

    // Now test the profile endpoints with the valid token
    await testProfileEndpoints(token);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

async function testProfileEndpoints(token) {
  try {
    // Test 1: Get profile
    console.log('\n1. Testing GET /api/authority/profile...');
    const profileResponse = await fetch(`${API_BASE_URL}/api/authority/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ Profile endpoint working:');
      console.log(JSON.stringify(profileData, null, 2));
    } else {
      const errorText = await profileResponse.text();
      console.log('❌ Profile endpoint failed:', errorText);
    }

    // Test 2: Get profile stats
    console.log('\n2. Testing GET /api/authority/profile/stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/authority/profile/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Profile stats endpoint working:');
      console.log(JSON.stringify(statsData, null, 2));
    } else {
      const errorText = await statsResponse.text();
      console.log('❌ Profile stats endpoint failed:', errorText);
    }

    // Test 3: Get activity log
    console.log('\n3. Testing GET /api/authority/activity-log...');
    const activityResponse = await fetch(`${API_BASE_URL}/api/authority/activity-log?limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      console.log('✅ Activity log endpoint working:');
      console.log(JSON.stringify(activityData, null, 2));
    } else {
      const errorText = await activityResponse.text();
      console.log('❌ Activity log endpoint failed:', errorText);
    }

    // Test 4: Update profile
    console.log('\n4. Testing PUT /api/authority/profile...');
    const updateResponse = await fetch(`${API_BASE_URL}/api/authority/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: '+1234567890'
      })
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Profile update endpoint working:');
      console.log(JSON.stringify(updateData, null, 2));
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Profile update endpoint failed:', errorText);
    }

    console.log('\n🎉 Profile API testing completed!');

  } catch (error) {
    console.error('❌ Profile endpoints test failed:', error.message);
  }
}

// Run the test
testWithExistingUser();
