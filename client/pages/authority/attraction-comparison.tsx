"use client"

import { useState, useEffect } from "react"
import { AuthorityPerformanceRankingTable } from "@/components/charts/authority-performance-ranking-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Users, DollarSign, Star, AlertCircle, Loader2, RefreshCw, BarChart3, Target } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { authorityApi } from "@/lib/api"

interface CategoryStats {
  category: string
  count: number
  totalVisitors: number
  totalRevenue: number
  avgRating: number
  revenuePerVisitor: number
  growthRate?: number
}

interface BenchmarkData {
  metric: string
  industryAvg: number
  cityAvg: number
  topPerformer: number
  unit: string
}

interface ImprovementOpportunity {
  attractionId: number
  attractionName: string
  category: string
  issue: string
  description: string
  potentialImpact: string
  recommendations: string[]
  priority: 'high' | 'medium' | 'low'
}

interface ComparisonData {
  categoryStats: CategoryStats[]
  benchmarks: BenchmarkData[]
  opportunities: ImprovementOpportunity[]
  summary: {
    totalAttractions: number
    avgRating: number
    totalRevenue: number
    totalVisitors: number
  }
}

// Mobile summary cards to replace complex charts
const MobileSummaryCards = ({ 
  comparisonData, 
  isLoading 
}: { 
  comparisonData: ComparisonData | null
  isLoading: boolean 
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  if (!comparisonData) return null

  // Safely find top performer with fallback
  const categoryStats = comparisonData.categoryStats || []
  const topPerformer = categoryStats.length > 0 
    ? categoryStats.reduce((max, category) => 
        category.revenuePerVisitor > max.revenuePerVisitor ? category : max, 
        categoryStats[0]
      )
    : null

  // Safely find low capacity category with fallback
  const opportunities = comparisonData.opportunities || []
  const lowCapacityCategory = opportunities.find(opp => 
    opp.issue && opp.issue.toLowerCase().includes('capacity')
  )

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:hidden">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Top Performer</span>
              <span className="font-semibold text-blue-600">{topPerformer?.category || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Rating</span>
              <span className="font-semibold">{comparisonData.summary.avgRating.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-semibold text-green-600">
                ${(comparisonData.summary.totalRevenue / 1000).toFixed(1)}K
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Comprehensive attraction performance analysis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Category Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Top Category</span>
              <span className="font-semibold text-purple-600">{topPerformer?.category || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Attractions</span>
              <span className="font-semibold">{comparisonData.summary.totalAttractions} attractions</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Rating</span>
              <span className="font-semibold text-green-600">{comparisonData.summary.avgRating.toFixed(1)}/5</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Category-wise performance breakdown</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-green-600" />
            Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(comparisonData.benchmarks || []).slice(0, 3).map((benchmark, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{benchmark.metric}</span>
                <span className="font-semibold text-green-600">
                  {benchmark.topPerformer}{benchmark.unit}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Performance benchmarking insights</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-orange-600" />
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowCapacityCategory ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Issue</span>
                  <span className="font-semibold text-orange-600">{lowCapacityCategory.issue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Attraction</span>
                  <span className="font-semibold">{lowCapacityCategory.attractionName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Potential</span>
                  <span className="font-semibold text-green-600">{lowCapacityCategory.potentialImpact}</span>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                No immediate opportunities identified
              </div>
            )}
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">AI-generated improvement recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AttractionComparison() {
  const { user } = useAuth()
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [refreshing, setRefreshing] = useState(false)

  const fetchComparisonData = async () => {
    try {
      setError(null)
      
      console.log('AttractionComparison: Fetching comparison data with user:', user?.role?.roleName)

      // Check if user is authenticated and is an authority
      const isAuthorityUser = user && user.role?.roleName === 'AUTHORITY'
      
      if (isAuthorityUser) {
        // Fetch category performance stats with error handling
        const categoryResponse = await authorityApi.getCategoryPerformanceStats({
          period,
          includeComparisons: true
        }).catch(err => {
          console.log('AttractionComparison: Category API failed:', err.message)
          return { success: false, message: err.message, data: { categories: [] } }
        })

        // Fetch benchmarks with error handling
        const benchmarkResponse = await authorityApi.getPerformanceBenchmarks({
          metrics: ['revenue_per_visitor', 'satisfaction_rating', 'capacity_utilization'],
          includeIndustryData: true
        }).catch(err => {
          console.log('AttractionComparison: Benchmark API failed:', err.message)
          return { success: false, message: err.message, data: { benchmarks: [] } }
        })

        // Fetch improvement opportunities with error handling
        const opportunitiesResponse = await authorityApi.getImprovementRecommendations({
          includeAIInsights: true,
          minImpactThreshold: 0.1
        }).catch(err => {
          console.log('AttractionComparison: Opportunities API failed:', err.message)
          return { success: false, message: err.message, data: { recommendations: [] } }
        })

        // Fetch overall summary data with error handling
        const cityMetricsResponse = await authorityApi.getCityMetrics({
          period,
          includeComparisons: true
        }).catch(err => {
          console.log('AttractionComparison: City metrics API failed:', err.message)
          return { success: false, message: err.message, data: {} }
        })

        console.log('AttractionComparison: API responses:', {
          category: categoryResponse,
          benchmark: benchmarkResponse,
          opportunities: opportunitiesResponse,
          cityMetrics: cityMetricsResponse
        })

        if (categoryResponse.success && benchmarkResponse.success && 
            opportunitiesResponse.success && cityMetricsResponse.success) {
          
          // Process real API data
          const processedData = processApiResponsesForComparison(
            categoryResponse,
            benchmarkResponse,
            opportunitiesResponse,
            cityMetricsResponse
          )
          
          setComparisonData(processedData)
        } else {
          console.log('AttractionComparison: Some API calls failed, using fallback data')
          throw new Error("Some API calls failed")
        }
      } else {
        console.log('AttractionComparison: No authenticated authority user, using demo data')
        throw new Error("No authenticated user or not an authority user")
      }
    } catch (err) {
      console.error('Error fetching comparison data:', err)
      
      // Generate fallback demo data for display        console.log('AttractionComparison: Generating fallback demo data')
        const demoData = generateDemoComparisonData()
        setComparisonData(demoData)
      
      // Only set error if user is authenticated but API failed
      if (user && user.role?.roleName === 'AUTHORITY') {
        setError(err instanceof Error ? err.message : 'Failed to fetch comparison data')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Helper function to process API responses into ComparisonData format
  const processApiResponsesForComparison = (
    categoryResponse: any,
    benchmarkResponse: any,
    opportunitiesResponse: any,
    cityMetricsResponse: any
  ): ComparisonData => {
    console.log('Processing API responses for comparison data')

    // Process category stats
    const categoryStats: CategoryStats[] = (categoryResponse.data?.categories || []).map((cat: any) => ({
      category: cat.category || cat.name || 'Unknown',
      count: cat.attractionCount || cat.count || 0,
      totalVisitors: cat.totalVisitors || cat.visitors || 0,
      totalRevenue: cat.totalRevenue || cat.revenue || 0,
      avgRating: cat.averageRating || cat.rating || 0,
      revenuePerVisitor: cat.revenuePerVisitor || (cat.totalRevenue || 0) / Math.max(cat.totalVisitors || 1, 1),
      growthRate: cat.growthRate || cat.growth || 0
    }))

    // Process benchmarks
    const benchmarks: BenchmarkData[] = (benchmarkResponse.data?.benchmarks || []).map((bench: any) => ({
      metric: bench.metric || bench.name || 'Unknown',
      industryAvg: bench.industryAverage || bench.industryAvg || 0,
      cityAvg: bench.cityAverage || bench.cityAvg || 0,
      topPerformer: bench.topPerformer || bench.best || 0,
      unit: bench.unit || ''
    }))

    // Process opportunities
    const opportunities: ImprovementOpportunity[] = (opportunitiesResponse.data?.recommendations || []).map((opp: any) => ({
      attractionId: opp.attractionId || opp.id || 0,
      attractionName: opp.attractionName || opp.name || 'Unknown Attraction',
      category: opp.category || 'General',
      issue: opp.issue || opp.problem || 'Performance issue',
      description: opp.description || 'No description available',
      potentialImpact: opp.potentialImpact || opp.impact || 'Unknown impact',
      recommendations: opp.recommendations || opp.actions || [],
      priority: opp.priority || 'medium'
    }))

    // Process summary data
    const summary = {
      totalAttractions: cityMetricsResponse.data?.totalAttractions || categoryStats.reduce((sum, cat) => sum + cat.count, 0),
      avgRating: cityMetricsResponse.data?.averageRating || (categoryStats.reduce((sum, cat) => sum + cat.avgRating, 0) / Math.max(categoryStats.length, 1)),
      totalRevenue: cityMetricsResponse.data?.totalRevenue || categoryStats.reduce((sum, cat) => sum + cat.totalRevenue, 0),
      totalVisitors: cityMetricsResponse.data?.totalVisitors || categoryStats.reduce((sum, cat) => sum + cat.totalVisitors, 0)
    }

    return {
      categoryStats,
      benchmarks,
      opportunities,
      summary
    }
  }

  // Helper function to generate demo comparison data
  const generateDemoComparisonData = (): ComparisonData => {
    console.log('Generating demo comparison data')

    const categoryStats: CategoryStats[] = [
      {
        category: 'Museums',
        count: 12,
        totalVisitors: 45000,
        totalRevenue: 675000,
        avgRating: 4.2,
        revenuePerVisitor: 15.0,
        growthRate: 8.5
      },
      {
        category: 'Parks & Nature',
        count: 8,
        totalVisitors: 62000,
        totalRevenue: 310000,
        avgRating: 4.5,
        revenuePerVisitor: 5.0,
        growthRate: 12.3
      },
      {
        category: 'Historical Sites',
        count: 15,
        totalVisitors: 38000,
        totalRevenue: 570000,
        avgRating: 4.1,
        revenuePerVisitor: 15.0,
        growthRate: 5.2
      },
      {
        category: 'Entertainment',
        count: 6,
        totalVisitors: 28000,
        totalRevenue: 560000,
        avgRating: 4.3,
        revenuePerVisitor: 20.0,
        growthRate: -2.1
      }
    ]

    const benchmarks: BenchmarkData[] = [
      {
        metric: 'Revenue per Visitor',
        industryAvg: 12.50,
        cityAvg: 13.75,
        topPerformer: 20.0,
        unit: '$'
      },
      {
        metric: 'Satisfaction Rating',
        industryAvg: 3.8,
        cityAvg: 4.3,
        topPerformer: 4.5,
        unit: '/5'
      },
      {
        metric: 'Capacity Utilization',
        industryAvg: 65.0,
        cityAvg: 72.5,
        topPerformer: 85.0,
        unit: '%'
      }
    ]

    const opportunities: ImprovementOpportunity[] = [
      {
        attractionId: 1,
        attractionName: 'Central Art Museum',
        category: 'Museums',
        issue: 'Low Capacity Utilization',
        description: 'Operating at only 45% capacity during peak hours, indicating potential for increased visitor throughput.',
        potentialImpact: '+$125K annual revenue',
        recommendations: ['Extended hours', 'Group tour packages', 'Digital marketing'],
        priority: 'high'
      },
      {
        attractionId: 2,
        attractionName: 'Heritage Garden',
        category: 'Parks & Nature',
        issue: 'Seasonal Revenue Decline',
        description: 'Revenue drops 60% during winter months, suggesting need for year-round attractions.',
        potentialImpact: '+$85K winter revenue',
        recommendations: ['Indoor exhibits', 'Winter events', 'Greenhouse tours'],
        priority: 'medium'
      },
      {
        attractionId: 3,
        attractionName: 'Old Town Plaza',
        category: 'Historical Sites',
        issue: 'Below Average Rating',
        description: 'Visitor satisfaction at 3.6/5, below city average of 4.3/5.',
        potentialImpact: '+15% visitor retention',
        recommendations: ['Guided tours', 'Interactive displays', 'Facility upgrades'],
        priority: 'medium'
      }
    ]

    const summary = {
      totalAttractions: categoryStats.reduce((sum, cat) => sum + cat.count, 0),
      avgRating: categoryStats.reduce((sum, cat) => sum + cat.avgRating, 0) / categoryStats.length,
      totalRevenue: categoryStats.reduce((sum, cat) => sum + cat.totalRevenue, 0),
      totalVisitors: categoryStats.reduce((sum, cat) => sum + cat.totalVisitors, 0)
    }

    return {
      categoryStats,
      benchmarks,
      opportunities,
      summary
    }
  }

  useEffect(() => {
    fetchComparisonData()
  }, [user, period])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchComparisonData()
  }

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'quarter' | 'year') => {
    setPeriod(newPeriod)
    setLoading(true)
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Attraction Comparison</h1>
          <p className="text-sm text-muted-foreground">
            Compare performance across all attractions in your jurisdiction
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-1">
            {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange(p)}
                disabled={loading}
                className="capitalize"
              >
                {p}
              </Button>
            ))}
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            size="sm"
            variant="outline"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Category Overview */}
      {loading ? (
        <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (comparisonData && comparisonData.categoryStats && comparisonData.categoryStats.length > 0) ? (
        <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(comparisonData.categoryStats || []).map((stats) => (
            <Card key={stats.category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-medium truncate">
                  {stats.category}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {stats.count} attractions
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-1 flex-shrink-0" />
                    <span className="text-xs truncate">Visitors</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium flex-shrink-0">
                    {stats.totalVisitors.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-1 flex-shrink-0" />
                    <span className="text-xs truncate">Revenue</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium flex-shrink-0">
                    ${(stats.totalRevenue / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-1 flex-shrink-0" />
                    <span className="text-xs truncate">Avg Rating</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium flex-shrink-0">
                    {stats.avgRating.toFixed(1)}
                  </span>
                </div>
                {stats.growthRate !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-1 flex-shrink-0" />
                      <span className="text-xs truncate">Growth</span>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium flex-shrink-0 ${
                      stats.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.growthRate > 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No category data available for the selected period.
          </AlertDescription>
        </Alert>
      )}

      {/* Mobile Summary Cards */}
      <MobileSummaryCards comparisonData={comparisonData} isLoading={loading} />

      {/* Desktop Content - Hidden on mobile */}
      <div className="hidden md:block">
        {/* Performance Rankings Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <AuthorityPerformanceRankingTable
              period={period}
              metrics={['visitors', 'revenue', 'rating', 'capacity_utilization']}
            />
          )}
        </div>

        {/* Benchmarking Insights */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Performance Benchmarks Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base lg:text-lg">Performance Benchmarks</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Industry standards and best performers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (comparisonData && comparisonData.benchmarks && comparisonData.benchmarks.length > 0) ? (
                <div className="space-y-3 sm:space-y-4">
                  {(comparisonData.benchmarks || []).map((benchmark, index) => (
                    <div key={index} className="p-3 sm:p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm sm:text-base">
                          {benchmark.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <div className="text-muted-foreground">Industry Avg</div>
                          <div className="font-medium">
                            {benchmark.industryAvg.toFixed(2)}{benchmark.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">City Avg</div>
                          <div className="font-medium">
                            {benchmark.cityAvg.toFixed(2)}{benchmark.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Top Performer</div>
                          <div className="font-medium text-green-600">
                            {benchmark.topPerformer.toFixed(2)}{benchmark.unit}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No benchmark data available for the selected period.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Improvement Opportunities Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base lg:text-lg">Improvement Opportunities</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                AI-generated recommendations for underperforming attractions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (comparisonData && comparisonData.opportunities && comparisonData.opportunities.length > 0) ? (
                <div className="space-y-3 sm:space-y-4">
                  {(comparisonData.opportunities || []).slice(0, 3).map((opportunity, index) => (
                    <div 
                      key={index} 
                      className={`p-3 sm:p-4 border rounded-lg ${
                        opportunity.priority === 'high' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : opportunity.priority === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <h4 className={`font-medium mb-2 text-sm sm:text-base ${
                        opportunity.priority === 'high' 
                          ? 'text-red-800 dark:text-red-200'
                          : opportunity.priority === 'medium'
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : 'text-blue-800 dark:text-blue-200'
                      }`}>
                        {opportunity.attractionName} - {opportunity.issue}
                      </h4>
                      <p className={`text-xs sm:text-sm mb-3 leading-relaxed ${
                        opportunity.priority === 'high' 
                          ? 'text-red-700 dark:text-red-300'
                          : opportunity.priority === 'medium'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>
                        {opportunity.description}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Potential Impact:</span>
                        <span className="text-xs font-medium text-green-600">
                          {opportunity.potentialImpact}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {(opportunity.recommendations || []).slice(0, 3).map((rec, recIndex) => (
                          <Badge key={recIndex} variant="outline" className="text-xs">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No improvement opportunities identified at this time.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AttractionComparison