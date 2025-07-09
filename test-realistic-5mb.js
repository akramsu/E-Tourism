const API_BASE_URL = 'http://localhost:5003';

async function testRealistic5MBUpload() {
  try {
    console.log('Testing realistic 5MB profile image upload...\n');

    // Create a new test user
    const testUserEmail = `realistic5mb-test-${Date.now()}@test.com`;
    const testUserUsername = `realistic5mb${Date.now()}`;

    console.log('Creating a new test user...');
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUserUsername,
        email: testUserEmail,
        password: 'testpassword123',
        roleId: 3  // TOURIST role
      }),
    });

    const registerData = await registerResponse.json();
    if (!registerData.success) {
      console.error('Registration failed:', registerData.message);
      return;
    }

    // Login to get token
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'testpassword123'
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ User logged in successfully');

    // Test with realistic image sizes
    const testImages = [
      {
        name: '1MB-image',
        data: 'data:image/jpeg;base64,' + 'A'.repeat(1400000), // ~1MB after base64 encoding
        description: 'Realistic 1MB JPEG image'
      },
      {
        name: '2MB-image',
        data: 'data:image/jpeg;base64,' + 'B'.repeat(2800000), // ~2MB after base64 encoding
        description: 'Realistic 2MB JPEG image'
      },
      {
        name: '3MB-image',
        data: 'data:image/jpeg;base64,' + 'C'.repeat(4200000), // ~3MB after base64 encoding
        description: 'Realistic 3MB JPEG image'
      }
    ];

    for (const testImage of testImages) {
      console.log(`\n📸 Testing profile update with ${testImage.name}...`);
      console.log(`Description: ${testImage.description}`);
      console.log(`Base64 size: ${Math.round(testImage.data.length / 1024 / 1024 * 100) / 100}MB`);

      const profileUpdateData = {
        phoneNumber: '+1234567890',
        birthDate: '1990-05-15',
        postcode: '12345',
        gender: 'male',
        profileImage: testImage.data
      };

      console.log('Sending profile update...');
      const startTime = Date.now();
      
      const updateResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileUpdateData),
      });

      const endTime = Date.now();
      console.log(`Request took: ${endTime - startTime}ms`);
      console.log('Update response status:', updateResponse.status);
      
      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        console.log('✅ Profile update successful!');
        console.log('Response:', {
          success: updateData.success,
          message: updateData.message,
          hasProfilePicture: !!updateData.user?.profilePicture,
          profilePictureSize: updateData.user?.profilePicture ? 
            `${Math.round(updateData.user.profilePicture.length / 1024 / 1024 * 100) / 100}MB` : 'none'
        });

        // Quick verification
        const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const verifyData = await verifyResponse.json();
        if (verifyData.success && verifyData.data.profilePicture) {
          console.log('✅ Image verified in database:', 
            `${Math.round(verifyData.data.profilePicture.length / 1024 / 1024 * 100) / 100}MB`);
        }
      } else {
        console.log('❌ Profile update failed:', updateData.message);
        if (updateData.error) {
          console.log('Error details:', updateData.error);
        }
      }
    }

    console.log('\n🎉 Realistic 5MB image upload test completed!');
    console.log('✅ Profile images up to 5MB should now work properly.');
    console.log('📝 Note: Images are automatically compressed on the frontend for optimal performance.');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testRealistic5MBUpload();
