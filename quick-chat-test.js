/**
 * Quick test for enhanced AI chat with real database data
 */

const axios = require('axios')

async function quickChatTest() {
  console.log('🧪 Testing Enhanced AI Chat with Real Database Data...')
  
  try {
    // Test with a category-specific question
    console.log('\n1️⃣ Testing category distribution query...')
    const response = await axios.post('http://localhost:5003/api/authority/chat', {
      message: "Tell me about the distribution of attractions across categories with specific numbers and percentages"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail but shows server is running
      }
    })
    
    console.log('✅ Response received:', response.data.data.message.substring(0, 200) + '...')
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Server is running! (Auth required as expected)')
      console.log('Response preview:', error.response.data)
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Please start the backend server.')
    } else {
      console.log('❌ Error:', error.message)
    }
  }
}

// Run the test
quickChatTest()
