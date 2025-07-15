const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Copy the getDatabaseContextForAI function to test it directly
const getDatabaseContextForAI = async () => {
  try {
    console.log('🔍 Testing database context function...')
    
    // Get comprehensive database statistics and detailed data
    const [
      totalAttractions,
      totalVisits, 
      totalUsers,
      avgRating,
      totalRevenue,
      categories,
      attractionsByCategory,
      topAttractions,
      recentVisits,
      monthlyRevenue,
      categoryStats
    ] = await Promise.all([
      // Basic counts
      prisma.attraction.count(),
      prisma.visit.count(),
      prisma.user.count({ where: { role: { roleName: 'OWNER' } } }),
      
      // Aggregated data
      prisma.attraction.aggregate({
        _avg: { rating: true }
      }),
      prisma.visit.aggregate({
        _sum: { amount: true }
      }),
      
      // Detailed category data
      prisma.attraction.findMany({
        select: { category: true },
        distinct: ['category']
      }),
      
      // Attractions grouped by category with counts
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
      
      // Top performing attractions
      prisma.attraction.findMany({
        include: {
          _count: {
            select: {
              visits: true
            }
          }
        },
        orderBy: {
          visits: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      
      // Recent visit data for trends
      prisma.visit.findMany({
        select: {
          visitDate: true,
          amount: true,
          rating: true,
          attraction: {
            select: {
              name: true,
              category: true
            }
          }
        },
        orderBy: {
          visitDate: 'desc'
        },
        take: 50
      }),
      
      // Monthly revenue trends (last 6 months)
      prisma.visit.groupBy({
        by: ['visitDate'],
        _sum: {
          amount: true
        },
        _count: {
          id: true
        },
        where: {
          visitDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        orderBy: {
          visitDate: 'desc'
        }
      }),
      
      // Category performance statistics
      prisma.$queryRaw`
        SELECT 
          a.category,
          COUNT(a.id) as attraction_count,
          AVG(a.rating) as avg_rating,
          AVG(a.price) as avg_price,
          COUNT(v.id) as total_visits,
          SUM(v.amount) as total_revenue,
          AVG(v.rating) as avg_visit_rating
        FROM attraction a
        LEFT JOIN visit v ON a.id = v.attractionId
        GROUP BY a.category
        ORDER BY total_revenue DESC
      `
    ])

    console.log('📊 Raw Database Results:')
    console.log('- Total Attractions:', totalAttractions)
    console.log('- Total Visits:', totalVisits)
    console.log('- Total Users (OWNER role):', totalUsers)
    console.log('- Average Rating:', avgRating)
    console.log('- Total Revenue:', totalRevenue)
    console.log('- Categories:', categories?.length, categories)
    console.log('- Attractions by Category:', attractionsByCategory?.length)
    console.log('- Top Attractions:', topAttractions?.length)
    console.log('- Recent Visits:', recentVisits?.length)
    console.log('- Monthly Revenue entries:', monthlyRevenue?.length)
    console.log('- Category Stats:', categoryStats?.length)

    // Process monthly revenue data for trends
    const monthlyData = monthlyRevenue.reduce((acc, record) => {
      const month = record.visitDate.toISOString().substring(0, 7)
      if (!acc[month]) {
        acc[month] = { revenue: 0, visits: 0 }
      }
      acc[month].revenue += Number(record._sum.amount || 0)
      acc[month].visits += record._count.id
      return acc
    }, {})

    // Calculate category insights
    const categoryInsights = attractionsByCategory.map(cat => ({
      category: cat.category,
      count: cat._count.id,
      avgRating: Number(cat._avg.rating || 0).toFixed(1),
      avgPrice: Number(cat._avg.price || 0).toFixed(2),
      percentage: ((cat._count.id / totalAttractions) * 100).toFixed(1)
    }))

    // Build comprehensive context
    const context = {
      // Basic statistics
      totalAttractions,
      totalVisits,
      activeOwners: totalUsers,
      avgRating: Number(avgRating._avg.rating || 0).toFixed(1),
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      categories: categories.map(c => c.category),
      totalCategories: categories.length,
      
      // Detailed breakdown
      categoryBreakdown: categoryInsights,
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        attractionCount: Number(stat.attraction_count),
        avgRating: Number(stat.avg_rating || 0).toFixed(1),
        avgPrice: Number(stat.avg_price || 0).toFixed(2),
        totalVisits: Number(stat.total_visits),
        totalRevenue: Number(stat.total_revenue || 0),
        avgVisitRating: Number(stat.avg_visit_rating || 0).toFixed(1)
      })),
      
      // Top performers
      topAttractions: topAttractions.map(attraction => ({
        name: attraction.name,
        category: attraction.category,
        rating: attraction.rating,
        price: attraction.price,
        visitCount: attraction._count.visits
      })),
      
      // Trends and patterns
      monthlyTrends: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        visits: data.visits,
        avgRevenuePerVisit: data.visits > 0 ? (data.revenue / data.visits).toFixed(2) : 0
      })).sort((a, b) => a.month.localeCompare(b.month)),
      
      // Recent activity insights
      recentActivity: {
        lastWeekVisits: recentVisits.filter(v => 
          new Date(v.visitDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        avgRecentRating: recentVisits.length > 0 ? 
          (recentVisits.reduce((sum, v) => sum + (v.rating || 0), 0) / recentVisits.length).toFixed(1) : 0,
        topRecentCategories: recentVisits
          .reduce((acc, visit) => {
            const category = visit.attraction.category
            acc[category] = (acc[category] || 0) + 1
            return acc
          }, {})
      }
    }

    console.log('\n📋 Final Context Summary:')
    console.log('- Total Attractions:', context.totalAttractions)
    console.log('- Total Visits:', context.totalVisits)
    console.log('- Total Revenue:', context.totalRevenue)
    console.log('- Categories:', context.totalCategories)
    console.log('- Category Breakdown items:', context.categoryBreakdown?.length)
    console.log('- Top Attractions items:', context.topAttractions?.length)

    return context

  } catch (error) {
    console.error('❌ Error getting database context for AI:', error)
    
    // Fallback context
    return {
      totalAttractions: 0,
      totalVisits: 0,
      activeOwners: 0,
      avgRating: '0.0',
      totalRevenue: 0,
      categories: ['Cultural', 'Nature', 'Adventure', 'Historical', 'Urban'],
      totalCategories: 5,
      categoryBreakdown: [],
      categoryStats: [],
      topAttractions: [],
      monthlyTrends: [],
      recentActivity: {}
    }
  }
}

async function testDatabaseContext() {
  try {
    console.log('🚀 Testing Database Context Function\n')
    
    const context = await getDatabaseContextForAI()
    
    console.log('\n✅ Database context test completed!')
    console.log('\n📄 Full Context Object:')
    console.log(JSON.stringify(context, null, 2))
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseContext()
