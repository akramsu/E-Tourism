const API_BASE_URL = 'http://localhost:5003';

async function testProfileUpdate() {
  try {
    console.log('Testing profile update endpoint...\n');

    // First, let's create a new test user
    console.log('Creating a new test user...');
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testprofile',
        email: 'testprofile@test.com',
        password: 'testpassword123',
        roleId: 3  // TOURIST role
      }),
    });

    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);

    if (!registerData.success) {
      // User might already exist, try to login instead
      console.log('Registration failed, trying to login...');
    }

    // Now try to login
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testprofile@test.com',
        password: 'testpassword123'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed, cannot test profile update');
      return;
    }

    const token = loginData.token;
    const user = loginData.user;

    console.log('\nLogged in user:', {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      birthDate: user.birthDate,
      postcode: user.postcode,
      gender: user.gender
    });

    // Now test profile update with image
    const profileUpdateData = {
      phoneNumber: '+1234567890',
      birthDate: '1990-05-15',
      postcode: '12345',
      gender: 'male',
      // Add a small test image (1x1 pixel red dot)
      profileImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    };

    console.log('\nUpdating profile with data:', profileUpdateData);

    const updateResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileUpdateData),
    });

    console.log('Profile update response status:', updateResponse.status);
    console.log('Profile update response ok:', updateResponse.ok);

    const updateData = await updateResponse.json();
    console.log('Profile update response:', updateData);

    if (updateData.success) {
      console.log('\n✅ Profile update successful!');
      console.log('Updated user data:', {
        id: updateData.user.id,
        username: updateData.user.username,
        email: updateData.user.email,
        phoneNumber: updateData.user.phoneNumber,
        birthDate: updateData.user.birthDate,
        postcode: updateData.user.postcode,
        gender: updateData.user.gender,
        hasProfilePicture: !!updateData.user.profilePicture,
        profilePictureSize: updateData.user.profilePicture ? `${Math.round(updateData.user.profilePicture.length / 1024)}KB` : 'none'
      });

      // Verify the image was saved by getting the profile again
      console.log('\n🔍 Verifying profile image was saved...');
      const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const verifyData = await verifyResponse.json();
      if (verifyData.success) {
        console.log('Profile verification:', {
          hasProfilePicture: !!verifyData.data.profilePicture,
          profilePictureSize: verifyData.data.profilePicture ? `${Math.round(verifyData.data.profilePicture.length / 1024)}KB` : 'none',
          profilePicturePreview: verifyData.data.profilePicture ? verifyData.data.profilePicture.substring(0, 50) + '...' : 'none'
        });
      }
    } else {
      console.log('\n❌ Profile update failed:', updateData.message);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testProfileUpdate();
