// Debug script to test frontend API calls
const API_BASE_URL = 'http://localhost:5003'

// Test authority JWT token from previous test
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcwLCJlbWFpbCI6InRlc3QuYXV0aG9yaXR5QHRvdXJlYXNlLmNvbSIsInJvbGUiOiJBVVRIT1JJVFkiLCJpYXQiOjE3NTE4MTk3NDUsImV4cCI6MTc1MTgyMzM0NX0.mVB0UNQtTo6o6t1mKuAfF1EZf9ucZalN9ug9-7bg_unM'

async function testFrontendAPICalls() {
  console.log('🔍 Testing Frontend API Calls')
  console.log('=====================================')

  try {
    // Test predictive analytics endpoint - the same call the frontend makes
    console.log('\n1. Testing getPredictiveAnalytics...')
    
    const predictiveResponse = await fetch(`${API_BASE_URL}/api/authority/predictive-analytics?period=month&includeForecasts=true&forecastPeriod=6`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    })

    if (!predictiveResponse.ok) {
      throw new Error(`HTTP error! status: ${predictiveResponse.status}`)
    }

    const predictiveData = await predictiveResponse.json()
    console.log('✅ Predictive analytics response received')
    console.log('📊 Response structure:', {
      success: predictiveData.success,
      hasData: !!predictiveData.data,
      dataKeys: predictiveData.data ? Object.keys(predictiveData.data) : [],
      trendFactorsCount: predictiveData.data?.trendFactors?.length || 0,
      insightsKeys: predictiveData.data?.insights ? Object.keys(predictiveData.data.insights) : [],
      keyPredictionsCount: predictiveData.data?.insights?.keyPredictions?.length || 0,
      firstTrendFactor: predictiveData.data?.trendFactors?.[0],
      firstKeyPrediction: predictiveData.data?.insights?.keyPredictions?.[0]
    })

    // Test forecast accuracy endpoint
    console.log('\n2. Testing getForecastAccuracy...')
    
    const accuracyResponse = await fetch(`${API_BASE_URL}/api/authority/forecast-accuracy?period=month`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    })

    if (!accuracyResponse.ok) {
      throw new Error(`HTTP error! status: ${accuracyResponse.status}`)
    }

    const accuracyData = await accuracyResponse.json()
    console.log('✅ Forecast accuracy response received')
    console.log('🎯 Accuracy data:', {
      success: accuracyData.success,
      overall: accuracyData.data?.overall,
      trend: accuracyData.data?.trend
    })

    // Simulate frontend data transformation
    console.log('\n3. Simulating frontend data transformation...')
    
    if (predictiveData.success && predictiveData.data) {
      const data = predictiveData.data
      const accuracyDataResult = accuracyData.success ? accuracyData.data : null

      // Check the actual transformation conditions
      const trendFactorsCondition = (data.trendFactors && Array.isArray(data.trendFactors) && data.trendFactors.length > 0)
      const insightsCondition = (data.insights?.keyPredictions && Array.isArray(data.insights.keyPredictions) && data.insights.keyPredictions.length > 0)

      console.log('🔍 Transformation conditions:', {
        trendFactors: {
          exists: !!data.trendFactors,
          isArray: Array.isArray(data.trendFactors),
          hasLength: data.trendFactors?.length > 0,
          finalCondition: trendFactorsCondition
        },
        insights: {
          exists: !!data.insights?.keyPredictions,
          isArray: Array.isArray(data.insights?.keyPredictions),
          hasLength: data.insights?.keyPredictions?.length > 0,
          finalCondition: insightsCondition
        }
      })

      console.log('📈 Will use AI data:', {
        trendFactors: trendFactorsCondition ? 'YES (AI)' : 'NO (Fallback)',
        insights: insightsCondition ? 'YES (AI)' : 'NO (Fallback)'
      })
    }

  } catch (error) {
    console.error('❌ Error testing frontend API calls:', error)
  }
}

testFrontendAPICalls()
