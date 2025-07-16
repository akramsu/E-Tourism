const { prisma } = require('../config/database')

/**
 * Tourist Controller - Handles all tourist-related API endpoints
 * Includes attractions, reviews, favorites, bookings, and user preferences
 */

// ===============================
// ATTRACTION ENDPOINTS
// ===============================

// Get all attractions with filtering
const getAttractions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdDate',
      sortOrder = 'desc'
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    // Build where clause
    const where = {}
    
    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }
    
    if (minRating) {
      where.rating = { gte: parseFloat(minRating) }
    }

    // Build orderBy clause
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const [attractions, total] = await Promise.all([
      prisma.attraction.findMany({
        where,
        include: {
          images: true,
          user: {
            select: { id: true, username: true }
          },
          _count: {
            select: { visits: true }
          }
        },
        orderBy,
        skip: offset,
        take: limitNum
      }),
      prisma.attraction.count({ where })
    ])

    // Transform data to include visit count and formatted price
    const transformedAttractions = attractions.map(attraction => ({
      ...attraction,
      totalVisits: attraction._count.visits,
      price: attraction.price ? parseFloat(attraction.price) : 0,
      images: attraction.images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl
      }))
    }))

    res.status(200).json({
      success: true,
      data: transformedAttractions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get attractions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attractions',
      error: error.message
    })
  }
}

// Get attraction by ID
const getAttraction = async (req, res) => {
  try {
    const { id } = req.params

    const attraction = await prisma.attraction.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: true,
        user: {
          select: { id: true, username: true, email: true }
        },
        visits: {
          include: {
            visitor: {
              select: { id: true, username: true }
            }
          },
          orderBy: { visitDate: 'desc' },
          take: 10 // Latest 10 reviews
        },
        _count: {
          select: { visits: true }
        }
      }
    })

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found'
      })
    }

    // Transform data
    const transformedAttraction = {
      ...attraction,
      price: attraction.price ? parseFloat(attraction.price) : 0,
      totalVisits: attraction._count.visits,
      images: attraction.images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl
      })),
      reviews: attraction.visits.filter(visit => visit.visitorFeedback).map(visit => ({
        id: visit.id,
        rating: visit.rating,
        feedback: visit.visitorFeedback,
        visitDate: visit.visitDate,
        visitor: visit.visitor
      }))
    }

    res.status(200).json({
      success: true,
      data: transformedAttraction
    })
  } catch (error) {
    console.error('Get attraction error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attraction',
      error: error.message
    })
  }
}

// Get featured attractions
const getFeaturedAttractions = async (req, res) => {
  try {
    const { limit = 6 } = req.query

    const attractions = await prisma.attraction.findMany({
      include: {
        images: {
          take: 1 // Only first image for featured display
        },
        _count: {
          select: { visits: true }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { createdDate: 'desc' }
      ],
      take: parseInt(limit)
    })

    const transformedAttractions = attractions.map(attraction => ({
      ...attraction,
      price: attraction.price ? parseFloat(attraction.price) : 0,
      totalVisits: attraction._count.visits,
      image: attraction.images[0]?.imageUrl || null
    }))

    res.status(200).json({
      success: true,
      data: transformedAttractions
    })
  } catch (error) {
    console.error('Get featured attractions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured attractions',
      error: error.message
    })
  }
}

// Get trending attractions
const getTrendingAttractions = async (req, res) => {
  try {
    const { limit = 10 } = req.query

    // Get attractions with recent visits (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const attractions = await prisma.attraction.findMany({
      include: {
        images: {
          take: 1
        },
        visits: {
          where: {
            visitDate: {
              gte: thirtyDaysAgo
            }
          }
        }
      },
      orderBy: {
        visits: {
          _count: 'desc'
        }
      },
      take: parseInt(limit)
    })

    const transformedAttractions = attractions.map(attraction => ({
      ...attraction,
      price: attraction.price ? parseFloat(attraction.price) : 0,
      recentVisits: attraction.visits.length,
      image: attraction.images[0]?.imageUrl || null,
      trendScore: attraction.visits.length * (attraction.rating || 1)
    }))

    res.status(200).json({
      success: true,
      data: transformedAttractions
    })
  } catch (error) {
    console.error('Get trending attractions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending attractions',
      error: error.message
    })
  }
}

// Get attractions by category
const getAttractionsByCategory = async (req, res) => {
  try {
    const { category } = req.params
    const { page = 1, limit = 10 } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    const [attractions, total] = await Promise.all([
      prisma.attraction.findMany({
        where: {
          category: { contains: category, mode: 'insensitive' }
        },
        include: {
          images: true,
          _count: {
            select: { visits: true }
          }
        },
        orderBy: { rating: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.attraction.count({
        where: {
          category: { contains: category, mode: 'insensitive' }
        }
      })
    ])

    const transformedAttractions = attractions.map(attraction => ({
      ...attraction,
      price: attraction.price ? parseFloat(attraction.price) : 0,
      totalVisits: attraction._count.visits,
      image: attraction.images[0]?.imageUrl || null
    }))

    res.status(200).json({
      success: true,
      data: transformedAttractions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get attractions by category error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attractions by category',
      error: error.message
    })
  }
}

// Advanced search attractions
const searchAttractions = async (req, res) => {
  try {
    const {
      query,
      categories,
      minPrice,
      maxPrice,
      minRating,
      location,
      latitude,
      longitude,
      radius = 50, // km
      openNow,
      hasParking,
      wheelchairAccessible,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    // Build complex where clause
    const where = {}
    
    // Text search
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    // Category filter
    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : [categories]
      where.category = { in: categoryArray }
    }
    
    // Price range
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }
    
    // Rating filter
    if (minRating) {
      where.rating = { gte: parseFloat(minRating) }
    }
    
    // Location filter
    if (location) {
      where.address = { contains: location, mode: 'insensitive' }
    }

    // TODO: Implement geographic distance filtering if latitude/longitude provided
    // This would require spatial queries or manual distance calculation

    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const [attractions, total] = await Promise.all([
      prisma.attraction.findMany({
        where,
        include: {
          images: true,
          _count: {
            select: { visits: true }
          }
        },
        orderBy,
        skip: offset,
        take: limitNum
      }),
      prisma.attraction.count({ where })
    ])

    const transformedAttractions = attractions.map(attraction => ({
      ...attraction,
      price: attraction.price ? parseFloat(attraction.price) : 0,
      totalVisits: attraction._count.visits,
      image: attraction.images[0]?.imageUrl || null
    }))

    res.status(200).json({
      success: true,
      data: transformedAttractions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Search attractions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to search attractions',
      error: error.message
    })
  }
}

// Get nearby attractions (requires latitude/longitude)
const getNearbyAttractions = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50, limit = 10 } = req.query

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      })
    }

    // For simplicity, we'll get all attractions and filter manually
    // In production, you'd want to use spatial queries
    const attractions = await prisma.attraction.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        images: {
          take: 1
        },
        _count: {
          select: { visits: true }
        }
      }
    })

    // Calculate distances and filter
    const lat1 = parseFloat(latitude)
    const lon1 = parseFloat(longitude)
    const maxRadius = parseFloat(radius)

    const nearbyAttractions = attractions
      .map(attraction => {
        const lat2 = parseFloat(attraction.latitude)
        const lon2 = parseFloat(attraction.longitude)
        
        // Haversine formula for distance calculation
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c

        return {
          ...attraction,
          price: attraction.price ? parseFloat(attraction.price) : 0,
          totalVisits: attraction._count.visits,
          image: attraction.images[0]?.imageUrl || null,
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal
        }
      })
      .filter(attraction => attraction.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit))

    res.status(200).json({
      success: true,
      data: nearbyAttractions
    })
  } catch (error) {
    console.error('Get nearby attractions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby attractions',
      error: error.message
    })
  }
}

// Get attraction statistics
const getAttractionStats = async (req, res) => {
  try {
    const [totalAttractions, totalVisits, avgRating] = await Promise.all([
      prisma.attraction.count(),
      prisma.visit.count(),
      prisma.attraction.aggregate({
        _avg: {
          rating: true
        }
      })
    ])

    // Get category breakdown
    const categoryStats = await prisma.attraction.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })

    res.status(200).json({
      success: true,
      data: {
        totalAttractions,
        totalVisits,
        averageRating: avgRating._avg.rating || 0,
        categoryBreakdown: categoryStats
      }
    })
  } catch (error) {
    console.error('Get attraction stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attraction statistics',
      error: error.message
    })
  }
}

// ===============================
// REVIEW ENDPOINTS
// ===============================

// Get attraction reviews
const getAttractionReviews = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 10 } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    const [reviews, total] = await Promise.all([
      prisma.visit.findMany({
        where: {
          attractionId: parseInt(id),
          visitorFeedback: { not: null }
        },
        include: {
          visitor: {
            select: { id: true, username: true, profilePicture: true }
          }
        },
        orderBy: { visitDate: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.visit.count({
        where: {
          attractionId: parseInt(id),
          visitorFeedback: { not: null }
        }
      })
    ])

    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      feedback: review.visitorFeedback,
      visitDate: review.visitDate,
      duration: review.duration,
      visitor: review.visitor
    }))

    res.status(200).json({
      success: true,
      data: transformedReviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get attraction reviews error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    })
  }
}

// Submit a review
const submitReview = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      attractionId,
      rating,
      visitorFeedback,
      visitDate,
      duration,
      amount
    } = req.body

    // Validation
    if (!attractionId || !rating || !visitorFeedback || !visitDate) {
      return res.status(400).json({
        success: false,
        message: 'Attraction ID, rating, feedback, and visit date are required'
      })
    }

    // Check if attraction exists
    const attraction = await prisma.attraction.findUnique({
      where: { id: parseInt(attractionId) }
    })

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found'
      })
    }

    // Create visit with review
    const visit = await prisma.visit.create({
      data: {
        attractionId: parseInt(attractionId),
        userId,
        rating: parseFloat(rating),
        visitorFeedback,
        visitDate: new Date(visitDate),
        duration: duration ? parseInt(duration) : null,
        amount: amount ? parseFloat(amount) : null
      },
      include: {
        visitor: {
          select: { id: true, username: true }
        }
      }
    })

    // Update attraction's average rating
    const avgRating = await prisma.visit.aggregate({
      where: {
        attractionId: parseInt(attractionId),
        rating: { not: null }
      },
      _avg: {
        rating: true
      }
    })

    await prisma.attraction.update({
      where: { id: parseInt(attractionId) },
      data: {
        rating: avgRating._avg.rating || 0
      }
    })

    res.status(201).json({
      success: true,
      data: visit,
      message: 'Review submitted successfully'
    })
  } catch (error) {
    console.error('Submit review error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    })
  }
}

// ===============================
// FAVORITES ENDPOINTS
// ===============================

// Get user's favorite attractions
const getFavoriteAttractions = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10 } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    // Note: This assumes a Favorite model exists in your schema
    // If not, you'll need to add it or modify this logic
    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: {
          attraction: {
            include: {
              images: {
                take: 1
              },
              _count: {
                select: { visits: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.favorite.count({ where: { userId } })
    ])

    const transformedFavorites = favorites.map(fav => ({
      id: fav.id,
      createdDate: fav.createdAt,
      attraction: {
        ...fav.attraction,
        price: fav.attraction.price ? parseFloat(fav.attraction.price) : 0,
        totalVisits: fav.attraction._count.visits,
        image: fav.attraction.images[0]?.imageUrl || null
      }
    }))

    res.status(200).json({
      success: true,
      data: transformedFavorites,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
      error: error.message
    })
  }
}

// Add attraction to favorites
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id
    const { attractionId } = req.body

    if (!attractionId) {
      return res.status(400).json({
        success: false,
        message: 'Attraction ID is required'
      })
    }

    // Check if attraction exists
    const attraction = await prisma.attraction.findUnique({
      where: { id: parseInt(attractionId) }
    })

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found'
      })
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        attractionId: parseInt(attractionId)
      }
    })

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Attraction already in favorites'
      })
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        attractionId: parseInt(attractionId)
      },
      include: {
        attraction: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Added to favorites successfully'
    })
  } catch (error) {
    console.error('Add to favorites error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites',
      error: error.message
    })
  }
}

// Remove from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id
    const { attractionId } = req.params

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        attractionId: parseInt(attractionId)
      }
    })

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      })
    }

    await prisma.favorite.delete({
      where: { id: favorite.id }
    })

    res.status(200).json({
      success: true,
      message: 'Removed from favorites successfully'
    })
  } catch (error) {
    console.error('Remove from favorites error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message
    })
  }
}

// Check if attraction is favorited
const isFavorited = async (req, res) => {
  try {
    const userId = req.user.id
    const { attractionId } = req.params

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        attractionId: parseInt(attractionId)
      }
    })

    res.status(200).json({
      success: true,
      data: {
        favorited: !!favorite
      }
    })
  } catch (error) {
    console.error('Check favorited error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
      error: error.message
    })
  }
}

// ===============================
// VISIT ENDPOINTS
// ===============================

// Get user's visits
const getUserVisits = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10 } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where: { userId },
        include: {
          attraction: {
            include: {
              images: {
                take: 1
              }
            }
          }
        },
        orderBy: { visitDate: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.visit.count({ where: { userId } })
    ])

    const transformedVisits = visits.map(visit => ({
      ...visit,
      amount: visit.amount ? parseFloat(visit.amount) : null,
      attraction: {
        ...visit.attraction,
        price: visit.attraction.price ? parseFloat(visit.attraction.price) : 0,
        image: visit.attraction.images[0]?.imageUrl || null
      }
    }))

    res.status(200).json({
      success: true,
      data: transformedVisits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get user visits error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visits',
      error: error.message
    })
  }
}

// Record a visit (used for bookings/check-ins)
const recordVisit = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      attractionId,
      visitDate,
      amount,
      duration,
      groupId,
      visitorFeedback,
      rating
    } = req.body

    if (!attractionId || !visitDate) {
      return res.status(400).json({
        success: false,
        message: 'Attraction ID and visit date are required'
      })
    }

    // Check if attraction exists
    const attraction = await prisma.attraction.findUnique({
      where: { id: parseInt(attractionId) }
    })

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found'
      })
    }

    const visit = await prisma.visit.create({
      data: {
        attractionId: parseInt(attractionId),
        userId,
        visitDate: new Date(visitDate),
        amount: amount ? parseFloat(amount) : null,
        duration: duration ? parseInt(duration) : null,
        groupId,
        visitorFeedback,
        rating: rating ? parseFloat(rating) : null
      },
      include: {
        attraction: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: visit,
      message: 'Visit recorded successfully'
    })
  } catch (error) {
    console.error('Record visit error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to record visit',
      error: error.message
    })
  }
}

// ===============================
// BOOKING ENDPOINTS
// ===============================

// Create a booking
const createBooking = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      attractionId,
      visitDate,
      timeSlot,
      numberOfVisitors,
      ticketType,
      totalAmount,
      contactInfo,
      paymentMethod
    } = req.body

    // Validation
    if (!attractionId || !visitDate || !numberOfVisitors || !totalAmount || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information'
      })
    }

    // Check if attraction exists
    const attraction = await prisma.attraction.findUnique({
      where: { id: parseInt(attractionId) }
    })

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found'
      })
    }

    // Note: This assumes a Booking model exists in your schema
    // You'll need to add this to your Prisma schema
    const booking = await prisma.booking.create({
      data: {
        userId,
        attractionId: parseInt(attractionId),
        visitDate: new Date(visitDate),
        timeSlot,
        numberOfVisitors: parseInt(numberOfVisitors),
        ticketType,
        totalAmount: parseFloat(totalAmount),
        contactInfo: JSON.stringify(contactInfo),
        paymentMethod,
        status: 'PENDING'
      },
      include: {
        attraction: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    })
  } catch (error) {
    console.error('Create booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    })
  }
}

// Get user bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      page = 1,
      limit = 10,
      status,
      upcomingOnly
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    const where = { userId }
    
    if (status) {
      where.status = status.toUpperCase()
    }
    
    if (upcomingOnly === 'true') {
      where.visitDate = {
        gte: new Date()
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          attraction: {
            include: {
              images: {
                take: 1
              }
            }
          }
        },
        orderBy: { visitDate: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.booking.count({ where })
    ])

    const transformedBookings = bookings.map(booking => ({
      ...booking,
      totalAmount: parseFloat(booking.totalAmount),
      contactInfo: JSON.parse(booking.contactInfo),
      attraction: {
        ...booking.attraction,
        image: booking.attraction.images[0]?.imageUrl || null
      }
    }))

    res.status(200).json({
      success: true,
      data: transformedBookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get user bookings error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    })
  }
}

// Get specific booking
const getBooking = async (req, res) => {
  try {
    const userId = req.user.id
    const { bookingId } = req.params

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        userId
      },
      include: {
        attraction: {
          include: {
            images: true
          }
        }
      }
    })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    const transformedBooking = {
      ...booking,
      totalAmount: parseFloat(booking.totalAmount),
      contactInfo: JSON.parse(booking.contactInfo),
      attraction: {
        ...booking.attraction,
        price: booking.attraction.price ? parseFloat(booking.attraction.price) : 0
      }
    }

    res.status(200).json({
      success: true,
      data: transformedBooking
    })
  } catch (error) {
    console.error('Get booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    })
  }
}

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id
    const { bookingId } = req.params
    const { reason } = req.body

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        userId
      }
    })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      })
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason || 'No reason provided'
      }
    })

    res.status(200).json({
      success: true,
      data: updatedBooking,
      message: 'Booking cancelled successfully'
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    })
  }
}

// Update booking
const updateBooking = async (req, res) => {
  try {
    const userId = req.user.id
    const { bookingId } = req.params
    const updateData = req.body

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        userId
      }
    })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update cancelled or completed bookings'
      })
    }

    // Prepare update data
    const dataToUpdate = {}
    if (updateData.visitDate) dataToUpdate.visitDate = new Date(updateData.visitDate)
    if (updateData.timeSlot) dataToUpdate.timeSlot = updateData.timeSlot
    if (updateData.numberOfVisitors) dataToUpdate.numberOfVisitors = parseInt(updateData.numberOfVisitors)
    if (updateData.specialRequests) {
      const currentContactInfo = JSON.parse(booking.contactInfo)
      currentContactInfo.specialRequests = updateData.specialRequests
      dataToUpdate.contactInfo = JSON.stringify(currentContactInfo)
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: dataToUpdate
    })

    res.status(200).json({
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully'
    })
  } catch (error) {
    console.error('Update booking error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    })
  }
}

module.exports = {
  // Attraction endpoints
  getAttractions,
  getAttraction,
  getFeaturedAttractions,
  getTrendingAttractions,
  getAttractionsByCategory,
  searchAttractions,
  getNearbyAttractions,
  getAttractionStats,
  
  // Review endpoints
  getAttractionReviews,
  submitReview,
  
  // Favorites endpoints
  getFavoriteAttractions,
  addToFavorites,
  removeFromFavorites,
  isFavorited,
  
  // Visit endpoints
  getUserVisits,
  recordVisit,
  
  // Booking endpoints
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  updateBooking
}
