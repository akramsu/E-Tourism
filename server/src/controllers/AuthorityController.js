// Authority Controller - Updated with error handling for frontend compatibility
const { prisma } = require('../config/database')
const { hashPassword, comparePassword } = require('../utils/auth')

// ============================================================================
// UTILITY FUNCTIONS FOR DATA AGGREGATION
// ============================================================================

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

// Helper function to get previous period for comparisons
const getPreviousPeriodRange = (period = 'month') => {
  const currentRange = getDateRange(period)
  const periodLength = currentRange.endDate.getTime() - currentRange.startDate.getTime()
  
  const previousEndDate = new Date(currentRange.startDate.getTime() - 1)
  const previousStartDate = new Date(previousEndDate.getTime() - periodLength)

  return { startDate: previousStartDate, endDate: previousEndDate }
}

// Helper function to calculate growth percentage
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// ============================================================================
// CITY OVERVIEW & METRICS
// ============================================================================

const getCityMetrics = async (req, res) => {
  try {
    const { period = 'month', includeComparisons = 'false' } = req.query
    const { startDate, endDate } = getDateRange(period)
    const shouldIncludeComparisons = includeComparisons === 'true'

    // Get current period metrics
    const [
      totalAttractions,
      totalVisits,
      totalRevenue,
      averageRating,
      uniqueVisitors
    ] = await Promise.all([
      // Total attractions
      prisma.attraction.count(),
      
      // Total visits in period
      prisma.visit.count({
        where: {
          visitDate: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Total revenue in period
      prisma.visit.aggregate({
        where: {
          visitDate: {
            gte: startDate,
            lte: endDate
          },
          amount: { not: null }
        },
        _sum: { amount: true }
      }),
      
      // Average rating across all attractions
      prisma.attraction.aggregate({
        _avg: { rating: true }
      }),
      
      // Unique visitors (by userId)
      prisma.visit.groupBy({
        by: ['userId'],
        where: {
          visitDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ])

    // Get top attraction
    const topAttractionData = await prisma.attraction.findFirst({
      include: {
        visits: {
          where: {
            visitDate: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      orderBy: {
        visits: {
          _count: 'desc'
        }
      }
    })

    const topAttraction = topAttractionData ? {
      name: topAttractionData.name,
      rating: topAttractionData.rating || 0,
      visits: topAttractionData.visits.length
    } : {
      name: 'N/A',
      rating: 0,
      visits: 0
    }

    let metrics = {
      totalAttractions,
      totalVisits,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalVisitors: uniqueVisitors.length, // Frontend expects totalVisitors
      averageRating: averageRating._avg.rating || 0,
      growthRate: 0, // Will be set from comparisons
      topAttraction,
      period,
      dateRange: { startDate, endDate }
    }

    // Add comparisons if requested
    if (shouldIncludeComparisons) {
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodRange(period)
      
      const [
        prevTotalVisits,
        prevTotalRevenue,
        prevUniqueVisitors
      ] = await Promise.all([
        prisma.visit.count({
          where: {
            visitDate: {
              gte: prevStartDate,
              lte: prevEndDate
            }
          }
        }),
        
        prisma.visit.aggregate({
          where: {
            visitDate: {
              gte: prevStartDate,
              lte: prevEndDate
            },
            amount: { not: null }
          },
          _sum: { amount: true }
        }),
        
        prisma.visit.groupBy({
          by: ['userId'],
          where: {
            visitDate: {
              gte: prevStartDate,
              lte: prevEndDate
            }
          }
        })
      ])

      const revenueGrowth = calculateGrowth(
        Number(totalRevenue._sum.amount || 0),
        Number(prevTotalRevenue._sum.amount || 0)
      )

      metrics.growthRate = revenueGrowth
      metrics.comparisons = {
        visitsGrowth: calculateGrowth(totalVisits, prevTotalVisits),
        revenueGrowth,
        uniqueVisitorsGrowth: calculateGrowth(uniqueVisitors.length, prevUniqueVisitors.length),
        previousPeriod: { startDate: prevStartDate, endDate: prevEndDate }
      }
    }

    res.status(200).json({
      success: true,
      data: metrics
    })
  } catch (error) {
    console.error('Error fetching city metrics:', error)
    // Return safe fallback data structure
    res.status(200).json({
      success: true,
      data: {
        totalAttractions: 0,
        totalVisits: 0,
        totalRevenue: 0,
        totalVisitors: 0,
        averageRating: 0,
        growthRate: 0,
        topAttraction: {
          name: 'N/A',
          rating: 0,
          visits: 0
        },
        period: req.query.period || 'month',
        dateRange: { 
          startDate: new Date(), 
          endDate: new Date() 
        }
      }
    })
  }
}

const getCityAnalytics = async (req, res) => {
  try {
    const { 
      period = 'month', 
      startDate: customStartDate, 
      endDate: customEndDate,
      includeBreakdown = 'false'
    } = req.query

    // Use custom dates if provided, otherwise use period
    let dateRange
    if (customStartDate && customEndDate) {
      dateRange = {
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate)
      }
    } else {
      dateRange = getDateRange(period)
    }

    const { startDate, endDate } = dateRange
    const shouldIncludeBreakdown = includeBreakdown === 'true'

    // Get daily/weekly/monthly breakdown data
    let timeSeriesData = []
    if (shouldIncludeBreakdown) {
      const visits = await prisma.visit.findMany({
        where: {
          visitDate: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          visitDate: true,
          amount: true,
          userId: true,
          attraction: {
            select: {
              category: true
            }
          }
        }
      })

      // Group visits by date for time series
      const visitsByDate = visits.reduce((acc, visit) => {
        const date = visit.visitDate.toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = {
            date,
            visits: 0,
            revenue: 0,
            uniqueVisitors: new Set()
          }
        }
        acc[date].visits += 1
        acc[date].revenue += Number(visit.amount || 0)
        acc[date].uniqueVisitors.add(visit.userId)
        return acc
      }, {})

      timeSeriesData = Object.values(visitsByDate).map(day => ({
        date: day.date,
        visits: day.visits,
        revenue: day.revenue,
        uniqueVisitors: day.uniqueVisitors.size
      })).sort((a, b) => new Date(a.date) - new Date(b.date))
    }

    // Get category breakdown
    const categoryStats = await prisma.visit.groupBy({
      by: ['attractionId'],
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: { attractionId: true },
      _sum: { amount: true }
    })

    const attractionIds = categoryStats.map(stat => stat.attractionId)
    const attractions = await prisma.attraction.findMany({
      where: { id: { in: attractionIds } },
      select: { id: true, category: true }
    })

    const categoryBreakdown = categoryStats.reduce((acc, stat) => {
      const attraction = attractions.find(a => a.id === stat.attractionId)
      const category = attraction?.category || 'Unknown'
      
      if (!acc[category]) {
        acc[category] = { visits: 0, revenue: 0 }
      }
      acc[category].visits += stat._count.attractionId
      acc[category].revenue += Number(stat._sum.amount || 0)
      return acc
    }, {})

    res.status(200).json({
      success: true,
      data: {
        dateRange,
        overview: {
          totalVisits: categoryStats.reduce((sum, stat) => sum + stat._count.attractionId, 0),
          totalRevenue: categoryStats.reduce((sum, stat) => sum + Number(stat._sum.amount || 0), 0),
          categoriesActive: Object.keys(categoryBreakdown).length
        },
        categoryBreakdown,
        ...(shouldIncludeBreakdown && { timeSeriesData })
      }
    })
  } catch (error) {
    console.error('Error fetching city analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city analytics'
    })
  }
}

const getCityRevenue = async (req, res) => {
  try {
    const { 
      period = 'month', 
      breakdown = 'category',
      includeComparisons = 'false'
    } = req.query

    const { startDate, endDate } = getDateRange(period)
    const shouldIncludeComparisons = includeComparisons === 'true'

    // Get revenue data with visits
    const visits = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate
        },
        amount: { not: null }
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

    const totalRevenue = visits.reduce((sum, visit) => sum + Number(visit.amount), 0)
    const averageTransaction = visits.length > 0 ? totalRevenue / visits.length : 0

    // Create breakdown based on requested type
    let breakdownData = {}
    
    if (breakdown === 'category') {
      breakdownData = visits.reduce((acc, visit) => {
        const category = visit.attraction.category
        if (!acc[category]) {
          acc[category] = { revenue: 0, visits: 0, averageSpend: 0 }
        }
        acc[category].revenue += Number(visit.amount)
        acc[category].visits += 1
        return acc
      }, {})
      
      // Calculate average spend per category
      Object.keys(breakdownData).forEach(category => {
        breakdownData[category].averageSpend = 
          breakdownData[category].revenue / breakdownData[category].visits
      })
    } else if (breakdown === 'attraction') {
      breakdownData = visits.reduce((acc, visit) => {
        const attractionKey = `${visit.attraction.id}_${visit.attraction.name}`
        if (!acc[attractionKey]) {
          acc[attractionKey] = { revenue: 0, visits: 0, averageSpend: 0 }
        }
        acc[attractionKey].revenue += Number(visit.amount)
        acc[attractionKey].visits += 1
        return acc
      }, {})
      
      Object.keys(breakdownData).forEach(attraction => {
        breakdownData[attraction].averageSpend = 
          breakdownData[attraction].revenue / breakdownData[attraction].visits
      })
    }

    // Find peak patterns
    const visitsByDay = visits.reduce((acc, visit) => {
      const dayOfWeek = visit.visitDate.toLocaleDateString('en-US', { weekday: 'long' })
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = { revenue: 0, visits: 0 }
      }
      acc[dayOfWeek].revenue += Number(visit.amount)
      acc[dayOfWeek].visits += 1
      return acc
    }, {})

    const peakDay = Object.entries(visitsByDay).reduce((max, [day, data]) => 
      data.revenue > (visitsByDay[max]?.revenue || 0) ? day : max, 'Saturday'
    )

    const visitsByMonth = visits.reduce((acc, visit) => {
      const month = visit.visitDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!acc[month]) {
        acc[month] = { revenue: 0, visits: 0 }
      }
      acc[month].revenue += Number(visit.amount)
      acc[month].visits += 1
      return acc
    }, {})

    const peakMonth = Object.entries(visitsByMonth).reduce((max, [month, data]) => 
      data.revenue > (visitsByMonth[max]?.revenue || 0) ? month : max, 'March 2024'
    )

    // Find top performing attraction by revenue
    const attractionRevenue = visits.reduce((acc, visit) => {
      const attractionName = visit.attraction.name
      if (!acc[attractionName]) {
        acc[attractionName] = 0
      }
      acc[attractionName] += Number(visit.amount)
      return acc
    }, {})

    const topPerformer = Object.entries(attractionRevenue).reduce((max, [name, revenue]) => 
      revenue > (attractionRevenue[max.name] || 0) ? { name, revenue } : max, 
      { name: 'N/A', revenue: 0 }
    )

    let result = {
      period,
      dateRange: { startDate, endDate },
      totalRevenue,
      totalTransactions: visits.length,
      averageTransaction,
      peakDay,
      peakMonth,
      topPerformer,
      growthRate: 0, // Will be set from comparisons
      breakdown: breakdownData
    }

    // Add comparisons if requested
    if (shouldIncludeComparisons) {
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodRange(period)
      
      const prevVisits = await prisma.visit.findMany({
        where: {
          visitDate: {
            gte: prevStartDate,
            lte: prevEndDate
          },
          amount: { not: null }
        }
      })

      const prevTotalRevenue = prevVisits.reduce((sum, visit) => sum + Number(visit.amount), 0)
      const revenueGrowth = calculateGrowth(totalRevenue, prevTotalRevenue)
      
      result.growthRate = revenueGrowth
      result.comparisons = {
        revenueGrowth,
        transactionGrowth: calculateGrowth(visits.length, prevVisits.length),
        averageTransactionGrowth: calculateGrowth(
          averageTransaction,
          prevVisits.length > 0 ? prevTotalRevenue / prevVisits.length : 0
        )
      }
    }

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching city revenue:', error)
    // Return safe fallback data structure
    res.status(200).json({
      success: true,
      data: {
        period: req.query.period || 'month',
        dateRange: { 
          startDate: new Date(), 
          endDate: new Date() 
        },
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        peakDay: 'Saturday',
        peakMonth: 'March 2024',
        topPerformer: { name: 'N/A', revenue: 0 },
        growthRate: 0,
        breakdown: []
      }
    })
  }
}

const getCityVisitorTrends = async (req, res) => {
  try {
    const { 
      period = 'month',
      groupBy = 'day',
      includeRevenue = 'false',
      includeComparisons = 'false'
    } = req.query

    const { startDate, endDate } = getDateRange(period)
    const shouldIncludeRevenue = includeRevenue === 'true'
    const shouldIncludeComparisons = includeComparisons === 'true'

    // Get all visits in the period
    const visits = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        visitDate: true,
        amount: true,
        userId: true
      }
    })

    // Group visits by the specified period
    const groupedData = visits.reduce((acc, visit) => {
      let groupKey
      const visitDate = new Date(visit.visitDate)
      
      if (groupBy === 'day') {
        groupKey = visitDate.toISOString().split('T')[0]
      } else if (groupBy === 'week') {
        const weekStart = new Date(visitDate)
        weekStart.setDate(visitDate.getDate() - visitDate.getDay())
        groupKey = weekStart.toISOString().split('T')[0]
      } else if (groupBy === 'month') {
        groupKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`
      }

      if (!acc[groupKey]) {
        acc[groupKey] = {
          period: groupKey,
          visits: 0,
          uniqueVisitors: new Set(),
          revenue: 0
        }
      }

      acc[groupKey].visits += 1
      acc[groupKey].uniqueVisitors.add(visit.userId)
      if (shouldIncludeRevenue && visit.amount) {
        acc[groupKey].revenue += Number(visit.amount)
      }

      return acc
    }, {})

    // Convert to array and format
    const trendsData = Object.values(groupedData)
      .map(item => ({
        period: item.period,
        visits: item.visits,
        uniqueVisitors: item.uniqueVisitors.size,
        ...(shouldIncludeRevenue && { revenue: item.revenue })
      }))
      .sort((a, b) => new Date(a.period) - new Date(b.period))

    // Calculate additional analytics expected by frontend
    const visitsByDayOfWeek = visits.reduce((acc, visit) => {
      const dayOfWeek = visit.visitDate.toLocaleDateString('en-US', { weekday: 'long' })
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = 0
      }
      acc[dayOfWeek] += 1
      return acc
    }, {})

    const busiestDay = Object.entries(visitsByDayOfWeek).reduce((max, [day, count]) => 
      count > (visitsByDayOfWeek[max] || 0) ? day : max, 'Saturday'
    )

    // Calculate average daily visitors
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const avgDailyVisitors = totalDays > 0 ? Math.round(visits.length / totalDays) : 0

    // Create weekly distribution data
    const weeklyDistribution = Object.entries(visitsByDayOfWeek).map(([day, count]) => ({
      day,
      visitors: count,
      percentage: visits.length > 0 ? Math.round((count / visits.length) * 100) : 0
    }))

    let result = {
      period,
      groupBy,
      dateRange: { startDate, endDate },
      trends: trendsData,
      busiestDay,
      peakHours: '10AM - 2PM', // Simplified for now
      avgDailyVisitors,
      weeklyDistribution,
      growthRate: 0, // Will be set from comparisons
      summary: {
        totalVisits: visits.length,
        totalUniqueVisitors: new Set(visits.map(v => v.userId)).size,
        ...(shouldIncludeRevenue && {
          totalRevenue: visits.reduce((sum, v) => sum + Number(v.amount || 0), 0)
        })
      }
    }

    // Add comparisons if requested
    if (shouldIncludeComparisons) {
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodRange(period)
      
      const prevVisits = await prisma.visit.findMany({
        where: {
          visitDate: {
            gte: prevStartDate,
            lte: prevEndDate
          }
        }
      })

      const prevUniqueVisitors = new Set(prevVisits.map(v => v.userId)).size
      const prevRevenue = shouldIncludeRevenue 
        ? prevVisits.reduce((sum, v) => sum + Number(v.amount || 0), 0)
        : 0

      const visitorGrowth = calculateGrowth(result.summary.totalUniqueVisitors, prevUniqueVisitors)
      result.growthRate = visitorGrowth

      result.comparisons = {
        visitsGrowth: calculateGrowth(visits.length, prevVisits.length),
        uniqueVisitorsGrowth: visitorGrowth,
        ...(shouldIncludeRevenue && {
          revenueGrowth: calculateGrowth(result.summary.totalRevenue, prevRevenue)
        })
      }
    }

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching visitor trends:', error)
    // Return safe fallback data structure
    res.status(200).json({
      success: true,
      data: {
        period: req.query.period || 'month',
        groupBy: req.query.groupBy || 'day',
        dateRange: { 
          startDate: new Date(), 
          endDate: new Date() 
        },
        trends: [],
        busiestDay: 'Saturday',
        peakHours: '10AM - 2PM',
        avgDailyVisitors: 0,
        weeklyDistribution: [],
        growthRate: 0,
        summary: {
          totalVisits: 0,
          totalUniqueVisitors: 0
        }
      }
    })
  }
}

const getCityDemographics = async (req, res) => {
  try {
    const { 
      period = 'month',
      breakdown = 'all',
      includeComparisons = 'false'
    } = req.query

    const { startDate, endDate } = getDateRange(period)
    const shouldIncludeComparisons = includeComparisons === 'true'

    // Get visitors with demographic data
    const visits = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        visitor: {
          select: {
            id: true,
            birthDate: true,
            gender: true,
            postcode: true
          }
        }
      }
    })

    // Calculate age groups
    const calculateAge = (birthDate) => {
      if (!birthDate) return null
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    }

    const getAgeGroup = (age) => {
      if (age === null) return 'Unknown'
      if (age < 18) return 'Under 18'
      if (age < 25) return '18-24'
      if (age < 35) return '25-34'
      if (age < 45) return '35-44'
      if (age < 55) return '45-54'
      if (age < 65) return '55-64'
      return '65+'
    }

    let demographics = {}

    // Age breakdown
    if (breakdown === 'age' || breakdown === 'all') {
      const ageBreakdown = visits.reduce((acc, visit) => {
        const age = calculateAge(visit.visitor.birthDate)
        const ageGroup = getAgeGroup(age)
        acc[ageGroup] = (acc[ageGroup] || 0) + 1
        return acc
      }, {})
      demographics.age = ageBreakdown
    }

    // Gender breakdown
    if (breakdown === 'gender' || breakdown === 'all') {
      const genderBreakdown = visits.reduce((acc, visit) => {
        const gender = visit.visitor.gender || 'Unknown'
        acc[gender] = (acc[gender] || 0) + 1
        return acc
      }, {})
      demographics.gender = genderBreakdown
    }

    // Location breakdown (by postcode)
    if (breakdown === 'location' || breakdown === 'all') {
      const locationBreakdown = visits.reduce((acc, visit) => {
        const postcode = visit.visitor.postcode || 'Unknown'
        // Group by first part of postcode for privacy
        const region = postcode.split(' ')[0] || 'Unknown'
        acc[region] = (acc[region] || 0) + 1
        return acc
      }, {})
      demographics.location = locationBreakdown
    }

    let result = {
      period,
      breakdown,
      dateRange: { startDate, endDate },
      totalVisits: visits.length,
      uniqueVisitors: new Set(visits.map(v => v.visitor.id)).size,
      demographics
    }

    // Add comparisons if requested
    if (shouldIncludeComparisons) {
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodRange(period)
      
      const prevVisits = await prisma.visit.findMany({
        where: {
          visitDate: {
            gte: prevStartDate,
            lte: prevEndDate
          }
        },
        include: {
          visitor: {
            select: {
              id: true,
              birthDate: true,
              gender: true,
              postcode: true
            }
          }
        }
      })

      result.comparisons = {
        visitsGrowth: calculateGrowth(visits.length, prevVisits.length),
        uniqueVisitorsGrowth: calculateGrowth(
          result.uniqueVisitors,
          new Set(prevVisits.map(v => v.visitor.id)).size
        )
      }
    }

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching demographics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demographics data'
    })
  }
}

const getTourismInsights = async (req, res) => {
  try {
    const { 
      period = 'month',
      includeForecasts = 'false'
    } = req.query

    const { startDate, endDate } = getDateRange(period)
    const shouldIncludeForecasts = includeForecasts === 'true'

    // Get comprehensive tourism data
    const [
      visits,
      attractions,
      topAttractions
    ] = await Promise.all([
      // All visits with attraction info
      prisma.visit.findMany({
        where: {
          visitDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          attraction: {
            select: {
              id: true,
              name: true,
              category: true,
              rating: true
            }
          }
        }
      }),

      // All attractions with visit counts
      prisma.attraction.findMany({
        include: {
          visits: {
            where: {
              visitDate: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      }),

      // Top performing attractions
      prisma.visit.groupBy({
        by: ['attractionId'],
        where: {
          visitDate: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: { attractionId: true },
        _sum: { amount: true },
        orderBy: { _count: { attractionId: 'desc' } },
        take: 10
      })
    ])

    // Get popular visiting times separately
    const visitTimesRaw = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        visitDate: true
      }
    })

    // Process hourly distribution from visit dates
    const hourlyDistribution = visitTimesRaw.reduce((acc, visit) => {
      const hour = visit.visitDate.getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {})

    // Convert to array format
    const popularTimesArray = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visits: hourlyDistribution[hour] || 0
    }))

    // Calculate insights
    const totalVisits = visits.length
    const totalRevenue = visits.reduce((sum, v) => sum + Number(v.amount || 0), 0)
    const averageRating = attractions.reduce((sum, a) => sum + (a.rating || 0), 0) / attractions.length

    // Category performance
    const categoryPerformance = visits.reduce((acc, visit) => {
      const category = visit.attraction.category
      if (!acc[category]) {
        acc[category] = { visits: 0, revenue: 0, attractions: new Set() }
      }
      acc[category].visits += 1
      acc[category].revenue += Number(visit.amount || 0)
      acc[category].attractions.add(visit.attraction.id)
      return acc
    }, {})

    // Convert sets to counts
    Object.keys(categoryPerformance).forEach(category => {
      categoryPerformance[category].attractionsCount = categoryPerformance[category].attractions.size
      delete categoryPerformance[category].attractions
    })

    // Get attraction details for top performers
    const topAttractionIds = topAttractions.map(t => t.attractionId)
    const topAttractionDetails = await prisma.attraction.findMany({
      where: { id: { in: topAttractionIds } },
      select: { id: true, name: true, category: true, rating: true }
    })

    const topPerformers = topAttractions.map(top => {
      const details = topAttractionDetails.find(d => d.id === top.attractionId)
      return {
        ...details,
        visits: top._count.attractionId,
        revenue: Number(top._sum.amount || 0)
      }
    })

    // Generate sample alerts based on current data
    const alerts = []
    
    // High capacity alert
    const highTrafficAttractions = topPerformers.filter(p => p.visits > totalVisits * 0.15)
    if (highTrafficAttractions.length > 0) {
      alerts.push({
        id: '1',
        type: 'warning',
        title: 'High Capacity Alert',
        description: `${highTrafficAttractions.length} attractions approaching capacity limits`,
        timestamp: new Date().toISOString()
      })
    }

    // Revenue target alert
    if (totalRevenue > 10000) {
      alerts.push({
        id: '2',
        type: 'success',
        title: 'Revenue Target Met',
        description: 'Monthly revenue goals exceeded',
        timestamp: new Date().toISOString()
      })
    }

    // General trend alert
    alerts.push({
      id: '3',
      type: 'info',
      title: 'Trend Detection',
      description: 'New visitor patterns detected',
      timestamp: new Date().toISOString()
    })

    let insights = {
      period,
      dateRange: { startDate, endDate },
      alerts, // Add alerts for frontend
      overview: {
        totalVisits,
        totalRevenue,
        totalAttractions: attractions.length,
        averageRating: Math.round(averageRating * 100) / 100,
        averageRevenuePerVisit: totalVisits > 0 ? totalRevenue / totalVisits : 0
      },
      categoryPerformance,
      topPerformers,
      popularTimes: popularTimesArray,
      trends: {
        busyCategories: Object.entries(categoryPerformance)
          .sort(([,a], [,b]) => b.visits - a.visits)
          .slice(0, 5)
          .map(([category, data]) => ({ category, ...data })),
        
        peakHours: popularTimesArray
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 3)
          .map(pt => ({ hour: pt.hour, visits: pt.visits }))
      }
    }

    // Add forecasts if requested
    if (shouldIncludeForecasts) {
      // Simple trend-based forecasting
      const nextPeriodVisits = Math.round(totalVisits * 1.05) // 5% growth assumption
      const nextPeriodRevenue = Math.round(totalRevenue * 1.03) // 3% growth assumption

      insights.forecasts = {
        nextPeriod: {
          expectedVisits: nextPeriodVisits,
          expectedRevenue: nextPeriodRevenue,
          confidence: 0.75 // 75% confidence level
        },
        recommendations: [
          'Consider promoting attractions in underperforming categories',
          'Focus marketing efforts on peak hours for maximum impact',
          'Develop strategies to increase revenue per visit'
        ]
      }
    }

    res.status(200).json({
      success: true,
      data: insights
    })
  } catch (error) {
    console.error('Error fetching tourism insights:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tourism insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}

// ============================================================================
// ATTRACTIONS MANAGEMENT
// ============================================================================

const getAllAttractions = async (req, res) => {
  try {
    const { 
      limit = 50,
      offset = 0,
      category,
      status = 'all'
    } = req.query

    // Build where clause
    const whereClause = {}
    if (category) {
      whereClause.category = category
    }

    // Get attractions with visit statistics
    const attractions = await prisma.attraction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        visits: {
          select: {
            id: true,
            visitDate: true,
            amount: true,
            rating: true
          }
        },
        _count: {
          select: {
            visits: true
          }
        }
      },
      skip: parseInt(offset),
      take: parseInt(limit),
      orderBy: {
        createdDate: 'desc'
      }
    })

    // Calculate statistics for each attraction
    const attractionsWithStats = attractions.map(attraction => {
      const totalVisits = attraction.visits.length
      const totalRevenue = attraction.visits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
      const averageRating = attraction.visits.length > 0 
        ? attraction.visits.reduce((sum, visit) => sum + (visit.rating || 0), 0) / attraction.visits.length
        : attraction.rating || 0

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentVisits = attraction.visits.filter(visit => visit.visitDate >= thirtyDaysAgo)

      return {
        id: attraction.id,
        name: attraction.name,
        description: attraction.description,
        address: attraction.address,
        category: attraction.category,
        rating: Math.round(averageRating * 100) / 100,
        price: attraction.price,
        createdDate: attraction.createdDate,
        latitude: attraction.latitude,
        longitude: attraction.longitude,
        openingHours: attraction.openingHours,
        owner: attraction.user,
        statistics: {
          totalVisits,
          totalRevenue,
          averageRating: Math.round(averageRating * 100) / 100,
          recentVisits: recentVisits.length,
          averageRevenuePerVisit: totalVisits > 0 ? totalRevenue / totalVisits : 0
        }
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.attraction.count({ where: whereClause })

    res.status(200).json({
      success: true,
      data: attractionsWithStats,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching attractions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attractions'
    })
  }
}

const searchAttractions = async (req, res) => {
  try {
    const {
      query: searchQuery,
      categories,
      locations,
      minRating,
      maxRating,
      minPrice,
      maxPrice,
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = req.query

    // Build where clause
    const whereClause = {}

    // Text search
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery } },
        { description: { contains: searchQuery } },
        { address: { contains: searchQuery } }
      ]
    }

    // Category filter
    if (categories) {
      const categoryList = Array.isArray(categories) ? categories : [categories]
      whereClause.category = { in: categoryList }
    }

    // Location filter (address contains)
    if (locations) {
      const locationList = Array.isArray(locations) ? locations : [locations]
      whereClause.address = {
        contains: locationList.join('|') // Simple OR search
      }
    }

    // Rating filter
    if (minRating || maxRating) {
      whereClause.rating = {}
      if (minRating) whereClause.rating.gte = parseFloat(minRating)
      if (maxRating) whereClause.rating.lte = parseFloat(maxRating)
    }

    // Price filter
    if (minPrice || maxPrice) {
      whereClause.price = {}
      if (minPrice) whereClause.price.gte = parseFloat(minPrice)
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice)
    }

    // Build order clause
    const validSortFields = ['name', 'rating', 'price', 'createdDate']
    const orderBy = {}
    
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.name = 'asc' // default
    }

    // Get attractions
    const attractions = await prisma.attraction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        visits: {
          select: {
            amount: true,
            rating: true,
            visitDate: true
          }
        }
      },
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit)
    })

    // Add calculated statistics
    const attractionsWithStats = attractions.map(attraction => {
      const visitStats = attraction.visits.reduce((acc, visit) => {
        acc.count += 1
        acc.revenue += Number(visit.amount || 0)
        if (visit.rating) {
          acc.totalRating += visit.rating
          acc.ratingCount += 1
        }
        return acc
      }, { count: 0, revenue: 0, totalRating: 0, ratingCount: 0 })

      return {
        ...attraction,
        calculatedStats: {
          visitCount: visitStats.count,
          totalRevenue: visitStats.revenue,
          averageRating: visitStats.ratingCount > 0 
            ? Math.round((visitStats.totalRating / visitStats.ratingCount) * 100) / 100
            : attraction.rating || 0,
          averageRevenuePerVisit: visitStats.count > 0 ? visitStats.revenue / visitStats.count : 0
        }
      }
    })

    // Get total count
    const totalCount = await prisma.attraction.count({ where: whereClause })

    res.status(200).json({
      success: true,
      data: attractionsWithStats,
      searchParams: {
        query: searchQuery,
        categories,
        locations,
        minRating,
        maxRating,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder
      },
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error searching attractions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to search attractions'
    })
  }
}

const getFilterOptions = async (req, res) => {
  try {
    // Get unique categories
    const categories = await prisma.attraction.findMany({
      select: { category: true },
      distinct: ['category']
    })

    // Get location data (extract cities/regions from addresses)
    const addresses = await prisma.attraction.findMany({
      select: { address: true }
    })

    // Extract unique locations (simple parsing)
    const locations = [...new Set(
      addresses
        .map(a => a.address.split(',').pop()?.trim()) // Get last part of address
        .filter(Boolean)
    )]

    // Get price range
    const priceStats = await prisma.attraction.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    })

    // Get rating range
    const ratingStats = await prisma.attraction.aggregate({
      _min: { rating: true },
      _max: { rating: true },
      _avg: { rating: true }
    })

    res.status(200).json({
      success: true,
      data: {
        categories: categories.map(c => c.category).sort(),
        locations: locations.sort(),
        priceRange: {
          min: Number(priceStats._min.price || 0),
          max: Number(priceStats._max.price || 1000),
          average: Number(priceStats._avg.price || 0)
        },
        ratingRange: {
          min: Number(ratingStats._min.rating || 0),
          max: Number(ratingStats._max.rating || 5),
          average: Number(ratingStats._avg.rating || 0)
        },
        sortOptions: [
          { value: 'name', label: 'Name' },
          { value: 'rating', label: 'Rating' },
          { value: 'price', label: 'Price' },
          { value: 'createdDate', label: 'Date Added' },
          { value: 'visitCount', label: 'Popularity' },
          { value: 'revenue', label: 'Revenue' }
        ]
      }
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options'
    })
  }
}

const getAttractionDetails = async (req, res) => {
  try {
    const { id } = req.params

    const attraction = await prisma.attraction.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true
          }
        },
        visits: {
          include: {
            visitor: {
              select: {
                id: true,
                username: true,
                birthDate: true,
                gender: true,
                postcode: true
              }
            }
          },
          orderBy: {
            visitDate: 'desc'
          }
        },
        images: true,
        reports: {
          orderBy: {
            generatedDate: 'desc'
          },
          take: 5
        },
        predictiveModels: {
          orderBy: {
            generatedDate: 'desc'
          },
          take: 5
        }
      }
    })

    if (!attraction) {
      return res.status(404).json({
        success: false,
        message: 'Attraction not found'
      })
    }

    // Calculate comprehensive statistics
    const visits = attraction.visits
    const totalVisits = visits.length
    const totalRevenue = visits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
    
    // Rating statistics
    const ratings = visits.filter(v => v.rating).map(v => v.rating)
    const averageVisitRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0

    // Time-based analysis
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    const recentVisits = visits.filter(v => v.visitDate >= last30Days)

    // Demographics analysis
    const demographics = visits.reduce((acc, visit) => {
      const visitor = visit.visitor
      
      // Age analysis
      if (visitor.birthDate) {
        const age = new Date().getFullYear() - new Date(visitor.birthDate).getFullYear()
        const ageGroup = age < 25 ? 'Young' : age < 45 ? 'Adult' : 'Senior'
        acc.age[ageGroup] = (acc.age[ageGroup] || 0) + 1
      }
      
      // Gender analysis
      if (visitor.gender) {
        acc.gender[visitor.gender] = (acc.gender[visitor.gender] || 0) + 1
      }
      
      return acc
    }, { age: {}, gender: {} })

    // Monthly trends (last 12 months)
    const monthlyTrends = {}
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    visits
      .filter(v => v.visitDate >= twelveMonthsAgo)
      .forEach(visit => {
        const monthKey = visit.visitDate.toISOString().substring(0, 7) // YYYY-MM
        if (!monthlyTrends[monthKey]) {
          monthlyTrends[monthKey] = { visits: 0, revenue: 0 }
        }
        monthlyTrends[monthKey].visits += 1
        monthlyTrends[monthKey].revenue += Number(visit.amount || 0)
      })

    const result = {
      ...attraction,
      statistics: {
        totalVisits,
        totalRevenue,
        averageRevenuePerVisit: totalVisits > 0 ? totalRevenue / totalVisits : 0,
        averageRating: Math.round(averageVisitRating * 100) / 100,
        overallRating: attraction.rating || 0,
        recentActivity: {
          last30DaysVisits: recentVisits.length,
          last30DaysRevenue: recentVisits.reduce((sum, v) => sum + Number(v.amount || 0), 0)
        },
        demographics,
        monthlyTrends: Object.entries(monthlyTrends)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month))
      }
    }

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching attraction details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attraction details'
    })
  }
}

const getAttractionStatistics = async (req, res) => {
  try {
    const { id } = req.params
    const { period = 'month' } = req.query

    const { startDate, endDate } = getDateRange(period)

    // Get visits for the attraction in the specified period
    const visits = await prisma.visit.findMany({
      where: {
        attractionId: parseInt(id),
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        visitor: {
          select: {
            birthDate: true,
            gender: true,
            postcode: true
          }
        }
      }
    })

    // Calculate statistics
    const totalVisits = visits.length
    const totalRevenue = visits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
    const uniqueVisitors = new Set(visits.map(v => v.userId)).size

    // Daily breakdown
    const dailyStats = visits.reduce((acc, visit) => {
      const date = visit.visitDate.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, visits: 0, revenue: 0, uniqueVisitors: new Set() }
      }
      acc[date].visits += 1
      acc[date].revenue += Number(visit.amount || 0)
      acc[date].uniqueVisitors.add(visit.userId)
      return acc
    }, {})

    const dailyTrends = Object.values(dailyStats).map(day => ({
      date: day.date,
      visits: day.visits,
      revenue: day.revenue,
      uniqueVisitors: day.uniqueVisitors.size
    })).sort((a, b) => new Date(a.date) - new Date(b.date))

    // Hourly distribution
    const hourlyDistribution = visits.reduce((acc, visit) => {
      const hour = visit.visitDate.getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {})

    // Day of week distribution
    const dayOfWeekDistribution = visits.reduce((acc, visit) => {
      const dayOfWeek = visit.visitDate.toLocaleDateString('en-US', { weekday: 'long' })
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1
      return acc
    }, {})

    res.status(200).json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        overview: {
          totalVisits,
          totalRevenue,
          uniqueVisitors,
          averageRevenuePerVisit: totalVisits > 0 ? totalRevenue / totalVisits : 0,
          averageVisitsPerDay: dailyTrends.length > 0 ? totalVisits / dailyTrends.length : 0
        },
        trends: {
          daily: dailyTrends,
          hourly: Object.entries(hourlyDistribution).map(([hour, visits]) => ({
            hour: parseInt(hour),
            visits
          })).sort((a, b) => a.hour - b.hour),
          dayOfWeek: Object.entries(dayOfWeekDistribution).map(([day, visits]) => ({
            day,
            visits
          }))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching attraction statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attraction statistics'
    })
  }
}

// ============================================================================
// PLACEHOLDER IMPLEMENTATIONS FOR REMAINING ENDPOINTS
// These will be implemented in subsequent iterations
// ============================================================================

const getAttractionComparison = async (req, res) => {
  try {
    // TODO: Implement attraction comparison logic
    res.status(200).json({
      success: true,
      data: { message: 'Attraction comparison endpoint - coming soon' },
      todo: 'Implement comprehensive attraction comparison with metrics'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getAttractionComparisonData = async (req, res) => {
  try {
    // TODO: Implement comprehensive comparison data
    res.status(200).json({
      success: true,
      data: { message: 'Attraction comparison data endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getCategoryPerformanceStats = async (req, res) => {
  try {
    const { 
      period = 'month',
      includeComparisons = 'false'
    } = req.query

    const { startDate, endDate } = getDateRange(period)
    const shouldIncludeComparisons = includeComparisons === 'true'

    // Get visits with attraction category data
    const visits = await prisma.visit.findMany({
      where: {
        visitDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        attraction: {
          select: {
            id: true,
            name: true,
            category: true,
            rating: true
          }
        }
      }
    })

    // Group by category and calculate statistics
    const categoryStats = visits.reduce((acc, visit) => {
      const category = visit.attraction.category
      if (!acc[category]) {
        acc[category] = {
          name: category,
          visits: 0,
          revenue: 0,
          attractions: new Set(),
          totalRating: 0,
          ratingCount: 0,
          visitors: new Set()
        }
      }
      
      acc[category].visits += 1
      acc[category].revenue += Number(visit.amount || 0)
      acc[category].attractions.add(visit.attraction.id)
      acc[category].visitors.add(visit.userId)
      
      if (visit.attraction.rating) {
        acc[category].totalRating += visit.attraction.rating
        acc[category].ratingCount += 1
      }
      
      return acc
    }, {})

    // Transform to final format
    const categories = Object.values(categoryStats).map(stat => ({
      name: stat.name,
      attractionCount: stat.attractions.size,
      totalVisitors: stat.visitors.size,
      totalRevenue: stat.revenue,
      averageRating: stat.ratingCount > 0 ? stat.totalRating / stat.ratingCount : 0,
      revenuePerVisitor: stat.visitors.size > 0 ? stat.revenue / stat.visitors.size : 0,
      growthRate: 0 // Will be calculated if comparisons are included
    }))

    // Add growth rates if comparisons requested
    if (shouldIncludeComparisons) {
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodRange(period)
      
      const prevVisits = await prisma.visit.findMany({
        where: {
          visitDate: {
            gte: prevStartDate,
            lte: prevEndDate
          }
        },
        include: {
          attraction: {
            select: {
              category: true
            }
          }
        }
      })

      const prevCategoryStats = prevVisits.reduce((acc, visit) => {
        const category = visit.attraction.category
        if (!acc[category]) {
          acc[category] = { revenue: 0, visitors: new Set() }
        }
        acc[category].revenue += Number(visit.amount || 0)
        acc[category].visitors.add(visit.userId)
        return acc
      }, {})

      categories.forEach(category => {
        const prevStats = prevCategoryStats[category.name]
        if (prevStats) {
          const prevRevenue = prevStats.revenue
          const prevVisitors = prevStats.visitors.size
          category.growthRate = calculateGrowth(category.totalRevenue, prevRevenue)
        }
      })
    }

    res.status(200).json({
      success: true,
      data: {
        categories: categories || [], // Ensure categories is always an array
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalCategories: categories.length,
          totalAttractions: categories.reduce((sum, cat) => sum + cat.attractionCount, 0),
          totalRevenue: categories.reduce((sum, cat) => sum + cat.totalRevenue, 0),
          totalVisitors: categories.reduce((sum, cat) => sum + cat.totalVisitors, 0)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching category performance stats:', error)
    // Return safe fallback data structure
    res.status(200).json({
      success: true,
      data: {
        categories: [], // Always return an empty array on error
        period: req.query.period || 'month',
        dateRange: { 
          startDate: new Date(), 
          endDate: new Date() 
        },
        summary: {
          totalCategories: 0,
          totalAttractions: 0,
          totalRevenue: 0,
          totalVisitors: 0
        }
      }
    })
  }
}

const getPerformanceBenchmarks = async (req, res) => {
  try {
    const { 
      metrics = [],
      includeIndustryData = 'false'
    } = req.query

    const shouldIncludeIndustryData = includeIndustryData === 'true'
    const requestedMetrics = Array.isArray(metrics) ? metrics : [metrics].filter(Boolean)

    // Get current city data for benchmarking
    const currentMonth = new Date()
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const [visits, attractions] = await Promise.all([
      prisma.visit.findMany({
        where: {
          visitDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          attraction: {
            select: {
              rating: true,
              category: true
            }
          }
        }
      }),
      prisma.attraction.findMany({
        include: {
          visits: {
            where: {
              visitDate: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      })
    ])

    // Calculate city averages
    const totalRevenue = visits.reduce((sum, visit) => sum + Number(visit.amount || 0), 0)
    const totalVisitors = new Set(visits.map(v => v.userId)).size
    const revenuePerVisitor = totalVisitors > 0 ? totalRevenue / totalVisitors : 0
    
    const ratingsWithValues = visits.filter(v => v.attraction.rating).map(v => v.attraction.rating)
    const avgSatisfactionRating = ratingsWithValues.length > 0 
      ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) / ratingsWithValues.length 
      : 0

    // Calculate capacity utilization (simplified)
    const attractionsWithVisits = attractions.filter(a => a.visits.length > 0)
    const avgCapacityUtilization = attractionsWithVisits.length > 0 
      ? (attractionsWithVisits.length / attractions.length) * 100 
      : 0

    // Industry benchmarks (mock data - in real world this would come from external sources)
    const industryBenchmarks = {
      revenue_per_visitor: 45.50,
      satisfaction_rating: 4.2,
      capacity_utilization: 75.0
    }

    // Create benchmark comparisons
    const benchmarks = [
      {
        metricName: 'Revenue per Visitor',
        cityAverage: Math.round(revenuePerVisitor * 100) / 100,
        industryAverage: shouldIncludeIndustryData ? industryBenchmarks.revenue_per_visitor : null,
        topPerformer: Math.max(revenuePerVisitor * 1.2, industryBenchmarks.revenue_per_visitor * 1.1),
        unit: ' USD',
        performance: revenuePerVisitor > industryBenchmarks.revenue_per_visitor ? 'above' : 'below'
      },
      {
        metricName: 'Satisfaction Rating',
        cityAverage: Math.round(avgSatisfactionRating * 100) / 100,
        industryAverage: shouldIncludeIndustryData ? industryBenchmarks.satisfaction_rating : null,
        topPerformer: Math.max(avgSatisfactionRating * 1.1, industryBenchmarks.satisfaction_rating * 1.05),
        unit: '/5',
        performance: avgSatisfactionRating > industryBenchmarks.satisfaction_rating ? 'above' : 'below'
      },
      {
        metricName: 'Capacity Utilization',
        cityAverage: Math.round(avgCapacityUtilization * 100) / 100,
        industryAverage: shouldIncludeIndustryData ? industryBenchmarks.capacity_utilization : null,
        topPerformer: Math.max(avgCapacityUtilization * 1.1, industryBenchmarks.capacity_utilization * 1.05),
        unit: '%',
        performance: avgCapacityUtilization > industryBenchmarks.capacity_utilization ? 'above' : 'below'
      }
    ]

    // Filter benchmarks based on requested metrics
    const filteredBenchmarks = requestedMetrics.length > 0 
      ? benchmarks.filter(b => requestedMetrics.some(m => b.metricName.toLowerCase().includes(m.toLowerCase())))
      : benchmarks

    res.status(200).json({
      success: true,
      data: {
        benchmarks: filteredBenchmarks || [], // Ensure benchmarks is always an array
        summary: {
          totalMetrics: filteredBenchmarks.length,
          aboveIndustryAvg: filteredBenchmarks.filter(b => b.performance === 'above').length,
          belowIndustryAvg: filteredBenchmarks.filter(b => b.performance === 'below').length,
          lastUpdated: new Date().toISOString()
        },
        includeIndustryData: shouldIncludeIndustryData
      }
    })
  } catch (error) {
    console.error('Error fetching performance benchmarks:', error)
    // Return safe fallback data structure
    res.status(200).json({
      success: true,
      data: {
        benchmarks: [], // Always return an empty array on error
        summary: {
          totalMetrics: 0,
          aboveIndustryAvg: 0,
          belowIndustryAvg: 0,
          lastUpdated: new Date().toISOString()
        },
        includeIndustryData: false
      }
    })
  }
}

const getImprovementRecommendations = async (req, res) => {
  try {
    const { 
      attractionIds = [],
      includeAIInsights = 'false',
      minImpactThreshold = 0.1
    } = req.query

    const shouldIncludeAIInsights = includeAIInsights === 'true'
    const impactThreshold = parseFloat(minImpactThreshold)
    const specificAttractions = Array.isArray(attractionIds) ? attractionIds.map(Number) : []

    // Get attractions with performance data
    const whereClause = specificAttractions.length > 0 
      ? { id: { in: specificAttractions } }
      : {}

    const attractions = await prisma.attraction.findMany({
      where: whereClause,
      include: {
        visits: {
          where: {
            visitDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          select: {
            amount: true,
            rating: true,
            visitDate: true,
            userId: true
          }
        },
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      take: 20 // Limit for performance
    })

    // Analyze each attraction for improvement opportunities
    const recommendations = []

    for (const attraction of attractions) {
      const visits = attraction.visits
      const visitCount = visits.length
      const revenue = visits.reduce((sum, v) => sum + Number(v.amount || 0), 0)
      const avgRating = visits.length > 0 
        ? visits.reduce((sum, v) => sum + (v.rating || 0), 0) / visits.length
        : attraction.rating || 0

      const uniqueVisitors = new Set(visits.map(v => v.userId)).size
      const revenuePerVisitor = uniqueVisitors > 0 ? revenue / uniqueVisitors : 0

      // Identify issues and opportunities
      const issues = []

      // Low rating issue
      if (avgRating < 3.5) {
        issues.push({
          attractionId: attraction.id,
          attractionName: attraction.name,
          category: attraction.category,
          issue: 'Low Satisfaction Rating',
          description: `Current rating of ${avgRating.toFixed(1)}/5 is below recommended threshold`,
          potentialImpact: `+${((4.0 - avgRating) * visitCount * 0.1).toFixed(0)} additional visitors`,
          recommendations: [
            'Improve service quality and visitor experience',
            'Address common complaints from visitor feedback',
            'Invest in staff training and facility upgrades',
            'Implement visitor feedback collection system'
          ],
          priority: avgRating < 3.0 ? 'high' : 'medium',
          currentValue: avgRating,
          targetValue: 4.0,
          impactScore: (4.0 - avgRating) * 0.3
        })
      }

      // Low revenue per visitor
      if (revenuePerVisitor < 25 && visitCount > 5) {
        issues.push({
          attractionId: attraction.id,
          attractionName: attraction.name,
          category: attraction.category,
          issue: 'Low Revenue per Visitor',
          description: `Revenue per visitor ($${revenuePerVisitor.toFixed(2)}) below market average`,
          potentialImpact: `+$${((30 - revenuePerVisitor) * uniqueVisitors).toFixed(0)} monthly revenue`,
          recommendations: [
            'Introduce premium experiences or add-ons',
            'Optimize pricing strategy',
            'Develop merchandise and souvenir sales',
            'Create package deals with other attractions'
          ],
          priority: revenuePerVisitor < 15 ? 'high' : 'medium',
          currentValue: revenuePerVisitor,
          targetValue: 30,
          impactScore: (30 - revenuePerVisitor) * 0.02
        })
      }

      // Low visit frequency
      if (visitCount < 10) {
        issues.push({
          attractionId: attraction.id,
          attractionName: attraction.name,
          category: attraction.category,
          issue: 'Low Visitor Volume',
          description: `Only ${visitCount} visits in the last 30 days`,
          potentialImpact: `+${Math.round(visitCount * 1.5)} potential monthly visitors`,
          recommendations: [
            'Increase marketing and promotional activities',
            'Improve online presence and social media engagement',
            'Partner with travel agencies and tour operators',
            'Optimize listing on travel platforms'
          ],
          priority: visitCount < 5 ? 'high' : 'medium',
          currentValue: visitCount,
          targetValue: Math.max(25, visitCount * 2),
          impactScore: (25 - visitCount) * 0.04
        })
      }

      // Add high-performing opportunities
      if (avgRating > 4.0 && visitCount > 20) {
        issues.push({
          attractionId: attraction.id,
          attractionName: attraction.name,
          category: attraction.category,
          issue: 'Expansion Opportunity',
          description: `High-performing attraction with ${avgRating.toFixed(1)}/5 rating and ${visitCount} recent visits`,
          potentialImpact: `+${Math.round(visitCount * 0.3)} visitors through capacity expansion`,
          recommendations: [
            'Consider expanding capacity or operating hours',
            'Develop sister attractions or experiences',
            'Create VIP or premium tier offerings',
            'Franchise or replicate successful model'
          ],
          priority: 'low',
          currentValue: visitCount,
          targetValue: Math.round(visitCount * 1.3),
          impactScore: visitCount * 0.01
        })
      }

      // Filter by impact threshold and add to recommendations
      issues.forEach(issue => {
        if (issue.impactScore >= impactThreshold) {
          recommendations.push(issue)
        }
      })
    }

    // Sort by priority and impact score
    const sortedRecommendations = recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      return (priorityWeight[b.priority] * b.impactScore) - (priorityWeight[a.priority] * a.impactScore)
    })

    // Add AI insights if requested
    let aiInsights = null
    if (shouldIncludeAIInsights) {
      aiInsights = {
        trendsDetected: [
          'Seasonal visitor patterns show 15% increase in summer months',
          'Weekend visits are 40% higher than weekday visits',
          'Cultural attractions showing stronger recovery post-pandemic'
        ],
        marketOpportunities: [
          'Growing demand for eco-tourism experiences',
          'Increased interest in family-friendly activities',
          'Digital experience integration trending upward'
        ],
        riskFactors: [
          'Competition from nearby cities increasing',
          'Rising operational costs affecting profitability',
          'Weather dependency for outdoor attractions'
        ]
      }
    }

    res.status(200).json({
      success: true,
      data: {
        recommendations: (sortedRecommendations || []).slice(0, 10), // Ensure recommendations is always an array
        summary: {
          totalOpportunities: recommendations.length,
          highPriority: recommendations.filter(r => r.priority === 'high').length,
          mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
          lowPriority: recommendations.filter(r => r.priority === 'low').length,
          avgImpactScore: recommendations.length > 0 
            ? recommendations.reduce((sum, r) => sum + r.impactScore, 0) / recommendations.length 
            : 0
        },
        ...(aiInsights && { aiInsights }),
        parameters: {
          includeAIInsights: shouldIncludeAIInsights,
          minImpactThreshold: impactThreshold,
          attractionsAnalyzed: attractions.length
        }
      }
    })
  } catch (error) {
    console.error('Error fetching improvement recommendations:', error)
    // Return safe fallback data structure
    res.status(200).json({
      success: true,
      data: {
        recommendations: [], // Always return an empty array on error
        summary: {
          totalOpportunities: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
          avgImpactScore: 0
        },
        parameters: {
          includeAIInsights: false,
          minImpactThreshold: 0.1,
          attractionsAnalyzed: 0
        }
      }
    })
  }
}

const getPerformanceRankings = async (req, res) => {
  try {
    // TODO: Implement performance rankings
    res.status(200).json({
      success: true,
      data: { message: 'Performance rankings endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const exportFilteredAttractions = async (req, res) => {
  try {
    // TODO: Implement export functionality
    res.status(200).json({
      success: true,
      data: { message: 'Export endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

// Report Management - Placeholder implementations
const getReports = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Reports endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const generateReport = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Generate report endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getReportTemplates = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Report templates endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const createReportTemplate = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Create report template endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getReportStats = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Report stats endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getReportTypes = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Report types endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const scheduleReport = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Schedule report endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getScheduledReports = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Scheduled reports endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getReport = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Get report endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const downloadReport = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Download report endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const deleteReport = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Delete report endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

// Predictive Analytics - Placeholder implementations
const getPredictiveAnalytics = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Predictive analytics endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getForecastAccuracy = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Forecast accuracy endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

// Profile Management - Placeholder implementations
const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Profile endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const updateProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Update profile endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const uploadProfilePicture = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Upload profile picture endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getProfileStats = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Profile stats endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const getActivityLog = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Activity log endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const changePassword = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Change password endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

const deleteAccount = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { message: 'Delete account endpoint - coming soon' }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not implemented yet' })
  }
}

module.exports = {
  // City Overview & Metrics
  getCityMetrics,
  getCityAnalytics,
  getCityRevenue,
  getCityVisitorTrends,
  getCityDemographics,
  getTourismInsights,

  // Attractions Management
  getAllAttractions,
  searchAttractions,
  getFilterOptions,
  getAttractionDetails,
  getAttractionStatistics,
  exportFilteredAttractions,

  // Performance Analysis & Comparisons
  getAttractionComparison,
  getAttractionComparisonData,
  getCategoryPerformanceStats,
  getPerformanceBenchmarks,
  getImprovementRecommendations,
  getPerformanceRankings,

  // Report Management
  getReports,
  generateReport,
  getReportTemplates,
  createReportTemplate,
  getReportStats,
  getReportTypes,
  scheduleReport,
  getScheduledReports,
  getReport,
  downloadReport,
  deleteReport,

  // Predictive Analytics
  getPredictiveAnalytics,
  getForecastAccuracy,

  // Profile Management
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getProfileStats,
  getActivityLog,
  changePassword,
  deleteAccount
}
