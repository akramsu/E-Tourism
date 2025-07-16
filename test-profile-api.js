// Test script for authority profile API endpoints
const https = require('https');
const http = require('http');

const API_BASE_URL = 'http://localhost:5003';

// Simple fetch implementation using Node.js built-in modules
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

// Test login and profile endpoints
async function testProfileAPI() {
  let token;
  
  try {
    console.log('🧪 Testing Authority Profile API...\n');

    // Step 1: Login as authority user
    console.log('1. Attempting to login as authority user...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'authority',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Authority user not found. Creating test authority user...');
      
      // Create test authority user
      const createUserResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'authority',
          password: 'admin123',
          email: 'authority@tourease.com',
          role: 'AUTHORITY',
          phoneNumber: '+1234567890',
          postcode: '12345'
        })
      });

      if (!createUserResponse.ok) {
        const createError = await createUserResponse.text();
        console.log('❌ Failed to create authority user:', createError);
        return;
      }

      console.log('✅ Created test authority user successfully');
      
      // Try login again
      const loginRetryResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'authority',
          password: 'admin123'
        })
      });

      if (!loginRetryResponse.ok) {
        console.log('❌ Failed to login after creating user');
        return;
      }

      const loginRetryData = await loginRetryResponse.json();
      token = loginRetryData.token;
    } else {
      const loginData = await loginResponse.json();
      token = loginData.token;
    }

    console.log('✅ Login successful');

    // Step 2: Test profile endpoint
    console.log('\n2. Testing profile endpoint...');
    const profileResponse = await fetch(`${API_BASE_URL}/api/authority/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.log('❌ Profile request failed:', errorText);
      return;
    }

    const profileData = await profileResponse.json();
    console.log('✅ Profile data retrieved successfully:');
    console.log(JSON.stringify(profileData, null, 2));

    // Step 3: Test profile stats endpoint
    console.log('\n3. Testing profile stats endpoint...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/authority/profile/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      console.log('❌ Profile stats request failed:', errorText);
      return;
    }

    const statsData = await statsResponse.json();
    console.log('✅ Profile stats retrieved successfully:');
    console.log(JSON.stringify(statsData, null, 2));

    // Step 4: Test activity log endpoint
    console.log('\n4. Testing activity log endpoint...');
    const activityResponse = await fetch(`${API_BASE_URL}/api/authority/activity-log?limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!activityResponse.ok) {
      const errorText = await activityResponse.text();
      console.log('❌ Activity log request failed:', errorText);
      return;
    }

    const activityData = await activityResponse.json();
    console.log('✅ Activity log retrieved successfully:');
    console.log(JSON.stringify(activityData, null, 2));

    // Step 5: Test profile update
    console.log('\n5. Testing profile update endpoint...');
    const updateResponse = await fetch(`${API_BASE_URL}/api/authority/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: '+1987654321',
        username: 'authority'
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log('❌ Profile update failed:', errorText);
      return;
    }

    const updateData = await updateResponse.json();
    console.log('✅ Profile updated successfully:');
    console.log(JSON.stringify(updateData, null, 2));

    console.log('\n🎉 All profile API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testProfileAPI();
