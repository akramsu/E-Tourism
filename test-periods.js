// Test different time periods to ensure data changes
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcwLCJlbWFpbCI6InRlc3QuYXV0aG9yaXR5QHRvdXJlYXNlLmNvbSIsInJvbGUiOiJBVVRIT1JJVFkiLCJpYXQiOjE3NTE4MjIwMjEsImV4cCI6MTc1MTgyNTYyMX0.SPqV4DT35F3enl_WlDO0bcsGQBiBraeqPuVazl2nEVQ'

async function testDifferentPeriods() {
  console.log('🔄 Testing Different Time Periods')
  console.log('=====================================')

  const periods = ['week', 'month', 'quarter', 'year']
  const results = {}

  for (const period of periods) {
    try {
      console.log(`\n📊 Testing period: ${period}`)
      
      const response = await fetch(`http://localhost:5003/api/authority/predictive-analytics?period=${period}&includeForecasts=true&forecastPeriod=6`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const responseData = await response.json()
        if (responseData.success) {
          const data = responseData.data
          results[period] = {
            trendFactorsCount: data.trendFactors?.length || 0,
            firstTrendFactor: data.trendFactors?.[0]?.factor,
            firstKeyPrediction: data.insights?.keyPredictions?.[0],
            nextMonthVisitors: data.forecastMetrics?.nextMonthVisitors,
            growthRate: data.forecastMetrics?.growthRate,
            generatedAt: data.metadata?.generatedAt
          }
          
          console.log(`✅ ${period}: ${data.trendFactors?.length || 0} trend factors, ${data.insights?.keyPredictions?.length || 0} predictions`)
          console.log(`   Growth Rate: ${data.forecastMetrics?.growthRate}%, Visitors: ${data.forecastMetrics?.nextMonthVisitors}`)
        } else {
          console.log(`❌ ${period}: API returned error`)
        }
      } else {
        console.log(`❌ ${period}: HTTP ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${period}: Error - ${error.message}`)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n📈 COMPARISON RESULTS:')
  console.log('=====================================')
  
  for (const [period, data] of Object.entries(results)) {
    console.log(`\n${period.toUpperCase()}:`)
    console.log(`- Trend Factors: ${data.trendFactorsCount}`)
    console.log(`- First Factor: "${data.firstTrendFactor}"`)
    console.log(`- First Prediction: "${data.firstKeyPrediction}"`)
    console.log(`- Growth Rate: ${data.growthRate}%`)
    console.log(`- Next Month Visitors: ${data.nextMonthVisitors}`)
    console.log(`- Generated: ${data.generatedAt}`)
  }

  // Check if data is different between periods
  const uniqueGrowthRates = new Set(Object.values(results).map(r => r.growthRate))
  const uniqueVisitorCounts = new Set(Object.values(results).map(r => r.nextMonthVisitors))
  const uniquePredictions = new Set(Object.values(results).map(r => r.firstKeyPrediction))

  console.log('\n🔍 VARIATION ANALYSIS:')
  console.log('=====================================')
  console.log(`Unique Growth Rates: ${uniqueGrowthRates.size} (${Array.from(uniqueGrowthRates).join(', ')})`)
  console.log(`Unique Visitor Counts: ${uniqueVisitorCounts.size} (${Array.from(uniqueVisitorCounts).join(', ')})`)
  console.log(`Unique Predictions: ${uniquePredictions.size}`)

  if (uniqueGrowthRates.size > 1 || uniqueVisitorCounts.size > 1) {
    console.log('✅ SUCCESS: Data varies between different time periods!')
  } else {
    console.log('⚠️ WARNING: Data appears to be the same across periods')
  }
}

testDifferentPeriods().catch(console.error)
