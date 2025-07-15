const axios = require('axios')

const baseURL = 'http://localhost:5003/api'

async function testEnhancedAIChat() {
  try {
    console.log('🚀 Testing Enhanced AI Chat with Database Context...\n')

    // Test authentication first - try multiple potential credentials
    const credentialOptions = [
      { email: 'authority@test.com', password: 'testpass123' },
      { email: 'jamal@jamal.com', password: 'password123' },
      { email: 'test.authority@tourease.com', password: 'password123' },
      { email: 'salam@gmail.com', password: 'password123' },
      { email: 'mohamed@mohamed.com', password: 'password123' }
    ]

    let authResponse = null
    let credentials = null

    for (const creds of credentialOptions) {
      try {
        console.log(`🔑 Trying credentials: ${creds.email}`)
        authResponse = await axios.post(`${baseURL}/auth/login`, creds)
        if (authResponse.data.success) {
          credentials = creds
          break
        }
      } catch (error) {
        console.log(`   ❌ Failed with ${creds.email}`)
        continue
      }
    }

    if (!authResponse || !authResponse.data.success) {
      throw new Error('Authentication failed with all credential options')
    }

    const token = authResponse.data.data.token
    console.log(`✅ Authentication successful with ${credentials.email}`)

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    // Test AI chat with different types of questions
    const testQuestions = [
      "Tell me about my tourism database statistics",
      "Which categories are performing best?",
      "Show me revenue insights and trends",
      "What attractions should I focus on improving?",
      "Generate a summary of visitor patterns"
    ]

    for (const question of testQuestions) {
      console.log(`\n📝 Question: "${question}"`)
      console.log('─'.repeat(60))

      try {
        const chatResponse = await axios.post(`${baseURL}/authority/chat`, {
          message: question,
          chatHistory: []
        }, { headers })

        if (chatResponse.data.success) {
          const aiData = chatResponse.data.data
          console.log(`🤖 AI Response:`)
          console.log(`   Message: ${aiData.message.substring(0, 200)}...`)
          console.log(`   Data Insights: ${aiData.dataInsights?.length || 0} insights`)
          console.log(`   Suggestions: ${aiData.suggestions?.length || 0} suggestions`)
          console.log(`   Action Items: ${aiData.actionItems?.length || 0} actions`)
          console.log(`   Context: ${aiData.context?.totalAttractions || 0} attractions, ${aiData.context?.totalCategories || 0} categories`)
        } else {
          console.log(`❌ Chat failed: ${chatResponse.data.message}`)
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.response?.data?.message || error.message}`)
      }

      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n🎉 Enhanced AI Chat testing completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message)
  }
}

testEnhancedAIChat()
