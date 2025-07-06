const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

// Test configuration
const BASE_URL = 'http://localhost:5003';
const TEST_AUTHORITY_ID = 1;

async function testGeminiIntegration() {
  console.log('🧪 TourEase Gemini AI Integration Test');
  console.log('=====================================');
  console.log('');
  
  try {
    // Test 1: Check API key configuration
    console.log('📋 Test 1: API Configuration Check');
    const hasApiKey = process.env.GEMINI_API_KEY && 
                     process.env.GEMINI_API_KEY.trim() !== '' &&
                     process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
    
    if (hasApiKey) {
      console.log('✅ Gemini API Key is configured');
      console.log(`   Key: ${process.env.GEMINI_API_KEY.substring(0, 8)}...`);
    } else {
      console.log('❌ Gemini API Key not configured');
      console.log('   Please follow the setup guide in setup-gemini.sh');
      return;
    }
    console.log('');

    // Test 2: Test different periods
    console.log('📋 Test 2: Period-Specific Analytics');
    const periods = ['week', 'month', 'quarter', 'year'];
    const results = {};
    
    for (const period of periods) {
      try {
        console.log(`   Testing ${period}...`);
        const response = await axios.get(
          `${BASE_URL}/api/authority/predictive-analytics/${TEST_AUTHORITY_ID}?period=${period}`
        );
        
        if (response.data.success) {
          const analytics = response.data.data;
          results[period] = {
            trendFactors: analytics.trendFactors?.length || 0,
            predictions: analytics.predictions?.length || 0,
            growthRate: analytics.keyMetrics?.growthRate || 0,
            nextMonthVisitors: analytics.keyMetrics?.nextMonthVisitors || 0,
            aiGenerated: analytics.metadata?.generatedAt || null,
            usedAI: analytics.metadata?.source === 'ai'
          };
          
          const indicator = results[period].usedAI ? '🤖 AI' : '📊 Fallback';
          console.log(`   ${indicator} ${period}: Growth ${results[period].growthRate}%, Visitors ${results[period].nextMonthVisitors}`);
        } else {
          console.log(`   ❌ ${period}: API error`);
        }
      } catch (error) {
        console.log(`   ❌ ${period}: ${error.message}`);
      }
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('');
    
    // Test 3: Analyze variation
    console.log('📋 Test 3: AI Variation Analysis');
    const growthRates = Object.values(results).map(r => r.growthRate).filter(Boolean);
    const visitorCounts = Object.values(results).map(r => r.nextMonthVisitors).filter(Boolean);
    const aiResponses = Object.values(results).filter(r => r.usedAI);
    
    const uniqueGrowthRates = [...new Set(growthRates)];
    const uniqueVisitorCounts = [...new Set(visitorCounts)];
    
    console.log(`   AI Responses: ${aiResponses.length}/${periods.length}`);
    console.log(`   Unique Growth Rates: ${uniqueGrowthRates.length} (${uniqueGrowthRates.join(', ')}%)`);
    console.log(`   Unique Visitor Counts: ${uniqueVisitorCounts.length} (${uniqueVisitorCounts.join(', ')})`);
    
    if (aiResponses.length === 0) {
      console.log('   ❌ No AI responses received - check API key and quota');
    } else if (uniqueGrowthRates.length === 1 && uniqueVisitorCounts.length === 1) {
      console.log('   ⚠️  All AI responses are identical - may need prompt improvement');
    } else {
      console.log('   ✅ AI responses show variation across periods');
    }
    
    console.log('');
    
    // Test 4: Detailed comparison for debugging
    if (aiResponses.length > 0) {
      console.log('📋 Test 4: Detailed AI Response Analysis');
      for (const [period, result] of Object.entries(results)) {
        if (result.usedAI) {
          console.log(`   ${period.toUpperCase()}:`);
          console.log(`     Growth Rate: ${result.growthRate}%`);
          console.log(`     Next Month Visitors: ${result.nextMonthVisitors}`);
          console.log(`     Generated: ${result.aiGenerated}`);
        }
      }
    }
    
    console.log('');
    console.log('🎯 Integration Summary');
    console.log('=====================');
    
    if (aiResponses.length === periods.length) {
      if (uniqueGrowthRates.length > 1 || uniqueVisitorCounts.length > 1) {
        console.log('✅ SUCCESS: AI integration working with period-specific variation');
      } else {
        console.log('⚠️  PARTIAL: AI working but responses are identical across periods');
        console.log('   Consider improving prompt engineering for more variation');
      }
    } else if (aiResponses.length > 0) {
      console.log('⚠️  PARTIAL: Some AI responses, some fallback data');
      console.log('   May be hitting rate limits - try again later');
    } else {
      console.log('❌ FAILURE: All responses using fallback data');
      console.log('   Check API key configuration and quota');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testGeminiIntegration();
}

module.exports = { testGeminiIntegration };
