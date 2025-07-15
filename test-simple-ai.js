const axios = require('axios')

const baseURL = 'http://localhost:5003/api'

async function testAIFunctionality() {
  try {
    console.log('🚀 Testing AI Chat Database Context (without full chat)...\n')

    // Test direct database context by checking a simple endpoint first
    console.log('📊 Testing city metrics endpoint...')
    
    // Try to hit a simple endpoint that might not require auth
    try {
      const healthResponse = await axios.get(`${baseURL}/authority/health`)
      console.log('✅ Authority health check:', healthResponse.data)
    } catch (error) {
      console.log('❌ Authority health check failed - auth required')
    }

    // Try the general health endpoint
    try {
      const generalHealthResponse = await axios.get(`${baseURL}/health`)
      console.log('✅ General health check:', generalHealthResponse.data)
    } catch (error) {
      console.log('❌ General health check failed')
    }

    // Since authentication is required, let's test if we can register a new user
    console.log('\n🔑 Testing user registration...')
    
    const testUserData = {
      username: 'testauthority2025',
      email: 'testauth2025@test.com',
      password: 'testpass123',
      roleId: 2 // Authority role (assuming it's ID 2)
    }

    try {
      const registerResponse = await axios.post(`${baseURL}/auth/register`, testUserData)
      console.log('✅ Registration successful:', registerResponse.data)

      // Check the role - if it's OWNER, we need to try with a different roleId
      const userRole = registerResponse.data.user.role.roleName
      console.log(`👤 User role assigned: ${userRole}`)

      if (userRole !== 'AUTHORITY') {
        console.log('⚠️ User was not assigned AUTHORITY role, trying roleId 3...')
        
        // Try with roleId 3
        const testUserData2 = {
          username: 'testauthority2025b',
          email: 'testauth2025b@test.com', 
          password: 'testpass123',
          roleId: 3
        }
        
        try {
          const registerResponse2 = await axios.post(`${baseURL}/auth/register`, testUserData2)
          console.log('✅ Second registration successful:', registerResponse2.data)
        } catch (error) {
          console.log('❌ Second registration failed, proceeding with OWNER role user...')
        }
      }

      // Use the token from registration
      const token = registerResponse.data.token
      console.log('🔑 Token obtained from registration')

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

        // Test AI chat
        console.log('\n🤖 Testing AI Chat...')
        const chatResponse = await axios.post(`${baseURL}/authority/chat`, {
          message: "Give me a summary of my tourism database statistics",
          chatHistory: []
        }, { headers })

        if (chatResponse.data.success) {
          const aiData = chatResponse.data.data
          console.log('🎉 AI Chat Response:')
          console.log(`   Message: ${aiData.message}`)
          console.log(`   Data Insights: ${JSON.stringify(aiData.dataInsights, null, 2)}`)
          console.log(`   Suggestions: ${JSON.stringify(aiData.suggestions, null, 2)}`)
          console.log(`   Context: ${JSON.stringify(aiData.context, null, 2)}`)
        } else {
          console.log('❌ AI Chat failed:', chatResponse.data)
        }

    } catch (registerError) {
      console.log('❌ Registration failed:', registerError.response?.data || registerError.message)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message)
  }
}

testAIFunctionality()
