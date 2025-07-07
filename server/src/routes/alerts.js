const express = require('express')
const { prisma } = require('../config/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

// Get all alerts with filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      resolved = 'all',
      page = 1,
      limit = 50,
      alertType 
    } = req.query
    
    const where = {}
    
    if (resolved !== 'all') {
      where.alertResolved = resolved === 'true'
    }
    
    if (alertType) {
      where.alertType = alertType
    }
    
    const alerts = await prisma.alerts.findMany({
      where,
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        triggeredAt: 'desc'
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    })
    
    res.status(200).json({
      success: true,
      data: alerts
    })
    
  } catch (error) {
    console.error('Error fetching alerts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// Get alert by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    
    const alert = await prisma.alerts.findUnique({
      where: { id: parseInt(id) },
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      })
    }
    
    res.status(200).json({
      success: true,
      data: alert
    })
    
  } catch (error) {
    console.error('Error fetching alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// Create new alert
router.post('/', authenticate, async (req, res) => {
  try {
    const { alertType, alertMessage, alertData } = req.body
    
    if (!alertType || !alertMessage) {
      return res.status(400).json({
        success: false,
        message: 'alertType and alertMessage are required'
      })
    }
    
    const alert = await prisma.alerts.create({
      data: {
        alertType,
        alertMessage,
        alertData: alertData ? JSON.stringify(alertData) : null,
        triggeredById: req.user.id
      },
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully'
    })
    
  } catch (error) {
    console.error('Error creating alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// Update alert (mark as resolved)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { alertResolved } = req.body
    
    const alert = await prisma.alerts.update({
      where: { id: parseInt(id) },
      data: {
        alertResolved
      },
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })
    
    res.status(200).json({
      success: true,
      data: alert,
      message: 'Alert updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update alert',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// Delete alert
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.alerts.delete({
      where: { id: parseInt(id) }
    })
    
    res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting alert:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

module.exports = router
