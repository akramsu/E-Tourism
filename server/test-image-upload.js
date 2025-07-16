const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:5003'

async function testImageUpload() {
  try {
    console.log('🖼️ Testing Profile Picture Upload...\n')

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

    // Step 2: Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9C, 0x63, 0xF8, 0x00, 0x00, 0x00, // compressed data
      0x00, 0x01, 0x00, 0x01, 0x1A, 0x25, 0x3C, 0x6D, // CRC
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82
    ])

    // Step 3: Upload image using FormData
    console.log('\\n2. Uploading profile picture...')
    const formData = new FormData()
    formData.append('profilePicture', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    })

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/authority/profile/picture`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }
    )

    if (uploadResponse.data.success) {
      console.log('✅ Upload successful!')
      console.log('Response:', uploadResponse.data)
    } else {
      console.error('❌ Upload failed:', uploadResponse.data.message)
    }

    // Step 4: Verify the upload by getting profile
    console.log('\\n3. Verifying upload...')
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

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message)
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testImageUpload()
