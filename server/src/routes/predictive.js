const express = require('express')
const { prisma } = require('../config/database')
const { authenticate } = require('../middleware/auth')
const geminiService = require('../services/geminiService')

const router = express.Router()

/**
 * GET /api/predictive
 * Get predictive models and analytics data for AI insights
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 5 } = req.query
    
    console.log(`🔮 Fetching predictive models (limit: ${limit})`)
    
    // Get historical data for predictive analysis
    const [visits, attractions, recentTrends] = await Promise.all([
      // Recent visits for trend analysis
      prisma.visit.findMany({
        orderBy: { visitDate: 'desc' },
        take: 100,
        include: {
          attraction: {
            select: {
              name: true,
              category: true,
              price: true
            }
          }
        }
      }),
      
      // Attraction performance data
      prisma.attraction.findMany({
        include: {
          _count: {
            select: { visits: true }
          }
        },
        orderBy: {
          visits: {
            _count: 'desc'
          }
        },
        take: 20
      }),
      
      // Monthly trends for the last 6 months
      prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(visitDate, '%Y-%m') as month,
          COUNT(*) as visits,
          SUM(amount) as revenue,
          AVG(amount) as avgRevenue,
          AVG(rating) as avgRating
        FROM visit 
        WHERE visitDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(visitDate, '%Y-%m')
        ORDER BY month DESC
        LIMIT 6
      `
    ])

    // Transform data for predictive analysis
    const historicalData = {
      totalVisits: visits.length,
      totalRevenue: visits.reduce((sum, visit) => sum + (visit.amount || 0), 0),
      avgRating: visits.reduce((sum, visit) => sum + (visit.rating || 0), 0) / visits.length,
      monthlyTrends: recentTrends.map(trend => ({
        month: trend.month,
        visits: Number(trend.visits),
        revenue: Number(trend.revenue || 0),
        avgRevenue: Number(trend.avgRevenue || 0),
        avgRating: Number(trend.avgRating || 0)
      })),
      topAttractions: attractions.slice(0, parseInt(limit)).map(attr => ({
        id: attr.id,
        name: attr.name,
        category: attr.category,
        visits: attr._count.visits,
        price: attr.price,
        rating: attr.rating
      }))
    }

    // Generate predictive insights using Gemini AI
    const predictiveAnalytics = await geminiService.generatePredictiveAnalytics(historicalData, {
      period: 'month',
      forecastHorizon: 3,
      includeSeasonality: true
    })

    // FALLBACK DATA COMMENTED OUT - Using only AI-generated data
    // const predictiveAnalytics = {
    //   forecastMetrics: {
    //     nextMonthVisitors: 15000 + Math.round(historicalData.totalVisits * 0.1),
    //     nextMonthRevenue: 280000 + Math.round(historicalData.totalRevenue * 0.15),
    //     quarterlyRevenue: 850000 + Math.round(historicalData.totalRevenue * 0.45),
    //     seasonalIndex: 1.15,
    //     accuracyScore: 94.2,
    //     growthRate: 8.5
    //   },
    //   insights: {
    //     keyPredictions: [
    //       `Based on ${historicalData.totalVisits} historical visits, expect continued growth`,
    //       `Revenue trends show ${historicalData.monthlyTrends.length} months of positive patterns`,
    //       `Top ${historicalData.topAttractions.length} attractions driving visitor engagement`
    //     ],
    //     riskFactors: [
    //       "Weather dependency remains a significant factor",
    //       "Economic uncertainty may impact visitor spending"
    //     ],
    //     opportunities: [
    //       "Growing interest in sustainable tourism options",
    //       "Digital marketing channels showing strong conversion rates"
    //     ]
    //   }
    // }

    // Transform into predictive models format expected by frontend
    const predictiveModels = [
      {
        id: 'visitor-forecast',
        name: 'Visitor Forecast',
        type: 'forecast',
        accuracy: predictiveAnalytics.forecastMetrics.accuracyScore,
        lastUpdated: new Date().toISOString(),
        predictions: {
          nextMonth: {
            visitors: predictiveAnalytics.forecastMetrics.nextMonthVisitors,
            confidence: 92
          },
          quarter: {
            revenue: predictiveAnalytics.forecastMetrics.quarterlyRevenue,
            confidence: 88
          }
        },
        insights: predictiveAnalytics.insights.keyPredictions.slice(0, 2),
        status: 'active'
      },
      {
        id: 'revenue-prediction',
        name: 'Revenue Prediction',
        type: 'prediction',
        accuracy: Math.round(predictiveAnalytics.forecastMetrics.accuracyScore * 0.95),
        lastUpdated: new Date().toISOString(),
        predictions: {
          nextMonth: {
            revenue: predictiveAnalytics.forecastMetrics.nextMonthRevenue,
            confidence: 89
          },
          growthRate: {
            percentage: predictiveAnalytics.forecastMetrics.growthRate,
            confidence: 85
          }
        },
        insights: [
          `Projected ${predictiveAnalytics.forecastMetrics.growthRate}% growth rate`,
          `Seasonal index: ${predictiveAnalytics.forecastMetrics.seasonalIndex}`
        ],
        status: 'active'
      },
      {
        id: 'trend-analysis',
        name: 'Trend Analysis',
        type: 'analysis',
        accuracy: 91,
        lastUpdated: new Date().toISOString(),
        predictions: {
          trends: predictiveAnalytics.insights.opportunities.slice(0, 2),
          risks: predictiveAnalytics.insights.riskFactors.slice(0, 2)
        },
        insights: [
          `${historicalData.totalVisits} historical visits analyzed`,
          `${recentTrends.length} months of trend data processed`
        ],
        status: 'active'
      }
    ]

    // Return only the requested limit
    const limitedModels = predictiveModels.slice(0, parseInt(limit))

    console.log(`✅ Generated ${limitedModels.length} predictive models`)

    res.status(200).json({
      success: true,
      data: limitedModels
    })

  } catch (error) {
    console.error('❌ Error fetching predictive models:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictive models',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

/**
 * GET /api/predictive/:modelId
 * Get detailed information about a specific predictive model
 */
router.get('/:modelId', authenticate, async (req, res) => {
  try {
    const { modelId } = req.params
    
    // This would fetch detailed model information
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      data: {
        id: modelId,
        name: `Predictive Model ${modelId}`,
        status: 'active',
        lastUpdated: new Date().toISOString(),
        details: 'Detailed model information would be here'
      }
    })
    
  } catch (error) {
    console.error('Error fetching predictive model details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictive model details'
    })
  }
})

module.exports = router
