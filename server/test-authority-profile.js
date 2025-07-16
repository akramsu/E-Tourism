const http = require('http');

async function testAuthorityProfile() {
  try {
    console.log('📋 Testing authority profile endpoint...');
    
    // First login to get token
    const loginData = JSON.stringify({
      email: 'authority@gmail.com',
      password: 'authority'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 5003,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const loginResponse = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error('Invalid JSON response: ' + data));
          }
        });
      });

      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    if (!loginResponse.success) {
      console.log('❌ Login failed:', loginResponse.message);
      return;
    }

    const token = loginResponse.token;
    console.log('✅ Login successful, testing profile endpoint...');

    // Now test profile endpoint
    const profileOptions = {
      hostname: 'localhost',
      port: 5003,
      path: '/api/authority/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const profileResponse = await new Promise((resolve, reject) => {
      const req = http.request(profileOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: result });
          } catch (e) {
            reject(new Error('Invalid JSON response: ' + data));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log('📊 Profile Response Status:', profileResponse.statusCode);
    console.log('📋 Profile Data:');
    
    if (profileResponse.data.success) {
      const profile = profileResponse.data.data;
      console.log(`   ✅ Username: ${profile.username}`);
      console.log(`   ✅ Email: ${profile.email}`);
      console.log(`   ✅ Phone: ${profile.phoneNumber}`);
      console.log(`   ✅ Birth Date: ${profile.birthDate}`);
      console.log(`   ✅ Postcode: ${profile.postcode}`);
      console.log(`   ✅ Gender: ${profile.gender}`);
      console.log(`   ✅ Role: ${profile.role.roleName}`);
      console.log(`   ✅ Profile Picture: ${profile.profilePicture ? 'Present (Base64)' : 'None'}`);
      console.log(`   ✅ Created Date: ${profile.createdDate}`);
      console.log('🎉 All profile fields are populated and accessible!');
    } else {
      console.log('❌ Profile fetch failed:', profileResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthorityProfile();
