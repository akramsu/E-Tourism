"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, DollarSign, TrendingUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ownerApi, authorityApi } from "@/lib/api"

interface RevenueChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  className?: string
  title?: string
  description?: string
  breakdown?: 'category' | 'time' | 'attraction'
}

interface RevenueData {
  category: string
  revenue: number
  visitors?: number
  percentage?: number
  fill?: string
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
]

export function RevenueChart({ 
  attractionId, 
  period = 'month', 
  className = "",
  title,
  description,
  breakdown = 'category'
}: RevenueChartProps) {
  const { user } = useAuth()
  const [data, setData] = useState<RevenueData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch revenue data based on user role
  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!user?.role?.roleName) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const userRole = user.role.roleName.toLowerCase()
        let response

        if (userRole === 'owner') {
          // Owner: Get revenue analysis for their specific attraction
          if (!attractionId) {
            // If no attractionId provided, get user's attraction first
            const attractionResponse = await ownerApi.getMyAttraction()
            const userAttractionId = attractionResponse.data?.id
            
            if (!userAttractionId) {
              throw new Error('No attraction found for this owner')
            }
            
            response = await ownerApi.getRevenueAnalysis(userAttractionId, { 
              period, 
              includeBreakdown: true 
            })
          } else {
            response = await ownerApi.getRevenueAnalysis(attractionId, { 
              period, 
              includeBreakdown: true 
            })
          }
        } else if (userRole === 'authority') {
          // Authority: Get city-wide revenue analytics across all attractions
          response = await authorityApi.getCityRevenue({ 
            period, 
            breakdown,
            includeComparisons: true 
          })
        } else {
          throw new Error('Invalid user role for revenue data')
        }

        if (response.data) {
          let transformedData: RevenueData[] = []

          // Handle different breakdown types
          if (breakdown === 'category' && response.data.revenueByCategory) {
            transformedData = response.data.revenueByCategory.map((item: any, index: number) => ({
              category: item.category || item.name || `Category ${index + 1}`,
              revenue: item.revenue || item.amount || 0,
              visitors: item.visitors || item.visitorCount || undefined,
              percentage: item.percentage || 0,
              fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }))
          } else if (breakdown === 'attraction' && response.data.revenueByAttraction) {
            transformedData = response.data.revenueByAttraction.map((item: any, index: number) => ({
              category: item.attractionName || item.name || `Attraction ${index + 1}`,
              revenue: item.revenue || item.amount || 0,
              visitors: item.visitors || item.visitorCount || undefined,
              percentage: item.percentage || 0,
              fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }))
          } else if (breakdown === 'time' && response.data.revenueByTime) {
            transformedData = response.data.revenueByTime.map((item: any, index: number) => ({
              category: item.period || item.timeLabel || `Period ${index + 1}`,
              revenue: item.revenue || item.amount || 0,
              visitors: item.visitors || item.visitorCount || undefined,
              percentage: item.percentage || 0,
              fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }))
          } else {
            // Fallback: try to use direct revenue data
            if (Array.isArray(response.data.revenue)) {
              transformedData = response.data.revenue.map((item: any, index: number) => ({
                category: item.category || item.name || item.label || `Item ${index + 1}`,
                revenue: item.revenue || item.amount || item.value || 0,
                visitors: item.visitors || item.visitorCount || undefined,
                percentage: item.percentage || 0,
                fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
              }))
            } else if (response.data.categories) {
              transformedData = response.data.categories.map((item: any, index: number) => ({
                category: item.category || item.name || `Category ${index + 1}`,
                revenue: item.revenue || item.amount || 0,
                visitors: item.visitors || item.visitorCount || undefined,
                percentage: item.percentage || 0,
                fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
              }))
            }
          }
          
          setData(transformedData)
        } else {
          setData([])
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load revenue data')
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRevenueData()
  }, [user?.role?.roleName, attractionId, period, breakdown])

  // Determine chart title and description based on context
  const getChartTitle = () => {
    if (title) return title
    
    const userRole = user?.role?.roleName?.toLowerCase()
    if (userRole === 'authority') {
      if (breakdown === 'category') return 'City-wide Revenue by Category'
      if (breakdown === 'attraction') return 'Revenue by Attraction'
      if (breakdown === 'time') return 'City Revenue Trends'
      return 'City Revenue Analysis'
    }
    
    if (breakdown === 'category') return 'Revenue by Category'
    if (breakdown === 'time') return 'Revenue Trends'
    return 'Revenue Analysis'
  }

  const getChartDescription = () => {
    if (description) return description
    
    const userRole = user?.role?.roleName?.toLowerCase()
    const periodText = period === 'week' ? 'Weekly' : 
                     period === 'month' ? 'Monthly' : 
                     period === 'quarter' ? 'Quarterly' : 'Yearly'
    
    if (userRole === 'authority') {
      if (breakdown === 'category') return `${periodText} revenue breakdown by attraction type across the city`
      if (breakdown === 'attraction') return `${periodText} revenue comparison across all attractions`
      if (breakdown === 'time') return `${periodText} revenue trends for city tourism`
      return `${periodText} revenue analysis for city tourism`
    }
    
    if (breakdown === 'category') return `${periodText} revenue breakdown by visitor categories`
    if (breakdown === 'time') return `${periodText} revenue performance trends`
    return `${periodText} revenue analysis for your attraction`
  }

  // Calculate total revenue for display
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading revenue data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {getChartTitle()}
          </CardTitle>
          <CardDescription>{getChartDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No revenue data available for the selected period
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue data will appear once transactions are recorded
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {getChartTitle()}
        </CardTitle>
        <CardDescription>
          {getChartDescription()} • ${totalRevenue.toLocaleString()} total revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            revenue: {
              label: "Revenue ($)",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="category" 
                className="text-muted-foreground"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                className="text-muted-foreground"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as RevenueData
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="grid gap-2">
                          <div className="font-medium">{label}</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Revenue
                              </span>
                              <span className="font-bold text-lg">
                                ${data.revenue.toLocaleString()}
                              </span>
                            </div>
                            {data.visitors && (
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Visitors
                                </span>
                                <span className="font-bold">
                                  {data.visitors.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {data.percentage !== undefined && (
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Share
                                </span>
                                <span className="font-bold">
                                  {data.percentage.toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {data.visitors && (
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Avg per Visitor
                                </span>
                                <span className="font-bold">
                                  ${(data.revenue / data.visitors).toFixed(2)}
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
              <Bar
                dataKey="revenue"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-lg font-semibold mt-1">${totalRevenue.toLocaleString()}</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">Top Category</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {data.length > 0 
                ? data.reduce((max, item) => item.revenue > max.revenue ? item : max, data[0]).category
                : 'N/A'
              }
            </p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-muted-foreground">Average</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              ${data.length > 0 ? (totalRevenue / data.length).toLocaleString() : '0'}
            </p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-muted-foreground">Categories</span>
            </div>
            <p className="text-lg font-semibold mt-1">{data.length}</p>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Performance Breakdown</h4>
          <div className="space-y-2">
            {data.slice(0, 5).map((item: RevenueData, index: number) => {
              const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
              return (
                <div key={`breakdown-${index}`} className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm text-muted-foreground min-w-0 flex-1 truncate">
                    {item.category}
                  </span>
                  <span className="text-sm font-medium">
                    ${(item.revenue / 1000).toFixed(0)}K
                  </span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              )
            })}
            {data.length > 5 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                +{data.length - 5} more categories
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
