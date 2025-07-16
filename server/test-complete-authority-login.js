const http = require('http');

async function testCompleteAuthorityLogin() {
  try {
    console.log('🔐 Testing login with complete authority user...');
    
    const loginData = JSON.stringify({
      email: 'authority@gmail.com',
      password: 'authority'
    });

    const options = {
      hostname: 'localhost',
      port: 5003,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
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
      req.write(loginData);
      req.end();
    });

    console.log('📊 Response Status:', response.statusCode);
    console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('👤 User Details:');
      console.log(`   ID: ${response.data.user.id}`);
      console.log(`   Username: ${response.data.user.username}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Phone: ${response.data.user.phoneNumber}`);
      console.log(`   Birth Date: ${response.data.user.birthDate}`);
      console.log(`   Postcode: ${response.data.user.postcode}`);
      console.log(`   Gender: ${response.data.user.gender}`);
      console.log(`   Role: ${response.data.user.role.roleName}`);
      console.log(`   Profile Picture: ${response.data.user.profilePicture ? 'Present' : 'None'}`);
      console.log(`   Token: ${response.data.token ? 'Generated' : 'Missing'}`);
    } else {
      console.log('❌ Login failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteAuthorityLogin();
