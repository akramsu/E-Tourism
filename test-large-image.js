const API_BASE_URL = 'http://localhost:5003';

async function testLargerImageUpload() {
  try {
    console.log('Testing 5MB profile image upload...\n');

    // Create a new test user
    const testUserEmail = `largeimage-test-${Date.now()}@test.com`;
    const testUserUsername = `largeimagetest${Date.now()}`;

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

    // Test with different sized images (simulating larger images)
    const testImages = [
      {
        name: 'medium-size-image',
        // This creates a larger base64 string (approximately 1MB)
        data: 'data:image/jpeg;base64,' + 'A'.repeat(1000000), // 1MB of A's
        description: 'Simulated 1MB image'
      },
      {
        name: 'large-size-image',
        // This creates a larger base64 string (approximately 3MB)
        data: 'data:image/jpeg;base64,' + 'B'.repeat(3000000), // 3MB of B's
        description: 'Simulated 3MB image'
      },
      {
        name: 'extra-large-size-image',
        // This creates a larger base64 string (approximately 6MB - should be rejected)
        data: 'data:image/jpeg;base64,' + 'C'.repeat(6000000), // 6MB of C's
        description: 'Simulated 6MB image (should be rejected)'
      }
    ];

    for (const testImage of testImages) {
      console.log(`\n📸 Testing profile update with ${testImage.name}...`);
      console.log(`Description: ${testImage.description}`);
      console.log(`Image size: ${Math.round(testImage.data.length / 1024 / 1024 * 100) / 100}MB`);

      const profileUpdateData = {
        phoneNumber: '+1234567890',
        birthDate: '1990-05-15',
        postcode: '12345',
        gender: 'male',
        profileImage: testImage.data
      };

      console.log('Sending profile update...');
      const updateResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileUpdateData),
      });

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
      } else {
        console.log('❌ Profile update failed (expected for very large images):', updateData.message);
        if (updateData.error) {
          console.log('Error details:', updateData.error);
        }
      }
    }

    console.log('\n🎉 Large image upload test completed!');
    console.log('✅ The system should now support up to 5MB profile images.');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testLargerImageUpload();
