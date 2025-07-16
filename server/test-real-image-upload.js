const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')

const BASE_URL = 'http://localhost:5003'

async function testRealImageUpload() {
  try {
    console.log('🖼️ Testing Real Image Upload via Frontend Flow...\n')

    // Step 1: Login to get token
    console.log('1. Logging in...')
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'authority@tourease.com',
      password: 'password123'
    })

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message)
      return
    }

    const token = loginResponse.data.token
    console.log('✅ Login successful')

    // Step 2: Create a proper PNG file with actual content
    console.log('\\n2. Creating test image...')
    const imageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
    const tempFile = 'temp-test-image.png'
    fs.writeFileSync(tempFile, imageData)
    console.log('✅ Test image created')

    // Step 3: Upload using proper FormData with file stream
    console.log('\\n3. Uploading profile picture...')
    const formData = new FormData()
    formData.append('profilePicture', fs.createReadStream(tempFile), {
      filename: 'profile.png',
      contentType: 'image/png'
    })

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/authority/profile/picture`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )

    if (uploadResponse.data.success) {
      console.log('✅ Upload successful!')
      console.log('Response:', {
        success: uploadResponse.data.success,
        message: uploadResponse.data.message,
        profilePictureLength: uploadResponse.data.data?.profilePicture?.length || 0
      })
    } else {
      console.error('❌ Upload failed:', uploadResponse.data.message)
    }

    // Step 4: Verify the upload by getting profile
    console.log('\\n4. Verifying upload...')
    const profileResponse = await axios.get(`${BASE_URL}/api/authority/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (profileResponse.data.success && profileResponse.data.data.profilePicture) {
      console.log('✅ Profile picture updated successfully!')
      console.log('Picture length:', profileResponse.data.data.profilePicture.length)
      console.log('Picture preview:', profileResponse.data.data.profilePicture.substring(0, 100) + '...')
    } else {
      console.log('❌ Profile picture not found in profile')
    }

    // Clean up
    console.log('\\n5. Cleaning up...')
    fs.unlinkSync(tempFile)
    console.log('✅ Temporary file cleaned up')

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message)
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testRealImageUpload()
