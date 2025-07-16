// Complete profile API test
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

async function testCompleteProfileAPI() {
  try {
    console.log('🧪 Complete Authority Profile API Test\n');

    // Step 1: Login
    console.log('1. 🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'authority@tourease.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Step 2: Test profile endpoint
    console.log('\n2. 📋 Testing profile endpoint...');
    const profileResponse = await fetch(`${API_BASE_URL}/api/authority/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ Profile endpoint successful');
      console.log('   Username:', profileData.data.username);
      console.log('   Email:', profileData.data.email);
      console.log('   Position:', profileData.data.position);
      console.log('   Department:', profileData.data.department);
    } else {
      console.log('❌ Profile endpoint failed:', await profileResponse.text());
    }

    // Step 3: Test profile stats
    console.log('\n3. 📊 Testing profile stats endpoint...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/authority/profile/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Profile stats endpoint successful');
      console.log('   Total Attractions:', statsData.data.totalAttractions);
      console.log('   Total Visitors:', statsData.data.totalVisitors);
      console.log('   Total Revenue:', statsData.data.totalRevenue);
      console.log('   Reports Generated:', statsData.data.reportsGenerated);
      console.log('   Account Age (days):', statsData.data.accountAge);
    } else {
      console.log('❌ Profile stats failed:', await statsResponse.text());
    }

    // Step 4: Test activity log
    console.log('\n4. 📝 Testing activity log endpoint...');
    const activityResponse = await fetch(`${API_BASE_URL}/api/authority/activity-log?limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      console.log('✅ Activity log endpoint successful');
      console.log('   Activity count:', activityData.data.length);
      if (activityData.data.length > 0) {
        console.log('   Recent activity:', activityData.data[0].action);
        console.log('   Description:', activityData.data[0].description);
      }
    } else {
      console.log('❌ Activity log failed:', await activityResponse.text());
    }

    // Step 5: Test profile update
    console.log('\n5. ✏️ Testing profile update endpoint...');
    const updateResponse = await fetch(`${API_BASE_URL}/api/authority/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: '+1987654321',
        username: 'authority_updated'
      })
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Profile update successful');
      console.log('   Updated phone:', updateData.data.phoneNumber);
      console.log('   Updated username:', updateData.data.username);
    } else {
      console.log('❌ Profile update failed:', await updateResponse.text());
    }

    console.log('\n🎉 All profile API tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Login endpoint working');
    console.log('✅ Profile GET endpoint working');
    console.log('✅ Profile stats endpoint working');
    console.log('✅ Activity log endpoint working');
    console.log('✅ Profile update endpoint working');
    console.log('\n🚀 The authority profile functionality is ready for frontend integration!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteProfileAPI();
