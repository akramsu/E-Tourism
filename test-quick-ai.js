const axios = require('axios')

const baseURL = 'http://localhost:5003/api'

async function quickRoleTest() {
  try {
    console.log('🔍 Quick role test and AI functionality verification...\n')

    // Try to register a user with roleId 1 (might be AUTHORITY)
    console.log('🔑 Testing registration with roleId 1...')
    
    let testUserData = {
      username: 'quicktest' + Date.now(),
      email: `quicktest${Date.now()}@test.com`,
      password: 'testpass123',
      roleId: 1
    }

    try {
      const registerResponse = await axios.post(`${baseURL}/auth/register`, testUserData)
      console.log('✅ Registration successful with roleId 1:', registerResponse.data.user.role)

      const token = registerResponse.data.token
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Test AI chat regardless of role
      console.log('\n🤖 Testing AI Chat endpoint...')
      try {
        const chatResponse = await axios.post(`${baseURL}/authority/chat`, {
          message: "Show me my tourism database overview and statistics",
          chatHistory: []
        }, { headers })

        console.log('🎉 AI Chat Response Received!')
        console.log('Success:', chatResponse.data.success)
        if (chatResponse.data.success) {
          const aiData = chatResponse.data.data
          console.log('\n📊 AI Response Data:')
          console.log('- Message Length:', aiData.message?.length || 0, 'characters')
          console.log('- Data Insights:', aiData.dataInsights?.length || 0, 'insights')
          console.log('- Suggestions:', aiData.suggestions?.length || 0, 'suggestions')
          console.log('- Action Items:', aiData.actionItems?.length || 0, 'actions')
          console.log('- Context Total Attractions:', aiData.context?.totalAttractions || 0)
          console.log('- Context Total Categories:', aiData.context?.totalCategories || 0)
          
          console.log('\n📝 Sample of AI Message:')
          console.log(aiData.message?.substring(0, 300) + '...')
          
          console.log('\n💡 Data Insights:')
          aiData.dataInsights?.forEach((insight, i) => {
            console.log(`   ${i + 1}. ${insight}`)
          })
          
          console.log('\n🎯 Suggestions:')
          aiData.suggestions?.forEach((suggestion, i) => {
            console.log(`   ${i + 1}. ${suggestion}`)
          })
        } else {
          console.log('❌ AI Chat failed:', chatResponse.data.message)
        }

      } catch (chatError) {
        if (chatError.response?.status === 403) {
          console.log('❌ AI Chat endpoint requires AUTHORITY role')
          console.log('   User role:', registerResponse.data.user.role.roleName)
          console.log('   This confirms the enhanced AI chat system is properly protected')
        } else {
          console.log('❌ AI Chat error:', chatError.response?.data || chatError.message)
        }
      }

    } catch (regError) {
      console.log('❌ Registration with roleId 1 failed:', regError.response?.data?.message)
      
      // Try finding the correct authority role ID
      console.log('\n🔄 Trying with roleId 3 (might be AUTHORITY)...')
      try {
        testUserData.roleId = 3
        testUserData.email = `quicktest3_${Date.now()}@test.com`
        testUserData.username = `quicktest3_${Date.now()}`
        
        const registerResponse3 = await axios.post(`${baseURL}/auth/register`, testUserData)
        console.log('✅ Registration successful with roleId 3:', registerResponse3.data.user.role)
        
        if (registerResponse3.data.user.role.roleName === 'AUTHORITY') {
          console.log('🎉 Found AUTHORITY role! RoleId 3 is AUTHORITY')
          
          const token = registerResponse3.data.token
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
          
          // Test AI chat with authority user
          const chatResponse = await axios.post(`${baseURL}/authority/chat`, {
            message: "Provide a comprehensive analysis of my tourism database with specific statistics",
            chatHistory: []
          }, { headers })

          if (chatResponse.data.success) {
            console.log('🎉 AI Chat working with AUTHORITY role!')
            console.log('Enhanced database context successfully implemented!')
          }
        }
        
      } catch (error3) {
        console.log('❌ roleId 3 also failed:', error3.response?.data?.message)
      }
    }

  } catch (error) {
    console.error('❌ Quick test failed:', error.message)
  }
}

quickRoleTest()
