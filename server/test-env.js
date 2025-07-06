// Test environment variables
require('dotenv').config()

console.log('🔍 Environment variable check:')
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0)
console.log('GEMINI_API_KEY value:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...')

const geminiService = require('./src/services/geminiService')

// Simple test
async function testWithEnv() {
  console.log('\n🧪 Testing Gemini service with environment loaded...')
  
  const testData = {
    visitTrends: [
      { visitDate: '2025-07-01', _count: { id: 5 }, _sum: { amount: 125000 } }
    ],
    monthlyMetrics: [
      { month: '2025-01', visits: 120, revenue: 2500000, uniqueVisitors: 95 }
    ],
    attractionPerformance: [],
    demographics: [],
    seasonalPatterns: []
  }
  
  try {
    const result = await geminiService.generatePredictiveAnalytics(testData, {
      period: 'month',
      forecastHorizon: 3
    })
    
    console.log('✅ Result type:', typeof result)
    console.log('✅ Has forecastMetrics:', !!result?.forecastMetrics)
    
    if (result?.metadata?.aiProvider) {
      console.log('🤖 AI Provider:', result.metadata.aiProvider)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testWithEnv()
