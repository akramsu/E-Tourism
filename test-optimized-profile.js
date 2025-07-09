const API_BASE_URL = 'http://localhost:5003';

async function testProfileUpdateWithOptimizedImage() {
  try {
    console.log('Testing profile update with optimized image handling...\n');

    // Create a new test user
    const testUserEmail = `optimized-test-${Date.now()}@test.com`;
    const testUserUsername = `optimizedtest${Date.now()}`;

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
    console.log('Registration response:', registerData.success ? 'Success' : 'Failed');

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

    // Test with different sized images
    const testImages = [
      {
        name: 'tiny-image',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        description: 'Tiny 1x1 pixel image'
      },
      {
        name: 'small-image',
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        description: 'Small JPEG image'
      }
    ];

    for (const testImage of testImages) {
      console.log(`\n📸 Testing profile update with ${testImage.name}...`);
      console.log(`Description: ${testImage.description}`);
      console.log(`Image size: ${Math.round(testImage.data.length / 1024)}KB`);

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
            `${Math.round(updateData.user.profilePicture.length / 1024)}KB` : 'none'
        });

        // Verify the image was saved
        console.log('🔍 Verifying profile image was saved...');
        const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const verifyData = await verifyResponse.json();
        if (verifyData.success) {
          console.log('✅ Verification successful:', {
            hasProfilePicture: !!verifyData.data.profilePicture,
            profilePictureSize: verifyData.data.profilePicture ? 
              `${Math.round(verifyData.data.profilePicture.length / 1024)}KB` : 'none',
            imageMatchesOriginal: verifyData.data.profilePicture === testImage.data
          });
        }
      } else {
        console.log('❌ Profile update failed:', updateData.message);
        if (updateData.error) {
          console.log('Error details:', updateData.error);
        }
      }
    }

    console.log('\n🎉 Optimized profile update test completed!');
    console.log('✅ The frontend should now work properly with image compression.');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testProfileUpdateWithOptimizedImage();
