// Test script to verify Gemini AI report generation
const express = require('express')

async function testReportGeneration() {
  try {
    console.log('🧪 Testing Gemini AI report generation...')
    
    // Test with the known working user
    const testEmail = 'user18@example.com'
    const testPassword = 'test123'
    
    // Login to get token
    console.log('🔑 Logging in...')
    const loginResponse = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    })

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      console.error('❌ Login failed:', errorText)
      return
    }

    const loginData = await loginResponse.json()
    console.log('✅ Login successful')
    
    const token = loginData.token

    // Generate a test report
    console.log('\n📊 Generating test report with AI...')
    const reportConfig = {
      reportType: 'visitor_analysis',
      reportTitle: 'AI Test Report - ' + new Date().toISOString(),
      description: 'Testing Gemini AI report generation with real data',
      dateRange: 'last_month',
      includeCharts: true,
      format: 'pdf'
    }

    const reportResponse = await fetch('http://localhost:5003/api/authority/reports/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportConfig)
    })

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text()
      console.error('❌ Report generation failed:', errorText)
      return
    }

    const reportData = await reportResponse.json()
    console.log('✅ Report generated successfully!')
    
    // Display the AI-generated content
    if (reportData.success && reportData.data) {
      const report = reportData.data
      console.log('\n🤖 AI-Generated Report Content:')
      console.log('Title:', report.reportTitle)
      console.log('AI Generated:', report.reportData?.metadata?.aiGenerated)
      console.log('AI Provider:', report.reportData?.metadata?.aiProvider)
      
      if (report.reportData?.summary) {
        console.log('\n📝 Summary:')
        console.log(report.reportData.summary)
      }
      
      if (report.reportData?.keyFindings?.length > 0) {
        console.log('\n🔍 Key Findings:')
        report.reportData.keyFindings.forEach((finding, index) => {
          console.log(`${index + 1}. ${finding}`)
        })
      }
      
      if (report.reportData?.insights?.length > 0) {
        console.log('\n💡 AI Insights:')
        report.reportData.insights.forEach((insight, index) => {
          console.log(`${index + 1}. ${insight}`)
        })
      }
      
      if (report.reportData?.recommendations?.length > 0) {
        console.log('\n🎯 AI Recommendations:')
        report.reportData.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`)
        })
      }
      
      // Test PDF download
      console.log('\n📄 Testing PDF download...')
      const pdfResponse = await fetch(`http://localhost:5003/api/authority/reports/${report.id}/download?format=pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (pdfResponse.ok) {
        console.log('✅ PDF download endpoint working')
        const blob = await pdfResponse.blob()
        console.log(`📄 PDF size: ${blob.size} bytes`)
      } else {
        console.log('❌ PDF download failed')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testReportGeneration()
