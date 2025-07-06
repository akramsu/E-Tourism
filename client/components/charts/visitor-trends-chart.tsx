"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VisitorTrendsData {
  period: string
  visitors: number
  revenue?: number
  change?: number
}

interface VisitorTrendsChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  groupBy?: 'day' | 'week' | 'month'
  includeRevenue?: boolean
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

export function VisitorTrendsChart({ 
  attractionId, 
  period = 'month', 
  groupBy = 'month',
  includeRevenue = true,
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: VisitorTrendsChartProps) {
  const { user } = useAuth()
  const [data, setData] = useState<VisitorTrendsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getChartTitle = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-Wide Visitor Trends"
    } else if (isAuthorityContext) {
      return "Attraction Visitor Trends"
    }
    return "Visitor Trends"
  }

  const getChartDescription = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-wide visitor flow and revenue trends over time"
    }
    return "Visitor flow and revenue trends over time"
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide visitor trends
            response = await authorityApi.getCityVisitorTrends({
              period,
              groupBy,
              includeRevenue
            })
          } else {
            // Authority viewing specific attraction trends
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            // Transform to trends format if needed
            if (response.success && response.data) {
              const trendsData = response.data.visitorTrends || []
              setData(trendsData)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) {
            setError('Attraction ID is required for visitor trends data')
            return
          }
          
          response = await ownerApi.getVisitorTrendsData(attractionId, {
            period,
            groupBy,
            includeRevenue
          })
        }

        if (response && response.success && response.data) {
          setData(response.data)
        } else {
          setError(response?.message || 'Failed to load visitor trends data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitor trends data')
        console.error('Error fetching visitor trends data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, groupBy, includeRevenue, isAuthorityContext, showCityWideData, user])

  if (loading) {
    return (
      <Card className={`col-span-2 ${className}`}>
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>{getChartDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`col-span-2 ${className}`}>
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>Error loading visitor trends data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={`col-span-2 ${className}`}>
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>No visitor trends data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className={`col-span-2 ${className}`}>
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>{getChartDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            visitors: {
              label: "Visitors",
              color: "hsl(var(--chart-1))",
            },
            ...(includeRevenue && {
              revenue: {
                label: "Revenue ($)",
                color: "hsl(var(--chart-2))",
              }
            })
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="visitors"
                stroke="var(--color-visitors)"
                strokeWidth={3}
                dot={{ fill: "var(--color-visitors)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--color-visitors)", strokeWidth: 2 }}
              />
              {includeRevenue && (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: "var(--color-revenue)", strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
