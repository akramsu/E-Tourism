const express = require('express')
const router = express.Router()
const AuthorityController = require('../controllers/authorityController')
const { authenticate, authorize } = require('../middleware/auth')

// Apply authentication and authority role check to all routes
router.use(authenticate)
router.use(authorize('AUTHORITY'))

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Authority API is running!',
    timestamp: new Date().toISOString()
  })
})

// ============================================================================
// CITY OVERVIEW & METRICS
// ============================================================================

// Get city overview metrics (all attractions)
router.get('/city-metrics', AuthorityController.getCityMetrics)

// Get city-wide analytics
router.get('/analytics', AuthorityController.getCityAnalytics)

// Get city-wide revenue analysis
router.get('/revenue', AuthorityController.getCityRevenue)

// Get city-wide visitor trends
router.get('/visitor-trends', AuthorityController.getCityVisitorTrends)

// Get city-wide demographics
router.get('/demographics', AuthorityController.getCityDemographics)

// Get tourism insights and trends
router.get('/tourism-insights', AuthorityController.getTourismInsights)

// ============================================================================
// ATTRACTIONS MANAGEMENT
// ============================================================================

// Get all attractions overview
router.get('/attractions', AuthorityController.getAllAttractions)

// Advanced search and filtering
router.get('/attractions/search', AuthorityController.searchAttractions)

// Get filter options (categories, locations, etc.)
router.get('/attractions/filter-options', AuthorityController.getFilterOptions)

// Export filtered attractions
router.get('/attractions/export', AuthorityController.exportFilteredAttractions)

// Get specific attraction details
router.get('/attractions/:id', AuthorityController.getAttractionDetails)

// Get attraction statistics
router.get('/attractions/:id/statistics', AuthorityController.getAttractionStatistics)

// ============================================================================
// PERFORMANCE ANALYSIS & COMPARISONS
// ============================================================================

// Get performance comparison across attractions
router.get('/attraction-comparison', AuthorityController.getAttractionComparison)

// Get comprehensive attraction comparison data
router.get('/attraction-comparison-data', AuthorityController.getAttractionComparisonData)

// Get category-wise performance statistics
router.get('/category-performance', AuthorityController.getCategoryPerformanceStats)

// Get performance benchmarks
router.get('/performance-benchmarks', AuthorityController.getPerformanceBenchmarks)

// Get improvement recommendations
router.get('/improvement-recommendations', AuthorityController.getImprovementRecommendations)

// Get performance ranking table data
router.get('/performance-rankings', AuthorityController.getPerformanceRankings)

// ============================================================================
// REPORT MANAGEMENT
// ============================================================================

// Get all reports
router.get('/reports', AuthorityController.getReports)

// Generate a new report
router.post('/reports/generate', AuthorityController.generateReport)

// Get report templates
router.get('/reports/templates', AuthorityController.getReportTemplates)

// Create custom report template
router.post('/reports/templates', AuthorityController.createReportTemplate)

// Get report statistics
router.get('/reports/stats', AuthorityController.getReportStats)

// Get available report types
router.get('/reports/types', AuthorityController.getReportTypes)

// Schedule automated report generation
router.post('/reports/schedule', AuthorityController.scheduleReport)

// Get scheduled reports
router.get('/reports/scheduled', AuthorityController.getScheduledReports)

// Get specific report details
router.get('/reports/:id', AuthorityController.getReport)

// Download report file
router.get('/reports/:id/download', AuthorityController.downloadReport)

// Delete a report
router.delete('/reports/:id', AuthorityController.deleteReport)

// ============================================================================
// PREDICTIVE ANALYTICS
// ============================================================================

// Get predictive analytics
router.get('/predictive-analytics', AuthorityController.getPredictiveAnalytics)

// Test endpoint for Gemini (temporary - remove in production)
router.get('/test-gemini', async (req, res) => {
  try {
    const geminiService = require('../services/geminiService')
    const testData = {
      visitTrends: [{ _count: { id: 10 }, _sum: { amount: 500 } }],
      monthlyMetrics: [{ month: '2025-07', visits: 100, revenue: 5000, uniqueVisitors: 80 }],
      attractionPerformance: [{ name: 'Test Attraction', category: 'Museum', rating: 4.5 }],
      demographics: [{ gender: 'male', _count: { id: 50 } }],
      seasonalPatterns: [{ month: 7, visits: 120, revenue: 6000 }]
    }
    
    const result = await geminiService.generatePredictiveAnalytics(testData, { period: 'month', forecastHorizon: 6 })
    res.json({ success: true, data: result })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})

// Get forecast accuracy metrics
router.get('/forecast-accuracy', AuthorityController.getForecastAccuracy)

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

// Get authority profile
router.get('/profile', AuthorityController.getProfile)

// Update authority profile
router.put('/profile', AuthorityController.updateProfile)

// Upload profile picture
router.post('/profile/picture', AuthorityController.uploadProfilePicture)

// Get profile statistics
router.get('/profile/stats', AuthorityController.getProfileStats)

// Get activity log
router.get('/activity-log', AuthorityController.getActivityLog)

// Change password
router.post('/profile/change-password', AuthorityController.changePassword)

// Delete account
router.delete('/profile', AuthorityController.deleteAccount)

module.exports = router
