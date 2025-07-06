const axios = require('axios');

// Use the JWT token from our test
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcwLCJlbWFpbCI6InRlc3QuYXV0aG9yaXR5QHRvdXJlYXNlLmNvbSIsInJvbGUiOiJBVVRIT1JJVFkiLCJpYXQiOjE3NTE4MjA0MTksImV4cCI6MTc1MTgyNDAxOX0.8GfpABcdFbSp6guS32C2W5nq1ZE7yPiig8sSb7dLy8g';

async function testFrontendDataIntegration() {
  console.log('🔬 Testing Frontend Data Integration');
  console.log('====================================');

  try {
    console.log('1. Testing backend API directly...');
    
    // Test the backend API
    const backendResponse = await axios.get('http://localhost:5003/api/authority/predictive-analytics', {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Backend Response Status:', backendResponse.status);
    const backendData = backendResponse.data;
    
    console.log('\n📊 Backend AI Data Summary:');
    console.log('- Success:', backendData.success);
    console.log('- Trend Factors Count:', backendData.data?.trendFactors?.length || 0);
    console.log('- First Trend Factor:', backendData.data?.trendFactors?.[0]?.factor || 'None');
    console.log('- Key Predictions Count:', backendData.data?.insights?.keyPredictions?.length || 0);
    console.log('- First Key Prediction:', backendData.data?.insights?.keyPredictions?.[0] || 'None');
    console.log('- AI Provider:', backendData.data?.metadata?.aiProvider || 'Unknown');
    console.log('- Generated At:', backendData.data?.metadata?.generatedAt || 'Unknown');
    
    console.log('\n🔍 Raw Trend Factors from AI:');
    if (backendData.data?.trendFactors) {
      backendData.data.trendFactors.forEach((factor, index) => {
        console.log(`  ${index + 1}. ${factor.factor} (${factor.impact}, ${factor.expectedChange}%)`);
        console.log(`     Category: ${factor.category}, Confidence: ${factor.confidence}%`);
        console.log(`     Description: ${factor.description.substring(0, 100)}...`);
      });
    }
    
    console.log('\n🎯 Raw Insights from AI:');
    if (backendData.data?.insights) {
      console.log('Key Predictions:');
      backendData.data.insights.keyPredictions?.forEach((prediction, index) => {
        console.log(`  ${index + 1}. ${prediction}`);
      });
      
      console.log('\nRisk Factors:');
      backendData.data.insights.riskFactors?.forEach((risk, index) => {
        console.log(`  ${index + 1}. ${risk}`);
      });
      
      console.log('\nOpportunities:');
      backendData.data.insights.opportunities?.forEach((opportunity, index) => {
        console.log(`  ${index + 1}. ${opportunity}`);
      });
    }

    // Simulate the frontend data transformation logic
    console.log('\n🔄 Simulating Frontend Data Transformation...');
    const data = backendData.data;
    
    const trendFactorsCondition = (data.trendFactors && Array.isArray(data.trendFactors) && data.trendFactors.length > 0);
    const keyPredictionsCondition = (data.insights?.keyPredictions && Array.isArray(data.insights.keyPredictions) && data.insights.keyPredictions.length > 0);
    const riskFactorsCondition = (data.insights?.riskFactors && Array.isArray(data.insights.riskFactors) && data.insights.riskFactors.length > 0);
    const opportunitiesCondition = (data.insights?.opportunities && Array.isArray(data.insights.opportunities) && data.insights.opportunities.length > 0);
    
    console.log('Frontend Condition Checks:');
    console.log('- trendFactors condition:', trendFactorsCondition);
    console.log('- keyPredictions condition:', keyPredictionsCondition);
    console.log('- riskFactors condition:', riskFactorsCondition);
    console.log('- opportunities condition:', opportunitiesCondition);
    
    const transformedTrendFactors = trendFactorsCondition 
      ? data.trendFactors.map(factor => ({
          factor: factor.factor,
          impact: factor.impact,
          description: factor.description,
          expectedChange: factor.expectedChange,
          category: factor.category
        }))
      : [/* fallback data would be here */];
    
    const transformedInsights = {
      keyPredictions: keyPredictionsCondition ? data.insights.keyPredictions : [/* fallback */],
      riskFactors: riskFactorsCondition ? data.insights.riskFactors : [/* fallback */],
      opportunities: opportunitiesCondition ? data.insights.opportunities : [/* fallback */]
    };
    
    console.log('\n✨ Frontend Transformation Results:');
    console.log('- Will use AI trend factors:', trendFactorsCondition);
    console.log('- Will use AI key predictions:', keyPredictionsCondition);
    console.log('- Will use AI risk factors:', riskFactorsCondition);
    console.log('- Will use AI opportunities:', opportunitiesCondition);
    
    if (trendFactorsCondition) {
      console.log('\n🎉 SUCCESS: Frontend will display real AI trend factors!');
      console.log('Transformed trend factors:');
      transformedTrendFactors.forEach((factor, index) => {
        console.log(`  ${index + 1}. ${factor.factor} (${factor.impact}, ${factor.expectedChange}%)`);
      });
    } else {
      console.log('\n❌ ISSUE: Frontend will fall back to hardcoded trend factors');
    }
    
    if (keyPredictionsCondition && riskFactorsCondition && opportunitiesCondition) {
      console.log('\n🎉 SUCCESS: Frontend will display real AI insights!');
    } else {
      console.log('\n❌ ISSUE: Frontend will fall back to hardcoded insights');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendDataIntegration();
