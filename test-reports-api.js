// Test the report generation API with Gemini integration
async function testReportGeneration() {
  const BASE_URL = 'http://localhost:5003'
  
  // First, let's test a simple login to get authentication
  console.log('🔐 Testing authentication...')
  
  try {
    // Test without auth first to see the API structure
    console.log('\n📋 Testing Report Generation API...')
    
    const reportConfig = {
      reportType: 'visitor_analysis',
      reportTitle: 'Test AI Report - Visitor Analysis',
      description: 'Testing Gemini AI integration for visitor analysis',
      dateRange: 'last_month',
      includeCharts: true,
      format: 'pdf'
    }
    
    console.log('Request payload:', JSON.stringify(reportConfig, null, 2))
    
    const response = await fetch(`${BASE_URL}/api/authority/reports/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // For testing, we'll need to add a mock user ID or auth token
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(reportConfig)
    })
    
    const result = await response.text()
    console.log('\n📊 Report Generation Response:')
    console.log('Status:', response.status)
    console.log('Response:', result)
    
    if (response.ok) {
      console.log('✅ Report generation API is working!')
      const data = JSON.parse(result)
      if (data.data && data.data.reportData) {
        console.log('\n🤖 AI-generated content preview:')
        console.log('Summary:', data.data.reportData.summary || 'No summary')
        console.log('Key Findings:', data.data.reportData.keyFindings || 'No findings')
      }
    } else {
      console.log('❌ Report generation failed')
    }
    
  } catch (error) {
    console.error('❌ Error testing report generation:', error.message)
  }
  
  // Test getting existing reports
  console.log('\n📄 Testing Get Reports API...')
  try {
    const reportsResponse = await fetch(`${BASE_URL}/api/authority/reports?limit=5`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })
    
    const reportsResult = await reportsResponse.text()
    console.log('Reports Status:', reportsResponse.status)
    console.log('Reports Response:', reportsResult)
    
  } catch (error) {
    console.error('❌ Error testing get reports:', error.message)
  }
  
  // Test report statistics
  console.log('\n📈 Testing Report Stats API...')
  try {
    const statsResponse = await fetch(`${BASE_URL}/api/authority/reports/stats`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })
    
    const statsResult = await statsResponse.text()
    console.log('Stats Status:', statsResponse.status)
    console.log('Stats Response:', statsResult)
    
  } catch (error) {
    console.error('❌ Error testing report stats:', error.message)
  }
  
  // Test report templates
  console.log('\n📝 Testing Report Templates API...')
  try {
    const templatesResponse = await fetch(`${BASE_URL}/api/authority/reports/templates`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })
    
    const templatesResult = await templatesResponse.text()
    console.log('Templates Status:', templatesResponse.status)
    console.log('Templates Response:', templatesResult)
    
  } catch (error) {
    console.error('❌ Error testing report templates:', error.message)
  }
}

// Run the test
console.log('🚀 Starting Report Generation API Tests...')
console.log('='.repeat(50))

testReportGeneration().then(() => {
  console.log('\n' + '='.repeat(50))
  console.log('✅ Report API tests completed!')
}).catch(error => {
  console.error('\n❌ Test suite failed:', error)
})
