const API_BASE_URL = 'http://localhost:5003';

async function testFrontendFlow() {
  try {
    console.log('Testing complete frontend flow for profile image upload...\n');

    // Create a new test user for frontend testing
    const testUserEmail = `frontend-test-${Date.now()}@test.com`;
    const testUserUsername = `frontendtest${Date.now()}`;

    console.log('Creating a new test user for frontend testing...');
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
    console.log('Registration response:', registerData);

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
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    const user = loginData.user;

    console.log('\nLogged in user:', {
      id: user.id,
      username: user.username,
      email: user.email,
      needsProfileCompletion: loginData.needsProfileCompletion
    });

    // Test different sized images to simulate frontend behavior
    const testImages = [
      {
        name: 'tiny-1x1-red',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      },
      {
        name: 'small-test-image',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAG0lEQVQIHWPY//8/AzYwOjAyMDIwOjA6MDoAAF5iBA0J0K2BAAAAAElFTkSuQmCC'
      }
    ];

    for (const testImage of testImages) {
      console.log(`\n📸 Testing profile update with ${testImage.name}...`);
      console.log(`Image size: ${Math.round(testImage.data.length / 1024)}KB`);

      // Simulate what the frontend does - update profile with image
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
      console.log('Update response:', {
        success: updateData.success,
        message: updateData.message,
        hasProfilePicture: updateData.user ? !!updateData.user.profilePicture : false,
        profilePictureSize: updateData.user && updateData.user.profilePicture ? 
          `${Math.round(updateData.user.profilePicture.length / 1024)}KB` : 'none'
      });

      if (updateData.success) {
        // Verify the image was saved by getting the profile
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
        } else {
          console.log('❌ Verification failed:', verifyData.message);
        }
      } else {
        console.log('❌ Profile update failed:', updateData.message);
      }
    }

    console.log('\n✅ Frontend flow test completed!');
    console.log('You can now test the frontend at: http://localhost:3001');
    console.log(`Test user credentials: ${testUserEmail} / testpassword123`);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testFrontendFlow();
