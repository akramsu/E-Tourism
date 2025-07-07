const { PrismaClient } = require('@prisma/client')
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

class ReportsService {
  constructor(geminiService) {
    this.geminiService = geminiService
  }

  /**
   * Generate a comprehensive tourism report using AI analysis
   */
  async generateReport(authorityId, reportConfig) {
    try {
      const {
        reportType,
        reportTitle,
        description,
        dateRange,
        attractionId = null,
        includeAIAnalysis = true,
        includeCharts = true
      } = reportConfig

      console.log(`🤖 Generating ${reportType} report with AI analysis...`)

      // Fetch tourism data based on report type and parameters
      const tourismData = await this.fetchTourismData(reportType, dateRange, attractionId)
      
      let reportData = {
        summary: '',
        keyFindings: [],
        insights: [],
        recommendations: [],
        data: tourismData,
        charts: [],
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType,
          period: dateRange,
          attractionId,
          aiGenerated: includeAIAnalysis
        }
      }

      // Generate AI-powered analysis if enabled
      if (includeAIAnalysis && this.geminiService) {
        console.log('📊 Generating AI analysis for report...')
        const aiAnalysis = await this.generateAIAnalysis(tourismData, reportType, dateRange)
        
        reportData.summary = aiAnalysis.summary
        reportData.keyFindings = aiAnalysis.keyFindings
        reportData.insights = aiAnalysis.insights
        reportData.recommendations = aiAnalysis.recommendations
        reportData.metadata.aiProvider = 'Gemini'
      } else {
        // Fallback to basic analysis
        reportData = this.generateBasicAnalysis(tourismData, reportType)
      }

      // Save report to database
      const savedReport = await prisma.reports.create({
        data: {
          reportType,
          reportTitle,
          description,
          dateRange,
          attractionId,
          authorityId,
          reportData: JSON.stringify(reportData)
        },
        include: {
          authority: {
            select: { username: true }
          },
          attraction: {
            select: { name: true }
          }
        }
      })

      console.log(`✅ Report generated successfully: ID ${savedReport.id}`)
      return savedReport

    } catch (error) {
      console.error('❌ Error generating report:', error)
      throw error
    }
  }

  /**
   * Fetch tourism data based on report parameters
   */
  async fetchTourismData(reportType, dateRange, attractionId = null) {
    try {
      const dateRangeQuery = this.parseDateRange(dateRange)
      
      let baseQuery = {
        visitDate: {
          gte: dateRangeQuery.startDate,
          lte: dateRangeQuery.endDate
        }
      }

      if (attractionId) {
        baseQuery.attractionId = parseInt(attractionId)
      }

      // Common data that all reports need
      const [
        totalVisits,
        totalRevenue,
        uniqueVisitors,
        avgRating,
        visitTrends,
        topAttractions,
        demographics
      ] = await Promise.all([
        // Total visits
        prisma.visit.count({ where: baseQuery }),
        
        // Total revenue
        prisma.visit.aggregate({
          where: { ...baseQuery, amount: { not: null } },
          _sum: { amount: true }
        }),
        
        // Unique visitors
        prisma.visit.findMany({
          where: baseQuery,
          select: { userId: true },
          distinct: ['userId']
        }),

        // Average rating
        prisma.attraction.aggregate({
          where: attractionId ? { id: attractionId } : {},
          _avg: { rating: true }
        }),

        // Daily visit trends
        prisma.visit.groupBy({
          by: ['visitDate'],
          where: baseQuery,
          _count: { id: true },
          _sum: { amount: true },
          orderBy: { visitDate: 'asc' }
        }),

        // Top attractions
        prisma.visit.groupBy({
          by: ['attractionId'],
          where: baseQuery,
          _count: { attractionId: true },
          _sum: { amount: true },
          orderBy: { _count: { attractionId: 'desc' } },
          take: 10
        }),

        // Demographics
        prisma.user.groupBy({
          by: ['gender'],
          where: {
            role: { roleName: 'TOURIST' },
            visits: {
              some: baseQuery
            }
          },
          _count: { id: true }
        })
      ])

      // Get attraction details for top attractions
      const attractionIds = topAttractions.map(ta => ta.attractionId)
      const attractionDetails = await prisma.attraction.findMany({
        where: { id: { in: attractionIds } },
        select: { id: true, name: true, category: true, rating: true }
      })

      // Combine data
      const enrichedTopAttractions = topAttractions.map(ta => {
        const attraction = attractionDetails.find(ad => ad.id === ta.attractionId)
        return {
          ...ta,
          name: attraction?.name || 'Unknown',
          category: attraction?.category || 'Unknown',
          rating: attraction?.rating || 0,
          visits: ta._count.attractionId,
          revenue: ta._sum.amount || 0
        }
      })

      // Report-specific data
      let specificData = {}
      
      switch (reportType) {
        case 'visitor_analysis':
          specificData = await this.fetchVisitorAnalysisData(baseQuery)
          break
        case 'revenue_report':
          specificData = await this.fetchRevenueReportData(baseQuery)
          break
        case 'attraction_performance':
          specificData = await this.fetchAttractionPerformanceData(baseQuery, attractionId)
          break
        case 'demographic_insights':
          specificData = await this.fetchDemographicInsightsData(baseQuery)
          break
      }

      return {
        summary: {
          totalVisits,
          totalRevenue: totalRevenue._sum.amount || 0,
          uniqueVisitors: uniqueVisitors.length,
          avgRating: avgRating._avg.rating || 0,
          dateRange: dateRangeQuery
        },
        visitTrends,
        topAttractions: enrichedTopAttractions,
        demographics,
        ...specificData
      }

    } catch (error) {
      console.error('Error fetching tourism data:', error)
      throw error
    }
  }

  /**
   * Generate AI-powered analysis using Gemini
   */
  async generateAIAnalysis(tourismData, reportType, dateRange) {
    try {
      console.log('🤖 Starting AI analysis generation...')
      console.log('📊 Tourism data:', JSON.stringify(tourismData, null, 2))
      
      if (!this.geminiService || !this.geminiService.model) {
        console.log('⚠️ Gemini service not available, using fallback')
        return this.generateBasicAnalysis(tourismData, reportType)
      }

      const prompt = this.buildReportPrompt(tourismData, reportType, dateRange)
      console.log('📝 Generated prompt length:', prompt.length)
      console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...')
      
      console.log('🔄 Calling Gemini API...')
      const result = await this.geminiService.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('✅ Gemini response received, length:', text.length)
      console.log('📝 Raw AI response:', text)
      
      const parsedResponse = this.parseAIResponse(text)
      console.log('✅ Parsed AI response:', JSON.stringify(parsedResponse, null, 2))
      
      return parsedResponse
      
    } catch (error) {
      console.error('❌ Error generating AI analysis:', error.message)
      console.error('Full error:', error)
      // Return basic analysis as fallback
      return this.generateBasicAnalysis(tourismData, reportType)
    }
  }

  /**
   * Build AI prompt for report generation
   */
  buildReportPrompt(tourismData, reportType, dateRange) {
    const dataStr = JSON.stringify(tourismData, null, 2)
    
    return `
You are a senior tourism analytics consultant with expertise in data-driven insights. Analyze the following tourism data for ${dateRange} and generate a comprehensive ${reportType} report.

TOURISM DATA:
${dataStr}

ANALYSIS REQUIREMENTS:
1. Examine visitor patterns, revenue trends, and performance metrics
2. Identify specific growth opportunities and challenges
3. Provide quantitative insights with percentages and comparisons
4. Consider seasonal factors, demographic trends, and market dynamics
5. Generate actionable recommendations for tourism authorities

Please provide your analysis in this exact JSON format:
{
  "summary": "Executive summary highlighting the most critical insights and overall performance for the ${dateRange} period. Include specific numbers and percentages.",
  "keyFindings": [
    "Data-driven finding with specific metrics (e.g., 'Visitor numbers increased by X% compared to previous period')",
    "Revenue or performance insight with concrete numbers",
    "Trend analysis with quantified changes",
    "Market or demographic pattern with specific data points",
    "Operational insight based on the data provided"
  ],
  "insights": [
    "Deep analytical insight about visitor behavior patterns with supporting data",
    "Revenue generation analysis with performance indicators and trends",
    "Seasonal or temporal patterns identified in the data with specific examples",
    "Demographic or geographic insights derived from visitor data analysis",
    "Performance benchmarking insight comparing different attractions or time periods"
  ],
  "recommendations": [
    "Strategic recommendation for tourism growth based on identified opportunities",
    "Operational improvement suggestion supported by data insights",
    "Marketing or promotional recommendation targeting specific visitor segments",
    "Infrastructure or capacity planning recommendation based on demand patterns",
    "Revenue optimization strategy based on pricing and demand analysis"
  ]
}

IMPORTANT: Ensure all findings include specific numbers, percentages, or quantitative measures from the provided data. Make insights actionable and directly tied to the data analysis.
`
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(text) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // If no JSON found, create structured response from text
      return {
        summary: text.split('\n')[0] || 'AI analysis completed',
        keyFindings: this.extractBulletPoints(text, 'findings'),
        insights: this.extractBulletPoints(text, 'insights'),
        recommendations: this.extractBulletPoints(text, 'recommendations')
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
      return this.generateBasicAnalysis({}, 'general')
    }
  }

  /**
   * Generate basic analysis without AI
   */
  generateBasicAnalysis(tourismData, reportType) {
    const summary = tourismData.summary || {}
    
    return {
      summary: `${reportType} report generated for the specified period. Total visits: ${summary.totalVisits || 0}, Revenue: $${(summary.totalRevenue || 0).toLocaleString()}.`,
      keyFindings: [
        `Total visits recorded: ${summary.totalVisits || 0}`,
        `Total revenue generated: $${(summary.totalRevenue || 0).toLocaleString()}`,
        `Average attraction rating: ${(summary.avgRating || 0).toFixed(1)}/5.0`
      ],
      insights: [
        'Tourism data analysis completed based on available metrics',
        'Visitor patterns show standard tourism behavior',
        'Revenue trends align with industry expectations'
      ],
      recommendations: [
        'Continue monitoring tourism metrics regularly',
        'Focus on maintaining service quality',
        'Consider implementing visitor feedback systems'
      ]
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDF(reportId, format = 'comprehensive') {
    try {
      const report = await prisma.reports.findUnique({
        where: { id: reportId },
        include: {
          authority: { select: { username: true } },
          attraction: { select: { name: true } }
        }
      })

      if (!report) {
        throw new Error('Report not found')
      }

      const reportData = JSON.parse(report.reportData)
      const doc = new PDFDocument({ margin: 50 })
      
      // Create PDF content
      this.buildPDFContent(doc, report, reportData, format)
      
      return doc
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    }
  }

  /**
   * Build PDF content
   */
  buildPDFContent(doc, report, reportData, format) {
    // Header
    doc.fontSize(20).text('TourEase Tourism Report', 50, 50)
    doc.fontSize(16).text(report.reportTitle, 50, 80)
    doc.fontSize(12).text(`Generated: ${new Date(report.generatedDate).toLocaleDateString()}`, 50, 110)
    doc.text(`Report Type: ${report.reportType.replace('_', ' ').toUpperCase()}`, 50, 130)
    doc.text(`Period: ${report.dateRange}`, 50, 150)
    
    if (report.attraction) {
      doc.text(`Attraction: ${report.attraction.name}`, 50, 170)
    }

    // Summary Section
    doc.fontSize(14).text('Executive Summary', 50, 210)
    doc.fontSize(10).text(reportData.summary || 'No summary available', 50, 230, { width: 500 })

    // Key Findings
    let yPosition = 280
    doc.fontSize(14).text('Key Findings', 50, yPosition)
    yPosition += 20
    
    if (reportData.keyFindings && Array.isArray(reportData.keyFindings)) {
      reportData.keyFindings.forEach((finding, index) => {
        doc.fontSize(10).text(`${index + 1}. ${finding}`, 70, yPosition, { width: 480 })
        yPosition += 20
      })
    }

    // Insights
    yPosition += 20
    doc.fontSize(14).text('Insights', 50, yPosition)
    yPosition += 20
    
    if (reportData.insights && Array.isArray(reportData.insights)) {
      reportData.insights.forEach((insight, index) => {
        doc.fontSize(10).text(`• ${insight}`, 70, yPosition, { width: 480 })
        yPosition += 20
      })
    }

    // Recommendations
    yPosition += 20
    doc.fontSize(14).text('Recommendations', 50, yPosition)
    yPosition += 20
    
    if (reportData.recommendations && Array.isArray(reportData.recommendations)) {
      reportData.recommendations.forEach((rec, index) => {
        doc.fontSize(10).text(`${index + 1}. ${rec}`, 70, yPosition, { width: 480 })
        yPosition += 20
      })
    }

    // Data Summary
    if (reportData.data && reportData.data.summary) {
      yPosition += 30
      doc.fontSize(14).text('Data Summary', 50, yPosition)
      yPosition += 20
      
      const summary = reportData.data.summary
      doc.fontSize(10)
      doc.text(`Total Visits: ${summary.totalVisits || 0}`, 70, yPosition)
      doc.text(`Total Revenue: $${(summary.totalRevenue || 0).toLocaleString()}`, 70, yPosition + 15)
      doc.text(`Unique Visitors: ${summary.uniqueVisitors || 0}`, 70, yPosition + 30)
      doc.text(`Average Rating: ${(summary.avgRating || 0).toFixed(1)}/5.0`, 70, yPosition + 45)
    }

    // Footer
    doc.fontSize(8).text('Generated by TourEase Analytics Platform', 50, 750)
    doc.text(`Report ID: ${report.id}`, 50, 765)
  }

  /**
   * Generate a PDF version of the report for download
   */
  async generatePDFReport(report, reportData) {
    try {
      console.log(`📄 Generating PDF for report: ${report.reportTitle}`)
      
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        })
        
        let buffers = []
        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers)
          console.log(`✅ PDF generated successfully, size: ${pdfData.length} bytes`)
          resolve(pdfData)
        })
        doc.on('error', reject)

        // PDF Header
        doc.fontSize(24).fillColor('#2563eb').text('TourEase Analytics Report', 50, 50)
        doc.fontSize(16).fillColor('#64748b').text(report.reportTitle, 50, 85)
        
        // Report metadata
        doc.fontSize(10).fillColor('#94a3b8')
        doc.text(`Generated on: ${new Date(report.generatedDate).toLocaleDateString()}`, 50, 120)
        doc.text(`Report Type: ${report.reportType.replace('_', ' ').toUpperCase()}`, 50, 135)
        doc.text(`Period: ${report.dateRange}`, 50, 150)
        
        if (report.attraction) {
          doc.text(`Attraction: ${report.attraction.name}`, 50, 165)
        }

        // Add AI-generated content
        let yPosition = 200

        // Summary Section
        if (reportData.summary) {
          doc.fontSize(14).fillColor('#1e293b').text('Executive Summary', 50, yPosition)
          yPosition += 25
          doc.fontSize(10).fillColor('#475569')
          
          const summaryLines = this.wrapText(reportData.summary, 500)
          summaryLines.forEach(line => {
            doc.text(line, 50, yPosition)
            yPosition += 12
          })
          yPosition += 20
        }

        // Key Findings
        if (reportData.keyFindings && reportData.keyFindings.length > 0) {
          doc.fontSize(14).fillColor('#1e293b').text('Key Findings', 50, yPosition)
          yPosition += 25
          doc.fontSize(10).fillColor('#475569')
          
          reportData.keyFindings.forEach((finding, index) => {
            doc.text(`${index + 1}. ${finding}`, 70, yPosition)
            yPosition += 15
          })
          yPosition += 20
        }

        // Insights
        if (reportData.insights && reportData.insights.length > 0) {
          doc.fontSize(14).fillColor('#1e293b').text('AI Insights', 50, yPosition)
          yPosition += 25
          doc.fontSize(10).fillColor('#475569')
          
          reportData.insights.forEach((insight, index) => {
            const wrappedInsight = this.wrapText(`• ${insight}`, 480)
            wrappedInsight.forEach(line => {
              doc.text(line, 70, yPosition)
              yPosition += 12
            })
            yPosition += 5
          })
          yPosition += 20
        }

        // Recommendations
        if (reportData.recommendations && reportData.recommendations.length > 0) {
          doc.fontSize(14).fillColor('#1e293b').text('Recommendations', 50, yPosition)
          yPosition += 25
          doc.fontSize(10).fillColor('#475569')
          
          reportData.recommendations.forEach((rec, index) => {
            const wrappedRec = this.wrapText(`${index + 1}. ${rec}`, 480)
            wrappedRec.forEach(line => {
              doc.text(line, 70, yPosition)
              yPosition += 12
            })
            yPosition += 10
          })
          yPosition += 20
        }

        // Data Summary
        if (reportData.data) {
          doc.fontSize(14).fillColor('#1e293b').text('Data Summary', 50, yPosition)
          yPosition += 25
          doc.fontSize(10).fillColor('#475569')
          
          const data = reportData.data
          if (data.totalVisits !== undefined) {
            doc.text(`Total Visits: ${data.totalVisits.toLocaleString()}`, 70, yPosition)
            yPosition += 15
          }
          if (data.totalRevenue !== undefined) {
            doc.text(`Total Revenue: $${data.totalRevenue.toLocaleString()}`, 70, yPosition)
            yPosition += 15
          }
          if (data.uniqueVisitors !== undefined) {
            doc.text(`Unique Visitors: ${data.uniqueVisitors.toLocaleString()}`, 70, yPosition)
            yPosition += 15
          }
          if (data.avgRating !== undefined) {
            doc.text(`Average Rating: ${data.avgRating.toFixed(1)}/5.0`, 70, yPosition)
            yPosition += 15
          }
        }

        // Footer
        const pageHeight = doc.page.height
        doc.fontSize(8).fillColor('#94a3b8')
        doc.text('Generated by TourEase Analytics Platform with AI-powered insights', 50, pageHeight - 50)
        doc.text(`Report ID: ${report.id} | Powered by Google Gemini AI`, 50, pageHeight - 35)

        doc.end()
      })
    } catch (error) {
      console.error('❌ Error generating PDF:', error)
      throw error
    }
  }

  /**
   * Utility function to wrap text for PDF generation
   */
  wrapText(text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let currentLine = ''
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      if (testLine.length * 6 < maxWidth) { // Rough character width estimation
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })
    
    if (currentLine) lines.push(currentLine)
    return lines
  }

  /**
   * Helper methods
   */
  parseDateRange(dateRange) {
    const now = new Date()
    let startDate, endDate

    switch (dateRange) {
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'last_quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'last_year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      default:
        // Try to parse custom date range
        if (dateRange.includes(' to ')) {
          const [start, end] = dateRange.split(' to ')
          startDate = new Date(start)
          endDate = new Date(end)
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          endDate = now
        }
    }

    return { startDate, endDate }
  }

  extractBulletPoints(text, section) {
    const lines = text.split('\n')
    const points = []
    let inSection = false
    
    for (const line of lines) {
      if (line.toLowerCase().includes(section)) {
        inSection = true
        continue
      }
      
      if (inSection && (line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./))) {
        points.push(line.replace(/^[•\-\d\.\s]+/, '').trim())
      }
      
      if (inSection && line.trim() === '') {
        break
      }
    }
    
    return points.length > 0 ? points : [`${section} analysis completed`]
  }

  // Report-specific data fetchers
  async fetchVisitorAnalysisData(baseQuery) {
    // Implementation for visitor analysis specific data
    return {}
  }

  async fetchRevenueReportData(baseQuery) {
    // Implementation for revenue report specific data
    return {}
  }

  async fetchAttractionPerformanceData(baseQuery, attractionId) {
    // Implementation for attraction performance specific data
    return {}
  }

  async fetchDemographicInsightsData(baseQuery) {
    // Implementation for demographic insights specific data
    return {}
  }
}

module.exports = ReportsService
