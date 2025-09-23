const express = require('express')
const router = express.Router()
const OwnerController = require('../controllers/OwnerController')
const { authenticate, authorize } = require('../middleware/auth')
const { prisma } = require('../config/database')
const multer = require('multer')

// Configure multer for image uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error)
    return res.status(400).json({
      success: false,
      message: `File upload error: ${error.message}`
    })
  } else if (error) {
    console.error('File upload error:', error)
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    })
  }
  next()
}

// Apply authentication and owner role check to all routes
router.use(authenticate)
router.use(authorize('OWNER'))

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Owner API is running!',
    timestamp: new Date().toISOString()
  })
})

// ============================================================================
// ATTRACTION MANAGEMENT
// ============================================================================

// Get owner's attraction
router.get('/attraction', OwnerController.getMyAttraction)

// Create new attraction
router.post('/attraction', OwnerController.createAttraction)

// Update attraction
router.put('/attraction/:id', OwnerController.updateAttraction)

// Delete attraction
router.delete('/attraction/:id', OwnerController.deleteAttraction)

// ============================================================================
// IMAGE MANAGEMENT
// ============================================================================

// Upload attraction images
router.post('/attraction/:id/images', upload.array('images', 10), handleMulterError, OwnerController.uploadAttractionImages)

// Delete attraction image
router.delete('/attraction/:id/images/:imageId', OwnerController.deleteAttractionImage)

// ============================================================================
// ANALYTICS AND PERFORMANCE
// ============================================================================

// Get performance metrics
router.get('/attraction/:id/metrics', OwnerController.getPerformanceMetrics)

// Get attraction analytics
router.get('/attraction/:id/analytics', OwnerController.getAttractionAnalytics)

// Get daily highlights
router.get('/attraction/:id/highlights', OwnerController.getDailyHighlights)

// ============================================================================
// VISITOR ANALYSIS
// ============================================================================

// Get visitor analytics
router.get('/attraction/:id/visitor-analytics', OwnerController.getVisitorAnalytics)

// Get visitor demographics
router.get('/attraction/:id/visitor-demographics', OwnerController.getVisitorDemographics)

// Get visitor behavior insights
router.get('/attraction/:id/visitor-behavior', OwnerController.getVisitorBehavior)

// ============================================================================
// REVENUE ANALYSIS & CUSTOMER INSIGHTS
// ============================================================================

// Get revenue analysis
router.get('/attraction/:id/revenue-analysis', OwnerController.getRevenueAnalysis)

// Get customer insights
router.get('/attraction/:id/customer-insights', OwnerController.getCustomerInsights)

// ============================================================================
// FORECASTING AND PLANNING
// ============================================================================

// Get forecast data
router.get('/attraction/:id/forecast', OwnerController.getForecastData)

// Get capacity planning
router.get('/attraction/:id/capacity-planning', OwnerController.getCapacityPlanning)

// Get pricing recommendations
router.get('/attraction/:id/pricing-recommendations', OwnerController.getPricingRecommendations)

// ============================================================================
// REPORTS MANAGEMENT
// ============================================================================

// Get available report types
router.get('/report-types', OwnerController.getReportTypes)

// Get reports for attraction
router.get('/attraction/:id/reports', OwnerController.getReports)

// Generate new report
router.post('/attraction/:id/reports', OwnerController.generateReport)

// Get available metrics for reports
router.get('/attraction/:id/report-metrics', OwnerController.getAvailableMetrics)

// Download specific report
router.get('/attraction/:id/reports/:reportId/download', OwnerController.downloadReport)

// Delete specific report
router.delete('/attraction/:id/reports/:reportId', OwnerController.deleteReport)

// ============================================================================
// PROFILE MANAGEMENT (Basic Implementation)
// ============================================================================

// Get owner profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        birthDate: true,
        postcode: true,
        gender: true,
        profilePicture: true,
        createdDate: true
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error getting owner profile:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    })
  }
})

// Update owner profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id
    const updateData = req.body

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        birthDate: true,
        postcode: true,
        gender: true,
        profilePicture: true,
        createdDate: true
      }
    })

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating owner profile:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    })
  }
})

module.exports = router
