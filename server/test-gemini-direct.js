// Simple test for Gemini service with BigInt handling
const geminiService = require('./src/services/geminiService')

// Test data with BigInt values converted to numbers
const testData = {
  visitTrends: [
    { visitDate: '2025-07-01', _count: { id: 5 }, _sum: { amount: 125000 } },
    { visitDate: '2025-07-02', _count: { id: 8 }, _sum: { amount: 180000 } },
    { visitDate: '2025-07-03', _count: { id: 6 }, _sum: { amount: 150000 } }
  ],
  monthlyMetrics: [
    { month: '2025-01', visits: 120, revenue: 2500000, uniqueVisitors: 95 },
    { month: '2025-02', visits: 135, revenue: 2750000, uniqueVisitors: 110 },
    { month: '2025-03', visits: 150, revenue: 3100000, uniqueVisitors: 125 }
  ],
  attractionPerformance: [
    { name: 'Beach Resort', category: 'Nature', rating: 4.5, totalVisits: 45, recentVisits: 8, recentRevenue: 85000 },
    { name: 'Cultural Center', category: 'Cultural', rating: 4.2, totalVisits: 32, recentVisits: 6, recentRevenue: 65000 }
  ],
  demographics: [
    { gender: 'Male', _count: { id: 65 } },
    { gender: 'Female', _count: { id: 78 } }
  ],
  seasonalPatterns: [
    { month: 1, visits: 420, revenue: 8500000 },
    { month: 2, visits: 380, revenue: 7800000 },
    { month: 3, visits: 450, revenue: 9200000 }
  ]
}

async function testGemini() {
  console.log('🧪 Testing Gemini service directly...')
  
  try {
    console.log('📊 Test data:', JSON.stringify(testData, null, 2))
    
    const result = await geminiService.generatePredictiveAnalytics(testData, {
      period: 'month',
      forecastHorizon: 6,
      includeSeasonality: true,
      includeTrends: true
    })
    
    console.log('✅ Gemini result:', JSON.stringify(result, null, 2))
    
    // Test trend factors
    const trendFactors = await geminiService.analyzeTrendFactors({
      historical: testData,
      current: {
        totalVisits: 150,
        totalRevenue: 3100000,
        averageRating: 4.35
      }
    })
    
    console.log('📈 Trend factors:', JSON.stringify(trendFactors, null, 2))
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testGemini()
