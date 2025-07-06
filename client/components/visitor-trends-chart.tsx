"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, TrendingUp, Users, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ownerApi, authorityApi } from "@/lib/api"

interface VisitorTrendsChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  groupBy?: 'day' | 'week' | 'month'
  className?: string
  title?: string
  description?: string
  showRevenue?: boolean
  showComparisons?: boolean
}

interface TrendsData {
  period: string
  visitors: number
  revenue?: number
  date?: string
  growth?: number
  comparison?: number
}

const formatPeriodLabel = (period: string, groupBy?: string) => {
  if (groupBy === 'day') {
    // Format as MM/DD for daily data
    const date = new Date(period)
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
  } else if (groupBy === 'week') {
    // Format as Week X for weekly data
    return period.includes('Week') ? period : `Week ${period}`
  } else {
    // Format as month name or period for monthly/other data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIndex = parseInt(period) - 1
    return monthNames[monthIndex] || period
  }
}

export function VisitorTrendsChart({ 
  attractionId, 
  period = 'year', 
  groupBy = 'month',
  className = "",
  title,
  description,
  showRevenue = true,
  showComparisons = false
}: VisitorTrendsChartProps) {
  const { user } = useAuth()
  const [data, setData] = useState<TrendsData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch visitor trends data based on user role
  useEffect(() => {
    const fetchTrendsData = async () => {
      if (!user?.role?.roleName) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const userRole = user.role.roleName.toLowerCase()
        let response

        if (userRole === 'owner') {
          // Owner: Get visitor trends for their specific attraction
          if (!attractionId) {
            // If no attractionId provided, get user's attraction first
            const attractionResponse = await ownerApi.getMyAttraction()
            const userAttractionId = attractionResponse.data?.id
            
            if (!userAttractionId) {
              throw new Error('No attraction found for this owner')
            }
            
            response = await ownerApi.getVisitorTrendsData(userAttractionId, { 
              period, 
              groupBy,
              includeRevenue: showRevenue 
            })
          } else {
            response = await ownerApi.getVisitorTrendsData(attractionId, { 
              period, 
              groupBy,
              includeRevenue: showRevenue 
            })
          }
        } else if (userRole === 'authority') {
          // Authority: Get city-wide visitor trends across all attractions
          response = await authorityApi.getCityVisitorTrends({ 
            period, 
            groupBy,
            includeRevenue: showRevenue,
            includeComparisons: showComparisons 
          })
        } else {
          throw new Error('Invalid user role for visitor trends data')
        }

        if (response.data && response.data.trends) {
          // Transform API response to chart format
          const transformedData: TrendsData[] = response.data.trends.map((item: any) => ({
            period: formatPeriodLabel(item.period || item.date || item.label || item.name, groupBy),
            visitors: item.visitors || item.visitorCount || 0,
            revenue: showRevenue ? (item.revenue || item.amount || undefined) : undefined,
            date: item.date || item.period,
            growth: item.growth || item.growthRate || undefined,
            comparison: showComparisons ? (item.comparison || item.previousPeriod || undefined) : undefined
          }))
          
          setData(transformedData)
        } else if (response.data && Array.isArray(response.data)) {
          // Handle alternative response format
          const transformedData: TrendsData[] = response.data.map((item: any) => ({
            period: formatPeriodLabel(item.period || item.date || item.label || item.name, groupBy),
            visitors: item.visitors || item.visitorCount || 0,
            revenue: showRevenue ? (item.revenue || item.amount || undefined) : undefined,
            date: item.date || item.period,
            growth: item.growth || item.growthRate || undefined,
            comparison: showComparisons ? (item.comparison || item.previousPeriod || undefined) : undefined
          }))
          
          setData(transformedData)
        } else {
          // Fallback: create empty state
          setData([])
        }
      } catch (error) {
        console.error('Error fetching visitor trends data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load visitor trends data')
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendsData()
  }, [user?.role?.roleName, attractionId, period, groupBy, showRevenue, showComparisons])

  // Determine chart title and description based on context
  const getChartTitle = () => {
    if (title) return title
    
    const userRole = user?.role?.roleName?.toLowerCase()
    if (userRole === 'authority') {
      return 'City-wide Visitor Trends'
    }
    return 'Visitor Trends Over Time'
  }

  const getChartDescription = () => {
    if (description) return description
    
    const userRole = user?.role?.roleName?.toLowerCase()
    const periodText = period === 'week' ? 'Weekly' : 
                     period === 'month' ? 'Monthly' : 
                     period === 'quarter' ? 'Quarterly' : 'Yearly'
    const groupText = groupBy === 'day' ? 'daily' : 
                     groupBy === 'week' ? 'weekly' : 'monthly'
    
    if (userRole === 'authority') {
      return `${periodText} ${groupText} visitor count${showRevenue ? ' and revenue' : ''} trends across all city attractions`
    }
    return `${periodText} ${groupText} visitor count${showRevenue ? ' and revenue' : ''} trends`
  }

  // Calculate statistics
  const totalVisitors = data.reduce((sum, item) => sum + item.visitors, 0)
  const totalRevenue = showRevenue ? data.reduce((sum, item) => sum + (item.revenue || 0), 0) : 0
  const averageVisitors = data.length > 0 ? Math.round(totalVisitors / data.length) : 0
  const peakPeriod = data.length > 0 ? data.reduce((max, item) => item.visitors > max.visitors ? item : max, data[0]) : null

  if (isLoading) {
    return (
      <Card className={`col-span-2 ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading visitor trends data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`col-span-2 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getChartTitle()}
          </CardTitle>
          <CardDescription>{getChartDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={`col-span-2 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getChartTitle()}
          </CardTitle>
          <CardDescription>{getChartDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No visitor trends data available for the selected period
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Trends will appear once visitor data is collected over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`col-span-2 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {getChartTitle()}
        </CardTitle>
        <CardDescription>
          {getChartDescription()} • {totalVisitors.toLocaleString()} total visitors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            visitors: {
              label: "Visitors",
              color: "hsl(var(--chart-1))",
            },
            revenue: {
              label: "Revenue",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                className="text-muted-foreground"
                angle={groupBy === 'day' ? -45 : 0}
                textAnchor={groupBy === 'day' ? 'end' : 'middle'}
                height={groupBy === 'day' ? 80 : 60}
                interval={groupBy === 'day' ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                yAxisId="visitors"
                className="text-muted-foreground"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              {showRevenue && (
                <YAxis 
                  yAxisId="revenue"
                  orientation="right"
                  className="text-muted-foreground"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
              )}
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TrendsData
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="grid gap-2">
                          <div className="font-medium">{label}</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Visitors
                              </span>
                              <span className="font-bold text-lg text-blue-600">
                                {data.visitors.toLocaleString()}
                              </span>
                            </div>
                            {showRevenue && data.revenue && (
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Revenue
                                </span>
                                <span className="font-bold text-lg text-green-600">
                                  ${data.revenue.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {showRevenue && data.revenue && data.visitors > 0 && (
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Avg per Visitor
                                </span>
                                <span className="font-bold">
                                  ${(data.revenue / data.visitors).toFixed(2)}
                                </span>
                              </div>
                            )}
                            {data.growth !== undefined && (
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Growth
                                </span>
                                <span className={`font-bold ${data.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.growth >= 0 ? '+' : ''}{data.growth.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                yAxisId="visitors"
                type="monotone"
                dataKey="visitors"
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
                connectNulls={false}
              />
              {showRevenue && (
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-2))", strokeWidth: 2 }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">Total Visitors</span>
            </div>
            <p className="text-lg font-semibold mt-1">{totalVisitors.toLocaleString()}</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Average</span>
            </div>
            <p className="text-lg font-semibold mt-1">{averageVisitors.toLocaleString()}</p>
          </div>
          
          {showRevenue && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-lg font-semibold mt-1">${totalRevenue.toLocaleString()}</p>
            </div>
          )}
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-muted-foreground">Peak Period</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {peakPeriod ? peakPeriod.period : 'N/A'}
            </p>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Trend Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Highest Period:</span>
                <span className="font-medium">
                  {peakPeriod ? `${peakPeriod.period} (${peakPeriod.visitors.toLocaleString()})` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Lowest Period:</span>
                <span className="font-medium">
                  {data.length > 0 ? (() => {
                    const lowest = data.reduce((min, item) => item.visitors < min.visitors ? item : min, data[0])
                    return `${lowest.period} (${lowest.visitors.toLocaleString()})`
                  })() : 'N/A'}
                </span>
              </div>
            </div>
            
            <div>
              {showRevenue && totalRevenue > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Revenue per Visitor:</span>
                    <span className="font-medium">
                      ${(totalRevenue / totalVisitors).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Best Revenue Period:</span>
                    <span className="font-medium">
                      {(() => {
                        const bestRevenue = data.filter(item => item.revenue && item.revenue > 0)
                          .reduce((max, item) => (item.revenue || 0) > (max.revenue || 0) ? item : max, data[0])
                        return bestRevenue.revenue ? `${bestRevenue.period}` : 'N/A'
                      })()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-chart-1" />
              <span className="text-muted-foreground">Visitors</span>
            </div>
            {showRevenue && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-chart-2 border-dashed border-t-2" style={{ borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">Revenue</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
