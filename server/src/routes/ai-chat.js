const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const geminiService = require('../services/geminiService')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Tourist AI Chat Assistant
 * POST /api/ai-chat/message
 * Send a message to the AI assistant and get personalized tourism recommendations
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, chatHistory = [] } = req.body
    const userId = req.user.id

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty'
      })
    }

    // Get comprehensive database context for better AI responses
    const databaseContext = await getTourismDatabaseContext(userId)

    // Generate AI response using Gemini service
    const aiResponse = await geminiService.generateChatResponse(
      message,
      databaseContext,
      chatHistory
    )

    // Save chat message to database for history (optional)
    try {
      await prisma.chatMessage.create({
        data: {
          userId: userId,
          userMessage: message,
          aiResponse: aiResponse.message,
          suggestions: JSON.stringify(aiResponse.suggestions || []),
          dataInsights: JSON.stringify(aiResponse.dataInsights || []),
          actionItems: JSON.stringify(aiResponse.actionItems || []),
          timestamp: new Date()
        }
      })
    } catch (dbError) {
      // Continue even if saving fails
      console.warn('Failed to save chat message to database:', dbError.message)
    }

    res.json({
      success: true,
      data: {
        message: aiResponse.message,
        suggestions: aiResponse.suggestions || [],
        dataInsights: aiResponse.dataInsights || [],
        actionItems: aiResponse.actionItems || [],
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI Chat error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

/**
 * Get chat history for the current user
 * GET /api/ai-chat/history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const limit = parseInt(req.query.limit) || 20

    const chatHistory = await prisma.chatMessage.findMany({
      where: { userId: userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        userMessage: true,
        aiResponse: true,
        suggestions: true,
        timestamp: true
      }
    }).catch(() => []) // Return empty array if table doesn't exist

    res.json({
      success: true,
      data: chatHistory.map(chat => ({
        id: chat.id,
        userMessage: chat.userMessage,
        aiResponse: chat.aiResponse,
        suggestions: chat.suggestions ? JSON.parse(chat.suggestions) : [],
        timestamp: chat.timestamp
      }))
    })

  } catch (error) {
    console.error('Error fetching chat history:', error)
    res.json({
      success: true,
      data: [] // Return empty history on error
    })
  }
})

/**
 * Get personalized recommendations
 * GET /api/ai-chat/recommendations
 */
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const databaseContext = await getTourismDatabaseContext(userId)

    // Generate personalized recommendations
    const recommendationPrompt = `Based on the tourism data provided, generate 5 personalized attraction recommendations for a tourist. Consider popular attractions, variety of categories, and good ratings.`
    
    const aiResponse = await geminiService.generateChatResponse(
      recommendationPrompt,
      databaseContext,
      []
    )

    res.json({
      success: true,
      data: {
        recommendations: aiResponse.actionItems || [],
        insights: aiResponse.dataInsights || [],
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

/**
 * Get comprehensive tourism database context for AI
 */
async function getTourismDatabaseContext(userId = null) {
  try {
    const [
      totalAttractions,
      totalVisits,
      categories,
      topAttractions,
      categoryStats,
      userStats
    ] = await Promise.all([
      // Total attractions
      prisma.attraction.count(),
      
      // Total visits
      prisma.visit.count(),
      
      // Available categories
      prisma.attraction.findMany({
        select: { category: true },
        distinct: ['category']
      }).then(results => results.map(r => r.category)),
      
      // Top attractions
      prisma.attraction.findMany({
        take: 10,
        orderBy: [
          { rating: 'desc' },
          { visits: { _count: 'desc' } }
        ],
        select: {
          id: true,
          name: true,
          category: true,
          rating: true,
          price: true,
          _count: {
            select: { visits: true }
          }
        }
      }),
      
      // Category statistics
      prisma.attraction.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        _avg: {
          rating: true,
          price: true
        }
      }),
      
      // User-specific stats (if userId provided)
      userId ? prisma.visit.count({
        where: { userId: userId }
      }).catch(() => 0) : 0
    ])

    // Calculate category breakdown
    const categoryBreakdown = categoryStats.map(stat => ({
      category: stat.category,
      count: stat._count.id,
      percentage: ((stat._count.id / totalAttractions) * 100).toFixed(1),
      avgRating: stat._avg.rating?.toFixed(1) || '0.0',
      avgPrice: stat._avg.price?.toFixed(0) || '0'
    }))

    return {
      totalAttractions,
      totalVisits,
      categories,
      topAttractions: topAttractions.map(attr => ({
        name: attr.name,
        category: attr.category,
        rating: attr.rating,
        price: attr.price,
        visitCount: attr._count.visits
      })),
      categoryBreakdown,
      userVisits: userStats,
      recentActivity: {
        lastWeekVisits: 0, // Could be calculated
        avgRecentRating: 4.2,
        topRecentCategories: {}
      }
    }
  } catch (error) {
    console.error('Error getting database context:', error)
    return {
      totalAttractions: 0,
      totalVisits: 0,
      categories: [],
      topAttractions: [],
      categoryBreakdown: [],
      userVisits: 0,
      recentActivity: {
        lastWeekVisits: 0,
        avgRecentRating: 0,
        topRecentCategories: {}
      }
    }
  }
}

module.exports = router
