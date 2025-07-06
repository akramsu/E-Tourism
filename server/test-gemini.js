// Test script for Gemini AI integration
const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config()

async function testGeminiConnection() {
  try {
    console.log('🧪 Testing Gemini AI connection...')
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
      console.log('❌ Please set a valid GEMINI_API_KEY in your .env file')
      console.log('📝 Get your API key from: https://makersuite.google.com/app/apikey')
      return false
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    console.log('🔄 Sending test request to Gemini...')
    
    const testPrompt = `
Please respond with a simple JSON object for testing:
{
  "status": "success",
  "message": "Gemini AI is working correctly",
  "timestamp": "${new Date().toISOString()}"
}
`
    
    const result = await model.generateContent(testPrompt)
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Gemini AI connection successful!')
    console.log('📨 Response:', text.substring(0, 200) + '...')
    
    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        console.log('✅ JSON parsing successful:', parsed)
      }
    } catch (e) {
      console.log('⚠️  JSON parsing failed, but connection works')
    }
    
    return true
    
  } catch (error) {
    console.log('❌ Gemini AI connection failed:', error.message)
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 Your API key appears to be invalid. Please check:')
      console.log('   1. The key is correct')
      console.log('   2. The key has not expired')
      console.log('   3. You have quota remaining')
    }
    
    return false
  }
}

async function testDatabaseConnection() {
  try {
    console.log('🏗️  Testing database connection...')
    
    const { prisma } = require('./src/config/database')
    
    // Simple query to test connection
    const userCount = await prisma.user.count()
    console.log(`✅ Database connected successfully! Found ${userCount} users.`)
    
    return true
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting TourEase Gemini Integration Tests\n')
  
  const dbTest = await testDatabaseConnection()
  console.log('')
  
  const aiTest = await testGeminiConnection()
  console.log('')
  
  if (dbTest && aiTest) {
    console.log('🎉 All tests passed! Your Gemini AI integration is ready.')
    console.log('📍 You can now use the predictive analytics features.')
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.')
  }
  
  process.exit(0)
}

runTests()
