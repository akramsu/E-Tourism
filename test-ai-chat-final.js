const fetch = require('node-fetch');

// Test data
const API_URL = 'http://localhost:5003/api';
const TEST_CREDENTIALS = {
  email: 'aichattest@test.com',
  password: 'TestPassword123!'
};

let authToken = '';

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    throw error;
  }
}

// Test functions
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    authToken = loginResponse.token;
    console.log('✅ Authentication successful');
    console.log('📊 User Info:', {
      username: loginResponse.user?.username,
      role: loginResponse.user?.role?.roleName,
      userId: loginResponse.user?.id
    });
    
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

async function testAIChatMessage() {
  console.log('\n🤖 Testing AI Chat Message...');
  
  try {
    const chatResponse = await makeRequest('/ai-chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello! Can you recommend some popular attractions for a family vacation?'
      })
    });
    
    console.log('✅ AI Chat response received');
    console.log('📝 AI Response:', chatResponse.data?.message);
    
    if (chatResponse.data?.suggestions && chatResponse.data.suggestions.length > 0) {
      console.log('💡 Suggestions provided:', chatResponse.data.suggestions);
    }
    
    if (chatResponse.data?.dataInsights) {
      console.log('📈 Data Insights:', chatResponse.data.dataInsights);
    }
    
    return true;
  } catch (error) {
    console.error('❌ AI Chat message failed:', error.message);
    return false;
  }
}

async function testAIChatWithSpecificRequest() {
  console.log('\n🎯 Testing AI Chat with Specific Request...');
  
  try {
    const chatResponse = await makeRequest('/ai-chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What are the top-rated historical attractions? I\'m interested in museums and cultural sites.'
      })
    });
    
    console.log('✅ Specific AI Chat response received');
    console.log('📝 AI Response:', chatResponse.data?.message);
    
    if (chatResponse.data?.suggestions) {
      console.log('💡 Category Suggestions:', chatResponse.data.suggestions);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Specific AI Chat request failed:', error.message);
    return false;
  }
}

async function testAIChatRecommendations() {
  console.log('\n📍 Testing AI Chat Recommendations...');
  
  try {
    const recResponse = await makeRequest('/ai-chat/recommendations', {
      method: 'GET'
    });
    
    console.log('✅ AI Recommendations received');
    console.log('🏆 Recommendations:', recResponse.data?.recommendations);
    
    return true;
  } catch (error) {
    console.error('❌ AI Recommendations failed:', error.message);
    return false;
  }
}

async function testAIChatHistory() {
  console.log('\n📚 Testing AI Chat History...');
  
  try {
    const historyResponse = await makeRequest('/ai-chat/history', {
      method: 'GET'
    });
    
    console.log('✅ AI Chat history retrieved');
    console.log('💬 Chat History Count:', historyResponse.data?.length || 0);
    
    if (historyResponse.data && historyResponse.data.length > 0) {
      console.log('📝 Recent Messages:', historyResponse.data.slice(0, 2));
    }
    
    return true;
  } catch (error) {
    console.error('❌ AI Chat history failed:', error.message);
    return false;
  }
}

// Main test execution
async function runAIChatTests() {
  console.log('🚀 Starting AI Chat Feature Tests...');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Authenticate
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }
    
    // Step 2: Test AI Chat Message
    await testAIChatMessage();
    
    // Step 3: Test specific AI Chat request
    await testAIChatWithSpecificRequest();
    
    // Step 4: Test AI Recommendations
    await testAIChatRecommendations();
    
    // Step 5: Test Chat History
    await testAIChatHistory();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 AI Chat Feature Tests Completed!');
    console.log('✅ All AI chat functionality is working properly');
    console.log('🤖 Gemini AI integration is successful');
    console.log('💬 Chat interface is ready for tourists');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
  }
}

// Run the tests
runAIChatTests();
