"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DemographicsData {
  name: string
  value: number
  percentage?: number
  fill?: string
}

interface DemographicsChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  breakdown?: 'age' | 'gender' | 'location' | 'all'
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function DemographicsChart({ 
  attractionId, 
  period = 'month', 
  breakdown = 'age',
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: DemographicsChartProps) {
  const { user } = useAuth()
  const [data, setData] = useState<DemographicsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide demographics
            response = await authorityApi.getCityDemographics({
              period,
              breakdown,
              includeComparisons: false
            })
          } else {
            // Authority viewing specific attraction demographics
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            // Transform the response to match demographics structure
            if (response.success && response.data?.demographics) {
              const processedData = response.data.demographics.map((item: any, index: number) => ({
                ...item,
                fill: item.fill || chartColors[index % chartColors.length]
              }))
              setData(processedData)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) return
          
          response = await ownerApi.getDemographicsChartData(attractionId, {
            period,
            breakdown
          })
        }

        if (response.success && response.data) {
          // Handle different response structures
          const demographicsData = response.data.demographics || response.data
          const processedData = demographicsData.map((item: any, index: number) => ({
            ...item,
            fill: item.fill || chartColors[index % chartColors.length]
          }))
          setData(processedData)
        } else {
          setError(response.message || 'Failed to load demographics data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load demographics data')
        console.error('Error fetching demographics data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, breakdown, isAuthorityContext, showCityWideData, user])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Visitor Demographics</CardTitle>
          <CardDescription>Loading demographics data...</CardDescription>
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
          <CardTitle>Visitor Demographics</CardTitle>
          <CardDescription>Error loading demographics data</CardDescription>
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
          <CardTitle>Visitor Demographics</CardTitle>
          <CardDescription>No demographics data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  const getChartTitle = () => {
    switch (breakdown) {
      case 'age': return 'Visitor Demographics by Age'
      case 'gender': return 'Visitor Demographics by Gender'
      case 'location': return 'Visitor Demographics by Location'
      case 'all': return 'Visitor Demographics Overview'
      default: return 'Visitor Demographics'
    }
  }

  const getChartDescription = () => {
    switch (breakdown) {
      case 'age': return 'Age group distribution of visitors'
      case 'gender': return 'Gender distribution of visitors'
      case 'location': return 'Geographic distribution of visitors'
      case 'all': return 'Complete demographic breakdown'
      default: return `Demographic breakdown for the past ${period}`
    }
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
            visitors: {
              label: "Visitors",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data} 
                cx="50%" 
                cy="50%" 
                innerRadius={60} 
                outerRadius={100} 
                paddingAngle={2} 
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
