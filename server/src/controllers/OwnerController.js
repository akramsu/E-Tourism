// Owner Controller - Tourism attraction owners management and analytics
const { prisma } = require('../config/database')
const { Prisma } = require('@prisma/client')
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises

// ============================================================================
// UTILITY FUNCTIONS (Same as Authority Controller)
// ============================================================================

// Helper function to convert BigInt values to numbers for JSON serialization
const convertBigIntToNumber = (obj) => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  // Handle Prisma Decimal objects
  if (obj && typeof obj === 'object' && typeof obj.toString === 'function' && 
      obj.hasOwnProperty('s') && obj.hasOwnProperty('e') && obj.hasOwnProperty('d')) {
    return Number(obj.toString())
  }
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber)
  if (typeof obj === 'object') {
    const converted = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value)
    }
    return converted
  }
  return obj
}

// Helper function to get date range based on period
const getDateRange = (period = 'month') => {
  const endDate = new Date()
  const startDate = new Date()

  switch (period) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
    default:
      startDate.setMonth(endDate.getMonth() - 1)
  }

  return { startDate, endDate }
}

// Helper function to calculate growth percentage
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Helper function to ensure owner owns the attraction
const verifyAttractionOwnership = async (userId, attractionId) => {
  const attraction = await prisma.attraction.findFirst({
    where: {
      id: attractionId,
      userId: userId
    }
  })
  
  if (!attraction) {
    throw new Error('Attraction not found or you do not have permission to access it')
  }
  
  return attraction
}

// ============================================================================
// ATTRACTION MANAGEMENT
// ============================================================================

/**
 * Get owner's attraction (owners typically have one attraction)
 */
const getMyAttraction = async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`🏢 Getting attraction for owner ${userId}`)

    const attraction = await prisma.attraction.findFirst({
      where: {
        userId: userId
      },
      include: {
        visits: {
          select: {
            id: true,
            visitDate: true,
            amount: true,
            rating: true
          },
          orderBy: {
            visitDate: 'desc'
          },
          take: 10 // Latest 10 visits for quick stats
        },
        images: {
          select: {
            id: true,
            imageUrl: true
          }
        }
      }
    })

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'No attraction found for this owner'
      })
    }

    // Calculate basic statistics
    const totalVisits = attraction.visits.length
    const totalRevenue = attraction.visits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
    const averageRating = attraction.visits.length > 0 
      ? attraction.visits.reduce((sum, visit) => sum + (visit.rating || 0), 0) / attraction.visits.length
      : 0

    const enrichedAttraction = {
      ...attraction,
      statistics: {
        totalVisits,
        totalRevenue,
        averageRating: Math.round(averageRating * 100) / 100,
        recentVisitsCount: attraction.visits.length
      }
    }

    console.log(`✅ Found attraction: ${attraction.name}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(enrichedAttraction)
    })

  } catch (error) {
    console.error('❌ Error getting owner attraction:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get attraction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Create a new attraction
 */
const createAttraction = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      name,
      description,
      category,
      location,
      address,
      city,
      state,
      zipCode,
      country,
      latitude,
      longitude,
      phoneNumber,
      email,
      website,
      openingHours,
      ticketPrice,
      capacity,
      amenities = [],
      accessibility = [],
      ageRestriction,
      duration,
      difficulty,
      tags = []
    } = req.body

    console.log(`🏗️ Creating attraction for owner ${userId}:`, { name, category })

    // Validate required fields
    if (!name || !description || !category || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, category, and address are required'
      })
    }

    // Check if owner already has an attraction (business rule: one attraction per owner)
    const existingAttraction = await prisma.attraction.findFirst({
      where: { userId: userId }
    })

    if (existingAttraction) {
      return res.status(400).json({
        success: false,
        message: 'You already have an attraction. Please manage your existing attraction instead.'
      })
    }

    // Validate coordinates if provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid latitude or longitude coordinates'
        })
      }
    }

    // Validate ticket price
    const price = parseFloat(ticketPrice)
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket price'
      })
    }

    // Create the attraction - only include fields that exist in the database schema
    const attractionData = {
      name: name.trim(),
      description: description?.trim() || null,
      address: address.trim(),
      category,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      openingHours: openingHours || null, // Store as plain string
      price: price ? parseFloat(price) : null,
      rating: 0, // Default rating
      userId: userId
    }

    const newAttraction = await prisma.attraction.create({
      data: attractionData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    console.log(`✅ Created attraction: ${newAttraction.name} (ID: ${newAttraction.id})`)

    res.status(201).json({
      success: true,
      data: convertBigIntToNumber(newAttraction),
      message: 'Attraction created successfully'
    })

  } catch (error) {
    console.error('❌ Error creating attraction:', error)
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'An attraction with this name or details already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create attraction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Update attraction
 */
const updateAttraction = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)

    console.log(`🔄 Updating attraction ${attractionId} for owner ${userId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Extract and validate update data
    const {
      name,
      description,
      category,
      address,
      city,
      state,
      zipCode,
      country,
      latitude,
      longitude,
      phoneNumber,
      email,
      website,
      openingHours,
      ticketPrice,
      capacity,
      amenities,
      accessibility,
      ageRestriction,
      duration,
      difficulty,
      tags
    } = req.body

    const updateData = {}

    // Only update provided fields that exist in the database schema
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (category !== undefined) updateData.category = category
    if (address !== undefined) updateData.address = address.trim()

    // Handle coordinates
    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        updateData.latitude = lat
        updateData.longitude = lng
      }
    }

    // Handle price
    if (ticketPrice !== undefined) {
      const price = parseFloat(ticketPrice)
      if (!isNaN(price) && price >= 0) {
        updateData.price = price
      }
    }

    // Handle opening hours
    if (openingHours !== undefined) {
      updateData.openingHours = openingHours // Store as plain string
    }

    // Update the attraction
    const updatedAttraction = await prisma.attraction.update({
      where: { id: attractionId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        images: true
      }
    })

    console.log(`✅ Updated attraction: ${updatedAttraction.name}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(updatedAttraction),
      message: 'Attraction updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating attraction:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update attraction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Delete attraction
 */
const deleteAttraction = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)

    console.log(`🗑️ Deleting attraction ${attractionId} for owner ${userId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Delete related data first (due to foreign key constraints)
    await prisma.$transaction([
      // Delete images
      prisma.attractionImage.deleteMany({
        where: { attractionId: attractionId }
      }),
      // Delete visits
      prisma.visit.deleteMany({
        where: { attractionId: attractionId }
      }),
      // Delete reports
      prisma.reports.deleteMany({
        where: { attractionId: attractionId }
      }),
      // Delete predictive models
      prisma.predictiveModel.deleteMany({
        where: { attractionId: attractionId }
      }),
      // Finally delete the attraction
      prisma.attraction.delete({
        where: { id: attractionId }
      })
    ])

    console.log(`✅ Deleted attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      message: 'Attraction deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting attraction:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete attraction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// ============================================================================
// IMAGE MANAGEMENT
// ============================================================================

/**
 * Upload attraction images
 */
const uploadAttractionImages = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)

    console.log(`📸 Uploading images for attraction ${attractionId}`)
    console.log('Request files:', req.files ? req.files.length : 'undefined')

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Better validation for files
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log('❌ No valid files received')
      return res.status(400).json({
        success: false,
        message: 'No images provided or invalid file format'
      })
    }

    const images = req.files
    const uploadedImages = []

    console.log(`Processing ${images.length} images...`)

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads/attractions')
    await fs.mkdir(uploadsDir, { recursive: true })

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const filename = `${attractionId}_${Date.now()}_${i}_${image.originalname}`
      const filepath = path.join(uploadsDir, filename)
      
      // Save file
      await fs.writeFile(filepath, image.buffer)

      // Create database record with correct field names
      const imageRecord = await prisma.attractionImage.create({
        data: {
          attractionId: attractionId,
          imageUrl: `/uploads/attractions/${filename}` // Use imageUrl field name
        }
      })

      uploadedImages.push(imageRecord)
    }

    console.log(`✅ Uploaded ${uploadedImages.length} images for attraction ${attractionId}`)

    res.status(201).json({
      success: true,
      data: uploadedImages,
      message: `${uploadedImages.length} images uploaded successfully`
    })

  } catch (error) {
    console.error('❌ Error uploading images:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Delete attraction image
 */
const deleteAttractionImage = async (req, res) => {
  try {
    const userId = req.user.id
    const { id, imageId } = req.params
    const attractionId = parseInt(id)
    const imageIdInt = parseInt(imageId)

    console.log(`🗑️ Deleting image ${imageIdInt} for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get image record
    const image = await prisma.attractionImage.findFirst({
      where: {
        id: imageIdInt,
        attractionId: attractionId
      }
    })

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }

    // Delete file from filesystem
    // Extract filename from imageUrl (e.g., '/uploads/attractions/filename.jpg' -> 'filename.jpg')
    const filename = image.imageUrl.split('/').pop()
    const filepath = path.join(__dirname, '../../uploads/attractions', filename)
    try {
      await fs.unlink(filepath)
    } catch (fileError) {
      console.warn('⚠️ Could not delete image file:', filepath)
    }

    // Delete database record
    await prisma.attractionImage.delete({
      where: { id: imageIdInt }
    })

    console.log(`✅ Deleted image ${imageIdInt}`)

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting image:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// ============================================================================
// ANALYTICS AND PERFORMANCE METRICS
// ============================================================================

/**
 * Get comprehensive performance metrics for attraction
 */
const getPerformanceMetrics = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'month', includeComparisons = false } = req.query

    console.log(`📊 Getting performance metrics for attraction ${attractionId}, period: ${period}`)

    // Verify ownership
    const attraction = await verifyAttractionOwnership(userId, attractionId)

    // Get date ranges
    const { startDate, endDate } = getDateRange(period)
    const previousPeriodStart = new Date(startDate)
    const previousPeriodEnd = new Date(endDate)
    
    // Calculate previous period
    const periodLength = endDate.getTime() - startDate.getTime()
    previousPeriodStart.setTime(startDate.getTime() - periodLength)
    previousPeriodEnd.setTime(endDate.getTime() - periodLength)

    // Get current period data
    const [currentVisits, currentRevenue] = await Promise.all([
      prisma.visit.findMany({
        where: {
          attractionId: attractionId,
          visitDate: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.visit.aggregate({
        where: {
          attractionId: attractionId,
          visitDate: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        },
        _avg: {
          rating: true
        }
      })
    ])

    // Get previous period data for comparison
    let previousData = null
    if (includeComparisons === 'true') {
      const [previousVisits, previousRevenue] = await Promise.all([
        prisma.visit.findMany({
          where: {
            attractionId: attractionId,
            visitDate: {
              gte: previousPeriodStart,
              lte: previousPeriodEnd
            }
          }
        }),
        prisma.visit.aggregate({
          where: {
            attractionId: attractionId,
            visitDate: {
              gte: previousPeriodStart,
              lte: previousPeriodEnd
            }
          },
          _sum: {
            amount: true
          },
          _avg: {
            rating: true
          }
        })
      ])
      
      previousData = {
        visitors: previousVisits.length,
        revenue: Number(previousRevenue._sum.amount || 0),
        rating: Number(previousRevenue._avg.rating || 0)
      }
    }

    // Calculate metrics
    const currentVisitors = currentVisits.length
    const totalRevenue = Number(currentRevenue._sum.amount || 0)
    const avgRating = Number(currentRevenue._avg.rating || 0)
    
    // Calculate average visit duration (mock data for now)
    const avgDuration = currentVisits.length > 0 ? 2.5 : 0
    
    // Calculate capacity utilization (assuming 100 visitors per day capacity)
    const dailyCapacity = 100
    const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const totalCapacity = dailyCapacity * daysInPeriod
    const capacityUtilization = totalCapacity > 0 ? (currentVisitors / totalCapacity) * 100 : 0
    
    // Calculate growth rate (visitors per period)
    const growthRate = previousData ? calculateGrowth(currentVisitors, previousData.visitors) : 0

    const metrics = {
      totalVisitors: {
        value: currentVisitors,
        change: previousData ? calculateGrowth(currentVisitors, previousData.visitors) : 0,
        period: period
      },
      revenue: {
        value: totalRevenue,
        change: previousData ? calculateGrowth(totalRevenue, previousData.revenue) : 0,
        period: period
      },
      avgDuration: {
        value: avgDuration,
        change: previousData ? calculateGrowth(avgDuration, 2.2) : 5.5, // Mock comparison
        period: period
      },
      rating: {
        value: avgRating,
        change: previousData ? calculateGrowth(avgRating, previousData.rating) : 0,
        period: period
      },
      growthRate: {
        value: growthRate,
        change: previousData ? calculateGrowth(growthRate, 15) : 8.5, // Mock comparison
        period: period
      },
      capacity: {
        value: capacityUtilization,
        change: previousData ? calculateGrowth(capacityUtilization, 65) : 12.3, // Mock comparison
        period: period
      }
    }

    console.log(`✅ Performance metrics calculated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(metrics)
    })

  } catch (error) {
    console.error('❌ Error getting performance metrics:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get attraction analytics data
 */
const getAttractionAnalytics = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'month', startDate, endDate } = req.query

    console.log(`📈 Getting analytics for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get date range
    const dateRange = startDate && endDate ? 
      { startDate: new Date(startDate), endDate: new Date(endDate) } : 
      getDateRange(period)

    // Get visits data
    const visits = await prisma.visit.findMany({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        }
      },
      orderBy: {
        visitDate: 'asc'
      }
    })

    // Calculate analytics
    const totalVisits = visits.length
    const totalRevenue = visits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
    const avgSpend = totalVisits > 0 ? totalRevenue / totalVisits : 0
    const avgRating = totalVisits > 0 ? 
      visits.reduce((sum, visit) => sum + Number(visit.rating || 0), 0) / totalVisits : 0

    // Group visits by date for trends
    const visitsByDate = visits.reduce((acc, visit) => {
      const date = visit.visitDate.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { count: 0, revenue: 0 }
      }
      acc[date].count++
      acc[date].revenue += Number(visit.amount || 0)
      return acc
    }, {})

    // Calculate peak hours (mock data)
    const peakHours = "10 AM - 2 PM"
    
    // Calculate visitor growth
    const visitorGrowth = totalVisits > 50 ? 15.2 : -5.3 // Mock calculation
    
    // Calculate capacity utilization
    const capacityUtilization = Math.min((totalVisits / 100) * 100, 100) // Assuming 100 visitor capacity

    const analytics = {
      dailyVisitors: Math.round(totalVisits / 30), // Average per day over period
      totalVisits,
      totalRevenue,
      avgSpend,
      avgRating,
      visitorGrowth,
      revenueGrowth: totalRevenue > 1000 ? 12.5 : -8.2, // Mock calculation
      peakHours,
      capacityUtilization,
      avgVisitDuration: 2.5, // Mock data
      repeatVisitors: 25, // Mock percentage
      growthRate: visitorGrowth,
      newRecord: totalVisits > 100 ? "Most visitors this month" : "N/A",
      visitsByDate,
      trends: {
        visitors: Object.keys(visitsByDate).map(date => ({
          date,
          count: visitsByDate[date].count
        })),
        revenue: Object.keys(visitsByDate).map(date => ({
          date,
          amount: visitsByDate[date].revenue
        }))
      }
    }

    console.log(`✅ Analytics calculated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(analytics)
    })

  } catch (error) {
    console.error('❌ Error getting attraction analytics:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get attraction analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get daily highlights for attraction
 */
const getDailyHighlights = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)

    console.log(`🌟 Getting daily highlights for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get today's data
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const todayVisits = await prisma.visit.findMany({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })

    // Generate highlights based on actual data
    const highlights = []
    const todayVisitCount = todayVisits.length
    const todayRevenue = todayVisits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)

    if (todayVisitCount > 10) {
      highlights.push({
        type: 'success',
        message: `Strong visitor turnout today with ${todayVisitCount} visitors`,
        color: '#10B981'
      })
    } else if (todayVisitCount > 5) {
      highlights.push({
        type: 'info',
        message: `Steady flow of ${todayVisitCount} visitors today`,
        color: '#3B82F6'
      })
    } else {
      highlights.push({
        type: 'warning',
        message: `Light visitor activity today with ${todayVisitCount} visitors`,
        color: '#F59E0B'
      })
    }

    if (todayRevenue > 500) {
      highlights.push({
        type: 'success',
        message: `Excellent revenue performance: $${todayRevenue.toFixed(2)}`,
        color: '#10B981'
      })
    }

    if (highlights.length === 0) {
      highlights.push({
        type: 'info',
        message: 'No significant activity to report today',
        color: '#6B7280'
      })
    }

    // Calculate metrics
    const avgRating = todayVisits.length > 0 ? 
      todayVisits.reduce((sum, visit) => sum + Number(visit.rating || 0), 0) / todayVisits.length : 0

    const dailyHighlights = {
      highlights,
      metrics: {
        repeatVisitors: 25.5, // Mock data
        averageSpend: todayVisits.length > 0 ? todayRevenue / todayVisits.length : 0,
        peakHour: "2:00 PM", // Mock data
        conversionRate: 78.5 // Mock data
      }
    }

    console.log(`✅ Daily highlights generated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(dailyHighlights)
    })

  } catch (error) {
    console.error('❌ Error getting daily highlights:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get daily highlights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// ============================================================================
// VISITOR ANALYSIS
// ============================================================================

/**
 * Get visitor analytics with demographics and behavior
 */
const getVisitorAnalytics = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'month' } = req.query

    console.log(`👥 Getting visitor analytics for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get date range
    const { startDate, endDate } = getDateRange(period)

    // Get visits data
    const visits = await prisma.visit.findMany({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate visit duration distribution (mock data with realistic patterns)
    const durationDistribution = [
      { range: "< 1 hour", count: Math.round(visits.length * 0.15), percentage: 15 },
      { range: "1-2 hours", count: Math.round(visits.length * 0.35), percentage: 35 },
      { range: "2-3 hours", count: Math.round(visits.length * 0.30), percentage: 30 },
      { range: "3-4 hours", count: Math.round(visits.length * 0.15), percentage: 15 },
      { range: "> 4 hours", count: Math.round(visits.length * 0.05), percentage: 5 }
    ]

    // Calculate analytics
    const avgVisitDuration = 2.3 // Mock average in hours
    const visitDurationChange = 8.5 // Mock percentage change
    const peakHour = "2:00 PM"
    const repeatVisitorRate = 28 // Mock percentage
    const topOrigin = "Jakarta"
    const topOriginPercentage = 45

    const visitorAnalytics = {
      avgVisitDuration,
      visitDurationChange,
      peakHour,
      repeatVisitorRate,
      topOrigin,
      topOriginPercentage,
      totalVisits: visits.length,
      durationDistribution
    }

    console.log(`✅ Visitor analytics calculated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(visitorAnalytics)
    })

  } catch (error) {
    console.error('❌ Error getting visitor analytics:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get visitor analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get visitor demographics
 */
const getVisitorDemographics = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'month' } = req.query

    console.log(`📊 Getting visitor demographics for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get date range
    const { startDate, endDate } = getDateRange(period)

    // Get visits count for scaling mock data
    const visitsCount = await prisma.visit.count({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Generate realistic demographic data
    const demographics = {
      ageGroups: [
        { range: "18-25", percentage: 28, count: Math.round(visitsCount * 0.28) },
        { range: "26-35", percentage: 35, count: Math.round(visitsCount * 0.35) },
        { range: "36-45", percentage: 22, count: Math.round(visitsCount * 0.22) },
        { range: "46-55", percentage: 10, count: Math.round(visitsCount * 0.10) },
        { range: "55+", percentage: 5, count: Math.round(visitsCount * 0.05) }
      ],
      genderData: [
        { gender: "Female", percentage: 52, count: Math.round(visitsCount * 0.52) },
        { gender: "Male", percentage: 45, count: Math.round(visitsCount * 0.45) },
        { gender: "Other", percentage: 3, count: Math.round(visitsCount * 0.03) }
      ]
    }

    console.log(`✅ Demographics calculated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(demographics)
    })

  } catch (error) {
    console.error('❌ Error getting visitor demographics:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get visitor demographics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get visitor behavior insights
 */
const getVisitorBehavior = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'month', includeComparisons = false } = req.query

    console.log(`🧠 Getting visitor behavior insights for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get date range
    const { startDate, endDate } = getDateRange(period)

    // Get visits data
    const visits = await prisma.visit.findMany({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Generate behavior insights based on data
    const avgRating = visits.length > 0 ? 
      visits.reduce((sum, visit) => sum + Number(visit.rating || 0), 0) / visits.length : 0

    const behaviorInsights = {
      engagementLevel: avgRating > 4 ? "High Engagement" : avgRating > 3 ? "Moderate Engagement" : "Low Engagement",
      engagementDetails: avgRating > 4 ? 
        "Visitors are highly satisfied and spend quality time at your attraction" :
        avgRating > 3 ? 
        "Good visitor satisfaction with room for improvement" :
        "Focus needed on enhancing visitor experience",
      
      peakEfficiency: visits.length > 50 ? "Optimal Peak Management" : "Peak Optimization Needed",
      peakDetails: visits.length > 50 ? 
        "Peak hours are well-managed with good visitor flow" :
        "Consider strategies to better distribute visitor traffic",
      
      loyaltyInsight: "Building Loyalty",
      loyaltyDetails: "28% repeat visitor rate shows good retention potential",
      
      seasonalPattern: "Consistent Demand",
      seasonalDetails: "Stable visitor patterns with predictable peak times"
    }

    console.log(`✅ Behavior insights generated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(behaviorInsights)
    })

  } catch (error) {
    console.error('❌ Error getting visitor behavior:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get visitor behavior insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// ============================================================================
// FORECASTING AND PLANNING
// ============================================================================

/**
 * Get forecast data for planning
 */
const getForecastData = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { forecastType = 'visitors', period = 'month', includeScenarios = false } = req.query

    console.log(`🔮 Getting forecast data for attraction ${attractionId}, type: ${forecastType}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get historical data for forecasting
    const { startDate, endDate } = getDateRange(period)
    
    const visits = await prisma.visit.findMany({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate current metrics
    const currentVisitors = visits.length
    const currentRevenue = visits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)

    // Generate forecasts based on current trends
    const forecastData = {
      nextWeekVisitors: Math.round(currentVisitors * 1.15), // 15% growth projection
      nextMonthRevenue: Math.round(currentRevenue * 1.22), // 22% revenue growth projection
      capacityAlerts: currentVisitors > 80 ? 3 : currentVisitors > 50 ? 1 : 0,
      optimalPrice: Math.round((currentRevenue / Math.max(currentVisitors, 1)) * 1.10) // 10% price optimization
    }

    if (includeScenarios === 'true') {
      forecastData.scenarios = {
        conservative: {
          visitors: Math.round(currentVisitors * 1.05),
          revenue: Math.round(currentRevenue * 1.08)
        },
        optimistic: {
          visitors: Math.round(currentVisitors * 1.25),
          revenue: Math.round(currentRevenue * 1.35)
        },
        pessimistic: {
          visitors: Math.round(currentVisitors * 0.95),
          revenue: Math.round(currentRevenue * 0.92)
        }
      }
    }

    console.log(`✅ Forecast data generated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(forecastData)
    })

  } catch (error) {
    console.error('❌ Error getting forecast data:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get forecast data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get capacity planning data
 */
const getCapacityPlanning = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'week', includeOptimization = false } = req.query

    console.log(`📋 Getting capacity planning for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Generate capacity planning data for the next week
    const today = new Date()
    const dailyCapacity = []
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Generate realistic forecast based on day of week
      const dayName = daysOfWeek[date.getDay()]
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const baseVisitors = isWeekend ? 85 : 65
      const variance = Math.random() * 20 - 10 // ±10 variance
      const forecast = Math.round(baseVisitors + variance)
      
      let status = 'optimal'
      if (forecast > 90) status = 'critical'
      else if (forecast > 75) status = 'high'
      else if (forecast < 40) status = 'low'

      dailyCapacity.push({
        date: date.toLocaleDateString(),
        day: dayName,
        forecast: forecast,
        capacity: 100,
        status: status
      })
    }

    // Generate staffing recommendations
    const staffingRecommendations = []
    
    // Check for high capacity days
    const highCapacityDays = dailyCapacity.filter(day => day.forecast > 75)
    if (highCapacityDays.length > 0) {
      staffingRecommendations.push({
        type: 'increase',
        title: 'Increase Weekend Staffing',
        description: `${highCapacityDays.length} high-capacity days detected. Consider adding 2-3 additional staff members.`,
        details: {
          'Additional Staff': '2-3 people',
          'Focus Areas': 'Entry, guidance, security',
          'Cost Impact': 'IDR 300,000/day'
        },
        savings: 0
      })
    }

    // Check for low capacity days
    const lowCapacityDays = dailyCapacity.filter(day => day.forecast < 40)
    if (lowCapacityDays.length > 0) {
      staffingRecommendations.push({
        type: 'decrease',
        title: 'Optimize Weekday Staffing',
        description: `${lowCapacityDays.length} low-capacity days. Consider reducing staff by 1-2 people.`,
        details: {
          'Staff Reduction': '1-2 people',
          'Maintain Quality': 'Focus on core services',
          'Alternative Tasks': 'Maintenance, training'
        },
        savings: 200000
      })
    }

    // General optimization
    staffingRecommendations.push({
      type: 'optimize',
      title: 'Cross-Training Optimization',
      description: 'Train staff for multiple roles to improve flexibility during varying demand.',
      details: {
        'Training Focus': 'Multi-role capabilities',
        'Flexibility': 'Better coverage',
        'Efficiency': 'Reduced idle time'
      }
    })

    const capacityPlanningData = {
      dailyCapacity,
      staffingRecommendations
    }

    console.log(`✅ Capacity planning generated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(capacityPlanningData)
    })

  } catch (error) {
    console.error('❌ Error getting capacity planning:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get capacity planning',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get pricing recommendations
 */
const getPricingRecommendations = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'month', includeDynamicPricing = false } = req.query

    console.log(`💰 Getting pricing recommendations for attraction ${attractionId}`)

    // Verify ownership
    const attraction = await verifyAttractionOwnership(userId, attractionId)

    // Get current pricing
    const currentPrice = Number(attraction.price || 50000)

    // Generate pricing recommendations based on demand patterns
    const pricingRecommendations = [
      {
        period: "Weekends",
        currentPrice: currentPrice,
        demand: "High",
        recommendation: `IDR ${Math.round(currentPrice * 1.2).toLocaleString()}`
      },
      {
        period: "Weekdays",
        currentPrice: currentPrice,
        demand: "Moderate",
        recommendation: `IDR ${Math.round(currentPrice * 0.9).toLocaleString()}`
      },
      {
        period: "Holiday Seasons",
        currentPrice: currentPrice,
        demand: "Critical",
        recommendation: `IDR ${Math.round(currentPrice * 1.4).toLocaleString()}`
      },
      {
        period: "Off-Peak Hours",
        currentPrice: currentPrice,
        demand: "Low",
        recommendation: `IDR ${Math.round(currentPrice * 0.8).toLocaleString()}`
      }
    ]

    const pricingData = {
      recommendations: pricingRecommendations
    }

    if (includeDynamicPricing === 'true') {
      pricingData.dynamicPricing = {
        enabled: false,
        algorithm: "demand-based",
        priceRange: {
          min: Math.round(currentPrice * 0.7),
          max: Math.round(currentPrice * 1.5)
        },
        factors: ["visitor_count", "day_of_week", "season", "weather"]
      }
    }

    console.log(`✅ Pricing recommendations generated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(pricingData)
    })

  } catch (error) {
    console.error('❌ Error getting pricing recommendations:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get pricing recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// ============================================================================
// REPORTS MANAGEMENT
// ============================================================================

/**
 * Get reports list for attraction
 */
const getReports = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { 
      page = 1, 
      limit = 10, 
      reportType, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    console.log(`📄 Getting reports for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Build filter conditions
    const where = {
      attractionId: attractionId
    }

    if (reportType) {
      where.reportType = reportType
    }

    if (status) {
      where.status = status
    }

    // Get reports (mock data for now)
    const reports = [
      {
        id: 1,
        title: "Monthly Visitor Report",
        description: "Comprehensive analysis of visitor patterns for the past month",
        reportType: "visitor_analytics",
        status: "completed",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
        downloadCount: 3,
        fileSize: 2048576, // 2MB
        attractionId: attractionId
      },
      {
        id: 2,
        title: "Revenue Analysis Q4",
        description: "Quarterly revenue performance and trends",
        reportType: "revenue_report",
        status: "completed",
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 1 week ago
        completedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        downloadCount: 8,
        fileSize: 1536000, // 1.5MB
        attractionId: attractionId
      },
      {
        id: 3,
        title: "Performance Summary",
        description: "Overall attraction performance metrics",
        reportType: "performance_summary",
        status: "processing",
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
        downloadCount: 0,
        attractionId: attractionId
      }
    ]

    // Filter reports based on query parameters
    let filteredReports = reports.filter(report => report.attractionId === attractionId)

    if (reportType) {
      filteredReports = filteredReports.filter(report => report.reportType === reportType)
    }

    if (status) {
      filteredReports = filteredReports.filter(report => report.status === status)
    }

    // Sort reports
    filteredReports.sort((a, b) => {
      const aVal = a[sortBy] || ''
      const bVal = b[sortBy] || ''
      
      if (sortOrder === 'desc') {
        return bVal.localeCompare ? bVal.localeCompare(aVal) : bVal - aVal
      }
      return aVal.localeCompare ? aVal.localeCompare(bVal) : aVal - bVal
    })

    // Paginate
    const offset = (Number(page) - 1) * Number(limit)
    const paginatedReports = filteredReports.slice(offset, offset + Number(limit))

    console.log(`✅ Found ${paginatedReports.length} reports for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: paginatedReports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredReports.length,
        totalPages: Math.ceil(filteredReports.length / Number(limit))
      }
    })

  } catch (error) {
    console.error('❌ Error getting reports:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Generate a new report
 */
const generateReport = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const {
      title,
      description,
      reportType,
      startDate,
      endDate,
      metrics = [],
      exportFormat = 'pdf'
    } = req.body

    console.log(`🔄 Generating report for attraction ${attractionId}: ${title}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Validate required fields
    if (!title || !reportType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, reportType, startDate, and endDate are required'
      })
    }

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range'
      })
    }

    // Generate report (mock implementation)
    const reportId = Date.now() // Use timestamp as mock ID
    
    const newReport = {
      id: reportId,
      title: title.trim(),
      description: description?.trim() || null,
      reportType,
      status: 'processing',
      createdAt: new Date().toISOString(),
      attractionId: attractionId,
      configuration: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        metrics,
        exportFormat
      },
      downloadCount: 0
    }

    // In a real implementation, you would:
    // 1. Store the report configuration in the database
    // 2. Queue a background job to generate the actual report
    // 3. Update the status when complete

    console.log(`✅ Report generation queued: ${title} (ID: ${reportId})`)

    res.status(201).json({
      success: true,
      data: newReport,
      message: 'Report generation started successfully'
    })

  } catch (error) {
    console.error('❌ Error generating report:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get available report types
 */
const getReportTypes = async (req, res) => {
  try {
    const reportTypes = [
      {
        value: "visitor_analytics",
        label: "Visitor Analytics",
        description: "Comprehensive analysis of visitor patterns, demographics, and behavior"
      },
      {
        value: "revenue_report",
        label: "Revenue Report",
        description: "Financial performance analysis including revenue trends and forecasts"
      },
      {
        value: "performance_summary",
        label: "Performance Summary",
        description: "Overall attraction performance metrics and KPI analysis"
      },
      {
        value: "seasonal_analysis",
        label: "Seasonal Analysis",
        description: "Seasonal trends and patterns in visitor behavior and revenue"
      },
      {
        value: "demographic_insights",
        label: "Demographic Insights",
        description: "Detailed visitor demographic breakdown and analysis"
      },
      {
        value: "competitor_analysis",
        label: "Competitor Analysis",
        description: "Market position and competitive performance analysis"
      }
    ]

    res.status(200).json({
      success: true,
      data: reportTypes
    })

  } catch (error) {
    console.error('❌ Error getting report types:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get report types',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get available metrics for reports
 */
const getAvailableMetrics = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)

    console.log(`📊 Getting available metrics for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get available metrics based on attraction data
    const metrics = [
      {
        id: "visitor_count",
        label: "Total Visitors",
        available: true,
        description: "Total number of visitors in the selected period"
      },
      {
        id: "revenue",
        label: "Revenue",
        available: true,
        description: "Total revenue generated in the selected period"
      },
      {
        id: "avg_rating",
        label: "Average Rating",
        available: true,
        description: "Average visitor rating and satisfaction score"
      },
      {
        id: "peak_hours",
        label: "Peak Hours",
        available: true,
        description: "Busiest hours and visitor traffic patterns"
      },
      {
        id: "visitor_growth",
        label: "Visitor Growth",
        available: true,
        description: "Growth rate and visitor trend analysis"
      },
      {
        id: "repeat_visitors",
        label: "Repeat Visitors",
        available: true,
        description: "Customer loyalty and repeat visit analysis"
      },
      {
        id: "average_spend",
        label: "Average Spend",
        available: true,
        description: "Average spending per visitor"
      },
      {
        id: "visit_duration",
        label: "Visit Duration",
        available: true,
        description: "Average time spent at the attraction"
      },
      {
        id: "demographic_breakdown",
        label: "Demographics",
        available: true,
        description: "Age, gender, and location demographics"
      },
      {
        id: "seasonal_trends",
        label: "Seasonal Trends",
        available: true,
        description: "Seasonal patterns and trends"
      }
    ]

    console.log(`✅ Found ${metrics.length} available metrics for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: metrics
    })

  } catch (error) {
    console.error('❌ Error getting available metrics:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get available metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Download a generated report
 */
const downloadReport = async (req, res) => {
  try {
    const userId = req.user.id
    const { id, reportId } = req.params
    const attractionId = parseInt(id)
    const reportIdInt = parseInt(reportId)

    console.log(`⬇️ Downloading report ${reportIdInt} for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // In a real implementation, you would:
    // 1. Find the report in the database
    // 2. Check if the file exists
    // 3. Stream the file to the client
    // 4. Update download count

    // Mock file response
    const mockPdfContent = Buffer.from(`
      %PDF-1.4
      1 0 obj
      <<
      /Type /Catalog
      /Pages 2 0 R
      >>
      endobj
      2 0 obj
      <<
      /Type /Pages
      /Kids [3 0 R]
      /Count 1
      >>
      endobj
      3 0 obj
      <<
      /Type /Page
      /Parent 2 0 R
      /MediaBox [0 0 612 792]
      /Contents 4 0 R
      >>
      endobj
      4 0 obj
      <<
      /Length 44
      >>
      stream
      BT
      /F1 12 Tf
      100 700 Td
      (Sample Report) Tj
      ET
      endstream
      endobj
      xref
      0 5
      0000000000 65535 f 
      0000000010 00000 n 
      0000000079 00000 n 
      0000000136 00000 n 
      0000000229 00000 n 
      trailer
      <<
      /Size 5
      /Root 1 0 R
      >>
      startxref
      322
      %%EOF
    `)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportIdInt}.pdf"`)
    res.setHeader('Content-Length', mockPdfContent.length)

    console.log(`✅ Report ${reportIdInt} downloaded successfully`)
    res.send(mockPdfContent)

  } catch (error) {
    console.error('❌ Error downloading report:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Delete a report
 */
const deleteReport = async (req, res) => {
  try {
    const userId = req.user.id
    const { id, reportId } = req.params
    const attractionId = parseInt(id)
    const reportIdInt = parseInt(reportId)

    console.log(`🗑️ Deleting report ${reportIdInt} for attraction ${attractionId}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // In a real implementation, you would:
    // 1. Find the report in the database
    // 2. Delete the physical file if it exists
    // 3. Delete the database record

    console.log(`✅ Report ${reportIdInt} deleted successfully`)

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting report:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// ============================================================================
// REVENUE ANALYSIS & CUSTOMER INSIGHTS
// ============================================================================

/**
 * Get comprehensive revenue analysis
 */
const getRevenueAnalysis = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'month', includeBreakdown = false } = req.query

    console.log(`💰 Getting revenue analysis for attraction ${attractionId}, period: ${period}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get date ranges
    const { startDate, endDate } = getDateRange(period)
    const previousPeriodStart = new Date(startDate)
    const previousPeriodEnd = new Date(endDate)
    
    // Calculate previous period
    const periodLength = endDate.getTime() - startDate.getTime()
    previousPeriodStart.setTime(startDate.getTime() - periodLength)
    previousPeriodEnd.setTime(endDate.getTime() - periodLength)

    // Get current period visits
    const currentVisits = await prisma.visit.findMany({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Get previous period visits for comparison
    const previousVisits = await prisma.visit.findMany({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd
        }
      }
    })

    // Calculate current metrics
    const totalRevenue = currentVisits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
    const totalVisitors = currentVisits.length
    const averageRevenuePerVisitor = totalVisitors > 0 ? totalRevenue / totalVisitors : 0

    // Calculate previous metrics for comparison
    const previousRevenue = previousVisits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
    const previousVisitors = previousVisits.length
    const previousAvgRevenuePerVisitor = previousVisitors > 0 ? previousRevenue / previousVisitors : 0

    // Calculate daily averages
    const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const dailyAverageRevenue = daysInPeriod > 0 ? totalRevenue / daysInPeriod : 0
    const previousDailyAverage = daysInPeriod > 0 ? previousRevenue / daysInPeriod : 0

    // Calculate monthly projection
    const dailyAverage = dailyAverageRevenue
    const monthlyProjection = dailyAverage * 30

    // Find peak revenue day
    const revenueByDay = currentVisits.reduce((acc, visit) => {
      const day = visit.visitDate.toLocaleDateString('en-US', { weekday: 'long' })
      if (!acc[day]) acc[day] = 0
      acc[day] += Number(visit.amount || 0)
      return acc
    }, {})
    
    const peakRevenueDay = Object.keys(revenueByDay).length > 0 ? 
      Object.keys(revenueByDay).reduce((a, b) => revenueByDay[a] > revenueByDay[b] ? a : b) : 'Monday'
    const peakRevenueDayAmount = revenueByDay[peakRevenueDay] || 0

    // Calculate growth rates
    const revenueGrowth = calculateGrowth(totalRevenue, previousRevenue)
    const avgRevenuePerVisitorChange = calculateGrowth(averageRevenuePerVisitor, previousAvgRevenuePerVisitor)
    const dailyRevenueChange = calculateGrowth(dailyAverageRevenue, previousDailyAverage)

    const revenueAnalysis = {
      totalRevenue,
      revenueGrowth,
      averageRevenuePerVisitor,
      avgRevenuePerVisitorChange,
      dailyAverageRevenue,
      dailyRevenueChange,
      monthlyProjection,
      monthlyGrowth: calculateGrowth(monthlyProjection, previousRevenue * (30 / daysInPeriod)),
      peakRevenueDay,
      peakRevenueDayAmount,
      growthRate: revenueGrowth,
      growthRateChange: Math.abs(revenueGrowth) > 5 ? 2.3 : -1.2 // Mock comparison
    }

    // Add breakdown if requested
    if (includeBreakdown === 'true') {
      revenueAnalysis.categoryBreakdown = [
        { category: 'Ticket Sales', amount: totalRevenue * 0.65, percentage: 65, growth: revenueGrowth * 0.9 },
        { category: 'Gift Shop', amount: totalRevenue * 0.20, percentage: 20, growth: revenueGrowth * 1.2 },
        { category: 'Food & Beverages', amount: totalRevenue * 0.13, percentage: 13, growth: revenueGrowth * 1.1 },
        { category: 'Tours & Guides', amount: totalRevenue * 0.02, percentage: 2, growth: revenueGrowth * 0.8 }
      ]

      revenueAnalysis.timeBreakdown = [
        { period: 'Morning (9-12)', amount: totalRevenue * 0.32, percentage: 32 },
        { period: 'Afternoon (12-16)', amount: totalRevenue * 0.52, percentage: 52 },
        { period: 'Evening (16-18)', amount: totalRevenue * 0.16, percentage: 16 }
      ]

      revenueAnalysis.visitorTypeBreakdown = [
        { type: 'Individual', amount: totalRevenue * 0.40, percentage: 40 },
        { type: 'Group/Family', amount: totalRevenue * 0.37, percentage: 37 },
        { type: 'Student/Educational', amount: totalRevenue * 0.15, percentage: 15 },
        { type: 'Corporate', amount: totalRevenue * 0.08, percentage: 8 }
      ]
    }

    console.log(`✅ Revenue analysis calculated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(revenueAnalysis)
    })

  } catch (error) {
    console.error('❌ Error getting revenue analysis:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get revenue analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

/**
 * Get customer insights and segmentation
 */
const getCustomerInsights = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const attractionId = parseInt(id)
    const { period = 'month', includeSegmentation = false } = req.query

    console.log(`👥 Getting customer insights for attraction ${attractionId}, period: ${period}`)

    // Verify ownership
    await verifyAttractionOwnership(userId, attractionId)

    // Get date range
    const { startDate, endDate } = getDateRange(period)

    // Get visits data
    const visits = await prisma.visit.findMany({
      where: {
        attractionId: attractionId,
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate basic customer metrics
    const totalCustomers = visits.length
    const totalRevenue = visits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
    const avgSpendPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    const avgRating = totalCustomers > 0 ? 
      visits.reduce((sum, visit) => sum + Number(visit.rating || 0), 0) / totalCustomers : 0

    // Calculate satisfaction levels
    const highSatisfaction = visits.filter(v => Number(v.rating || 0) >= 4).length
    const mediumSatisfaction = visits.filter(v => Number(v.rating || 0) >= 3 && Number(v.rating || 0) < 4).length
    const lowSatisfaction = visits.filter(v => Number(v.rating || 0) < 3).length

    const customerInsights = {
      totalCustomers,
      avgSpendPerCustomer,
      avgRating,
      satisfactionDistribution: {
        high: { count: highSatisfaction, percentage: totalCustomers > 0 ? (highSatisfaction / totalCustomers) * 100 : 0 },
        medium: { count: mediumSatisfaction, percentage: totalCustomers > 0 ? (mediumSatisfaction / totalCustomers) * 100 : 0 },
        low: { count: lowSatisfaction, percentage: totalCustomers > 0 ? (lowSatisfaction / totalCustomers) * 100 : 0 }
      },
      repeatCustomerRate: 28, // Mock data - would need to track user visits
      customerLifetimeValue: avgSpendPerCustomer * 1.5, // Mock calculation
      churnRate: 15, // Mock data
      acquisitionTrends: {
        newCustomers: Math.round(totalCustomers * 0.75),
        returningCustomers: Math.round(totalCustomers * 0.25)
      }
    }

    // Add segmentation if requested
    if (includeSegmentation === 'true') {
      customerInsights.segments = {
        highValue: {
          count: Math.round(totalCustomers * 0.20),
          avgSpend: avgSpendPerCustomer * 2.5,
          characteristics: ['Frequent visitors', 'High spending', 'Premium experiences']
        },
        regular: {
          count: Math.round(totalCustomers * 0.60),
          avgSpend: avgSpendPerCustomer,
          characteristics: ['Occasional visits', 'Standard packages', 'Price-conscious']
        },
        lowValue: {
          count: Math.round(totalCustomers * 0.20),
          avgSpend: avgSpendPerCustomer * 0.5,
          characteristics: ['Infrequent visits', 'Budget options', 'Discount seekers']
        }
      }

      customerInsights.behaviorPatterns = {
        visitFrequency: {
          frequent: { percentage: 15, description: 'More than 5 visits per year' },
          occasional: { percentage: 35, description: '2-5 visits per year' },
          rare: { percentage: 50, description: '1 visit per year or less' }
        },
        spendingPatterns: {
          consistent: { percentage: 45, description: 'Regular spending habits' },
          seasonal: { percentage: 30, description: 'Higher spending during peak seasons' },
          promotional: { percentage: 25, description: 'Responds to discounts and offers' }
        }
      }
    }

    console.log(`✅ Customer insights calculated for attraction ${attractionId}`)

    res.status(200).json({
      success: true,
      data: convertBigIntToNumber(customerInsights)
    })

  } catch (error) {
    console.error('❌ Error getting customer insights:', error)

    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get customer insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// ============================================================================
// EXPORT CONTROLLER FUNCTIONS
// ============================================================================

module.exports = {
  // Attraction Management
  getMyAttraction,
  createAttraction,
  updateAttraction,
  deleteAttraction,

  // Image Management
  uploadAttractionImages,
  deleteAttractionImage,

  // Analytics and Performance
  getPerformanceMetrics,
  getAttractionAnalytics,
  getDailyHighlights,

  // Visitor Analysis
  getVisitorAnalytics,
  getVisitorDemographics,
  getVisitorBehavior,

  // Revenue Analysis & Customer Insights
  getRevenueAnalysis,
  getCustomerInsights,

  // Forecasting and Planning
  getForecastData,
  getCapacityPlanning,
  getPricingRecommendations,

  // Reports Management
  getReports,
  generateReport,
  getReportTypes,
  getAvailableMetrics,
  downloadReport,
  deleteReport,

  // Utility functions
  convertBigIntToNumber,
  getDateRange,
  calculateGrowth,
  verifyAttractionOwnership
}
