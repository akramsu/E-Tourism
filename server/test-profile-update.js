const axios = require('axios')

const BASE_URL = 'http://localhost:5003'

async function testProfileUpdate() {
  try {
    console.log('🔐 Testing Authority Profile Update API...\n')

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

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    // Step 2: Get current profile
    console.log('\n2. Getting current profile...')
    const profileResponse = await axios.get(`${BASE_URL}/api/authority/profile`, { headers })
    
    if (!profileResponse.data.success) {
      console.error('❌ Get profile failed:', profileResponse.data.message)
      return
    }

    console.log('✅ Current profile retrieved:')
    console.log('Username:', profileResponse.data.data.username)
    console.log('Email:', profileResponse.data.data.email)
    console.log('Phone:', profileResponse.data.data.phoneNumber)
    console.log('Birth Date:', profileResponse.data.data.birthDate)
    console.log('Postcode:', profileResponse.data.data.postcode)
    console.log('Gender:', profileResponse.data.data.gender)

    // Step 3: Update profile
    console.log('\n3. Updating profile...')
    const updateData = {
      username: 'updated_authority',
      email: 'authority@tourease.com', // Keep same email
      phoneNumber: '+1987654321',
      birthDate: '1990-01-01',
      postcode: '54321',
      gender: 'male'
    }

    const updateResponse = await axios.put(`${BASE_URL}/api/authority/profile`, updateData, { headers })
    
    if (!updateResponse.data.success) {
      console.error('❌ Profile update failed:', updateResponse.data.message)
      return
    }

    console.log('✅ Profile updated successfully!')
    console.log('Updated data:', updateResponse.data.data)

    // Step 4: Verify the update
    console.log('\n4. Verifying the update...')
    const verifyResponse = await axios.get(`${BASE_URL}/api/authority/profile`, { headers })
    
    if (verifyResponse.data.success) {
      console.log('✅ Verification successful:')
      console.log('Username:', verifyResponse.data.data.username)
      console.log('Phone:', verifyResponse.data.data.phoneNumber)
      console.log('Birth Date:', verifyResponse.data.data.birthDate)
      console.log('Postcode:', verifyResponse.data.data.postcode)
      console.log('Gender:', verifyResponse.data.data.gender)
    }

    console.log('\n🎉 Profile update test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message)
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testProfileUpdate()
