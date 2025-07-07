// Simple test script to verify alerts API with authentication
const axios = require('axios')

const API_BASE_URL = 'http://localhost:5003'

async function testAlertsAPI() {
  try {
    // Step 1: Login to get a token
    console.log('🔑 Logging in to get authentication token...')
    // Try with existing users from the database
    const testCredentials = [
      { email: 'test.authority@tourease.com', password: 'password123' },
      { email: 'test.authority@tourease.com', password: 'testpass123' },
      { email: 'test.authority@tourease.com', password: 'admin123' },
      { email: 'testauthority@test.com', password: 'password123' },
      { email: 'testauthority@test.com', password: 'testpass123' },
      { email: 'authoritytest@test.com', password: 'password123' },
      { email: 'jamal@jamal.com', password: 'password123' },
      { email: 'salam@gmail.com', password: 'password123' },
      { email: 'mohamed@mohamed.com', password: 'password123' },
      { email: 'testing@gmail.com', password: 'password123' }
    ]
    
    let token = null
    let loginSuccess = false
    
    for (const creds of testCredentials) {
      try {
        console.log(`🔑 Trying login with ${creds.email}...`)
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, creds)
        
        if (loginResponse.data.success) {
          token = loginResponse.data.token
          loginSuccess = true
          console.log(`✅ Login successful with ${creds.email}`)
          break
        }
      } catch (error) {
        console.log(`❌ Login failed for ${creds.email}: ${error.response?.data?.message || error.message}`)
      }
    }
    
    if (!loginSuccess) {
      console.error('❌ All login attempts failed')
      return
    }
    
    // Step 2: Test alerts endpoint
    console.log('\n📋 Testing alerts API endpoints...')
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    // Test get all alerts
    try {
      const alertsResponse = await axios.get(`${API_BASE_URL}/api/alerts?resolved=false&limit=50`, { headers })
      console.log('✅ GET /api/alerts - Success:', {
        count: alertsResponse.data.data?.length || 0,
        success: alertsResponse.data.success
      })
    } catch (error) {
      console.log('⚠️  GET /api/alerts - Error:', error.response?.data?.message || error.message)
    }
    
    // Test get all alerts (no filters)
    try {
      const allAlertsResponse = await axios.get(`${API_BASE_URL}/api/alerts?limit=100`, { headers })
      console.log('✅ GET /api/alerts (all) - Success:', {
        count: allAlertsResponse.data.data?.length || 0,
        success: allAlertsResponse.data.success
      })
    } catch (error) {
      console.log('⚠️  GET /api/alerts (all) - Error:', error.response?.data?.message || error.message)
    }
    
    // Test create alert
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/api/alerts`, {
        alertType: 'HIGH_TRAFFIC',
        alertMessage: 'Test alert from API test script',
        alertData: { severity: 'medium', location: 'City Center' }
      }, { headers })
      console.log('✅ POST /api/alerts - Success:', createResponse.data.success)
      
      const newAlertId = createResponse.data.data?.id
      if (newAlertId) {
        // Test get specific alert
        const getAlertResponse = await axios.get(`${API_BASE_URL}/api/alerts/${newAlertId}`, { headers })
        console.log('✅ GET /api/alerts/:id - Success:', getAlertResponse.data.success)
        
        // Test update alert (mark as resolved)
        const updateResponse = await axios.put(`${API_BASE_URL}/api/alerts/${newAlertId}`, {
          alertResolved: true
        }, { headers })
        console.log('✅ PUT /api/alerts/:id - Success:', updateResponse.data.success)
      }
    } catch (error) {
      console.log('⚠️  Alert operations - Error:', error.response?.data?.message || error.message)
    }
    
    console.log('\n🎉 Alerts API test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message)
  }
}

// Run the test
testAlertsAPI()
