"use client"

import { useState, useEffect } from "react"
import { Users, DollarSign, Clock, Star, TrendingUp, Target, AlertCircle, Loader2 } from "lucide-react"
import { MetricCard } from "@/components/metric-card"
import { AdvancedVisitorChart } from "@/components/charts/advanced-visitor-chart"
import { InteractiveDonutChart } from "@/components/charts/interactive-donut-chart"
import { YearComparisonChart } from "@/components/charts/year-comparison-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ownerApi } from "@/lib/api"

interface PerformanceMetrics {
  totalVisitors: {
    value: number
    change: number
    period: string
  }
  revenue: {
    value: number
    change: number
    period: string
  }
  avgDuration: {
    value: number
    change: number
    period: string
  }
  rating: {
    value: number
    change: number
    period: string
  }
  growthRate: {
    value: number
    change: number
    period: string
  }
  capacity: {
    value: number
    change: number
    period: string
  }
}

interface DailyHighlights {
  highlights: Array<{
    type: 'success' | 'info' | 'warning'
    message: string
    color: string
  }>
  metrics: {
    repeatVisitors: number
    averageSpend: number
    peakHour: string
    conversionRate: number
  }
}

interface MobileSummary {
  visitorAnalytics: {
    dailyVisitors: number
    growth: number
    peakHours: string
  }
  revenueInsights: {
    todayRevenue: number
    growth: number
    avgSpend: number
  }
  performance: {
    capacity: number
    satisfaction: number
    visitDuration: number
  }
  highlights: {
    growthRate: number
    newRecord: string
    repeatVisitors: number
  }
}

export function PerformanceOverview() {
  const [attraction, setAttraction] = useState<any>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [highlights, setHighlights] = useState<DailyHighlights | null>(null)
  const [mobileSummary, setMobileSummary] = useState<MobileSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchPerformanceData()
  }, [selectedPeriod])

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get attraction first
      const attractionResponse = await ownerApi.getMyAttraction()
      if (!attractionResponse.success || !attractionResponse.data) {
        setError("No attraction found")
        return
      }

      const attractionData = attractionResponse.data
      setAttraction(attractionData)

      // Fetch all performance data in parallel
      const [
        metricsResponse,
        highlightsResponse,
        analyticsResponse,
      ] = await Promise.all([
        ownerApi.getPerformanceMetrics(attractionData.id, { 
          period: selectedPeriod, 
          includeComparisons: true 
        }),
        ownerApi.getDailyHighlights(attractionData.id),
        ownerApi.getAttractionAnalytics(attractionData.id, { 
          period: selectedPeriod === 'today' ? 'day' : selectedPeriod === 'year' ? 'month' : selectedPeriod as 'week' | 'month' | 'day'
        }),
      ])

      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data)
      }

      if (highlightsResponse.success && highlightsResponse.data) {
        setHighlights(highlightsResponse.data)
      }

      if (analyticsResponse.success && analyticsResponse.data) {
        // Transform analytics data for mobile summary
        const analyticsData = analyticsResponse.data
        setMobileSummary({
          visitorAnalytics: {
            dailyVisitors: analyticsData.dailyVisitors || 0,
            growth: analyticsData.visitorGrowth || 0,
            peakHours: analyticsData.peakHours || "10 AM - 2 PM"
          },
          revenueInsights: {
            todayRevenue: analyticsData.todayRevenue || 0,
            growth: analyticsData.revenueGrowth || 0,
            avgSpend: analyticsData.avgSpend || 0
          },
          performance: {
            capacity: analyticsData.capacityUtilization || 0,
            satisfaction: attractionData.rating || 0,
            visitDuration: analyticsData.avgVisitDuration || 0
          },
          highlights: {
            growthRate: analyticsData.growthRate || 0,
            newRecord: analyticsData.newRecord || "N/A",
            repeatVisitors: analyticsData.repeatVisitors || 0
          }
        })
      }

    } catch (err) {
      console.error("Error fetching performance data:", err)
      setError(err instanceof Error ? err.message : "Failed to load performance data")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getMetricCards = () => {
    if (!metrics) return []

    return [
      {
        title: "Total Visitors",
        value: formatNumber(metrics.totalVisitors.value),
        change: `${formatPercentage(metrics.totalVisitors.change)} from last ${metrics.totalVisitors.period}`,
        trend: metrics.totalVisitors.change >= 0 ? "up" as const : "down" as const,
        icon: Users,
        gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      },
      {
        title: "Revenue",
        value: formatCurrency(metrics.revenue.value),
        change: `${formatPercentage(metrics.revenue.change)} from last ${metrics.revenue.period}`,
        trend: metrics.revenue.change >= 0 ? "up" as const : "down" as const,
        icon: DollarSign,
        gradient: "bg-gradient-to-br from-green-500 to-green-600",
      },
      {
        title: "Avg. Visit Duration",
        value: `${metrics.avgDuration.value.toFixed(1)} hrs`,
        change: `${formatPercentage(metrics.avgDuration.change)} from last ${metrics.avgDuration.period}`,
        trend: metrics.avgDuration.change >= 0 ? "up" as const : "down" as const,
        icon: Clock,
        gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      },
      {
        title: "Customer Rating",
        value: `${metrics.rating.value.toFixed(1)}/5`,
        change: `${formatPercentage(metrics.rating.change)} from last ${metrics.rating.period}`,
        trend: metrics.rating.change >= 0 ? "up" as const : "down" as const,
        icon: Star,
        gradient: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      },
      {
        title: "Growth Rate",
        value: formatPercentage(metrics.growthRate.value),
        change: `${formatPercentage(metrics.growthRate.change)} from last ${metrics.growthRate.period}`,
        trend: metrics.growthRate.change >= 0 ? "up" as const : "down" as const,
        icon: TrendingUp,
        gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      },
      {
        title: "Capacity",
        value: `${metrics.capacity.value.toFixed(0)}%`,
        change: `${formatPercentage(metrics.capacity.change)} from last ${metrics.capacity.period}`,
        trend: metrics.capacity.change >= 0 ? "up" as const : "down" as const,
        icon: Target,
        gradient: "bg-gradient-to-br from-red-500 to-red-600",
      },
    ]
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading performance data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={fetchPerformanceData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // No attraction state
  if (!attraction) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Attraction Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create an attraction to view performance metrics.
        </p>
      </div>
    )
  }

  const attractionMetrics = getMetricCards()

// Mobile summary cards to replace complex charts
const MobileSummaryCards = ({ data }: { data: MobileSummary | null }) => {
  if (!data) return null

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:hidden">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Visitor Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Daily Visitors</span>
              <span className="font-semibold text-blue-600">{data.visitorAnalytics.dailyVisitors.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Growth</span>
              <span className={`font-semibold ${data.visitorAnalytics.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.visitorAnalytics.growth > 0 ? '+' : ''}{data.visitorAnalytics.growth.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Peak Hours</span>
              <span className="font-semibold">{data.visitorAnalytics.peakHours}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Advanced visitor trend analysis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-purple-600" />
            Revenue Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Today's Revenue</span>
              <span className="font-semibold text-purple-600">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(data.revenueInsights.todayRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Growth</span>
              <span className={`font-semibold ${data.revenueInsights.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.revenueInsights.growth > 0 ? '+' : ''}{data.revenueInsights.growth.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Spend</span>
              <span className="font-semibold">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(data.revenueInsights.avgSpend)}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Revenue performance tracking</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Capacity</span>
              <span className="font-semibold text-green-600">{data.performance.capacity.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Satisfaction</span>
              <span className="font-semibold">{data.performance.satisfaction.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Visit Duration</span>
              <span className="font-semibold">{data.performance.visitDuration.toFixed(1)} hrs</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Operational efficiency metrics</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-600" />
            Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Growth Rate</span>
              <span className="font-semibold text-orange-600">
                {data.highlights.growthRate > 0 ? '+' : ''}{data.highlights.growthRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Record</span>
              <span className="font-semibold text-green-600">{data.highlights.newRecord}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Repeat Visitors</span>
              <span className="font-semibold">{data.highlights.repeatVisitors.toFixed(0)}%</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">Today's performance highlights</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

return (
  <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-6">
    {/* Period Selector */}
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor your attraction's key metrics</p>
      </div>
      <Select
        value={selectedPeriod}
        onValueChange={(value: 'today' | 'week' | 'month' | 'year') => setSelectedPeriod(value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Metrics Cards */}
    <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {attractionMetrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>

    {/* Mobile Summary Cards - Only visible on mobile */}
    <MobileSummaryCards data={mobileSummary} />

    {/* Desktop Charts - Hidden on mobile */}
    <div className="hidden md:block space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Charts Section */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2 min-h-0">
          <AdvancedVisitorChart 
            attractionId={attraction?.id}
            period={selectedPeriod === 'today' ? 'week' : selectedPeriod === 'year' ? 'quarter' : selectedPeriod as 'week' | 'month' | 'quarter'}
            groupBy={selectedPeriod === 'today' ? 'day' : selectedPeriod === 'week' ? 'day' : 'month'}
          />
        </div>
        <div className="md:col-span-2 lg:col-span-1 min-h-0">
          <InteractiveDonutChart 
            attractionId={attraction?.id}
            period={selectedPeriod === 'today' ? 'week' : selectedPeriod === 'year' ? 'quarter' : selectedPeriod as 'week' | 'month' | 'quarter'}
            breakdown="age"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="lg:col-span-1 min-h-0">
          <YearComparisonChart 
            attractionId={attraction?.id}
            metric="visitors"
          />
        </div>
        <div className="lg:col-span-1 grid gap-3 sm:gap-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 sm:p-4 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Today's Highlights</h3>
              <div className="space-y-2 sm:space-y-3">
                {highlights?.highlights.map((highlight, index) => (
                  <div key={index} className={`flex items-start gap-2 p-2 sm:p-3 rounded`} style={{
                    backgroundColor: highlight.type === 'success' ? 'rgb(240 253 244)' : 
                                   highlight.type === 'info' ? 'rgb(239 246 255)' : 
                                   'rgb(254 243 199)'
                  }}>
                    <div 
                      className={`w-2 h-2 rounded-full flex-shrink-0 mt-1`} 
                      style={{ backgroundColor: highlight.color }}
                    ></div>
                    <span className="text-xs sm:text-sm leading-tight">{highlight.message}</span>
                  </div>
                )) || (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No highlights available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 sm:p-4 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Performance Metrics</h3>
              <div className="space-y-2 sm:space-y-3">
                {highlights?.metrics ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Repeat Visitors</span>
                      <span className="text-xs sm:text-sm font-medium">{highlights.metrics.repeatVisitors.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Average Spend</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(highlights.metrics.averageSpend)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Peak Hour</span>
                      <span className="text-xs sm:text-sm font-medium">{highlights.metrics.peakHour}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="text-xs sm:text-sm font-medium text-green-600">{highlights.metrics.conversionRate.toFixed(1)}%</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No metrics available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
}

export default PerformanceOverview
