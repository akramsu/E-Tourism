"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RevenueData {
  period: string
  revenue: number
  visitors?: number
  change?: number
  category?: string
}

interface RevenueChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  groupBy?: 'day' | 'week' | 'month' | 'category'
  includeComparisons?: boolean
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

export function RevenueChart({ 
  attractionId, 
  period = 'month', 
  groupBy = 'month',
  includeComparisons = false,
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: RevenueChartProps) {
  const { user } = useAuth()
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getChartTitle = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-Wide Revenue Analysis"
    } else if (isAuthorityContext) {
      return "Attraction Revenue Analysis"
    }
    return "Revenue Analysis"
  }

  const getChartDescription = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-wide revenue breakdown and trends"
    }
    return "Revenue breakdown and trends over time"
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide revenue data
            response = await authorityApi.getCityRevenue({
              period,
              breakdown: 'time',
              includeComparisons
            })
          } else {
            // Authority viewing specific attraction revenue
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            // Transform to revenue format if needed
            if (response.success && response.data) {
              const revenueData = response.data.revenueData || []
              setData(revenueData)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) {
            setError('Attraction ID is required for revenue data')
            return
          }
          
          response = await ownerApi.getRevenueChartData(attractionId, {
            period,
            groupBy,
            includeComparisons
          })
        }

        if (response && response.success && response.data) {
          setData(response.data)
        } else {
          setError(response?.message || 'Failed to load revenue data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue data')
        console.error('Error fetching revenue data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, groupBy, includeComparisons, isAuthorityContext, showCityWideData, user])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Revenue Analysis</CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Revenue Analysis</CardTitle>
          <CardDescription>Error loading revenue data</CardDescription>
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
      <Card className={className}>
        <CardHeader>
          <CardTitle>Revenue Analysis</CardTitle>
          <CardDescription>No revenue data available</CardDescription>
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
    <Card className={className}>
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>{getChartDescription()}</CardDescription>
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
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey={groupBy === 'category' ? 'category' : 'period'} 
                className="text-muted-foreground" 
              />
              <YAxis className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
