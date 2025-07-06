"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ownerApi, authorityApi } from "@/lib/api"

interface DemographicsChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  className?: string
  title?: string
  description?: string
}

interface DemographicsData {
  name: string
  value: number
  percentage: number
  fill: string
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
]

export function DemographicsChart({ 
  attractionId, 
  period = 'month', 
  className = "",
  title,
  description
}: DemographicsChartProps) {
  const { user } = useAuth()
  const [data, setData] = useState<DemographicsData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch demographics data based on user role
  useEffect(() => {
    const fetchDemographicsData = async () => {
      if (!user?.role?.roleName) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const userRole = user.role.roleName.toLowerCase()
        let response

        if (userRole === 'owner') {
          // Owner: Get demographics for their specific attraction
          if (!attractionId) {
            // If no attractionId provided, get user's attraction first
            const attractionResponse = await ownerApi.getMyAttraction()
            const userAttractionId = attractionResponse.data?.id
            
            if (!userAttractionId) {
              throw new Error('No attraction found for this owner')
            }
            
            response = await ownerApi.getVisitorDemographics(userAttractionId, { period })
          } else {
            response = await ownerApi.getVisitorDemographics(attractionId, { period })
          }
        } else if (userRole === 'authority') {
          // Authority: Get city-wide demographics across all attractions
          response = await authorityApi.getCityDemographics({ 
            period, 
            breakdown: 'age' 
          })
        } else {
          throw new Error('Invalid user role for demographics data')
        }

        if (response.data && response.data.ageGroups) {
          // Transform API response to chart format
          const transformedData: DemographicsData[] = response.data.ageGroups.map((group: any, index: number) => ({
            name: group.ageRange || group.name || `Group ${index + 1}`,
            value: group.count || group.value || 0,
            percentage: group.percentage || ((group.count / response.data.totalVisitors) * 100) || 0,
            fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
          }))
          
          setData(transformedData)
        } else if (response.data && Array.isArray(response.data)) {
          // Handle alternative response format
          const transformedData: DemographicsData[] = response.data.map((item: any, index: number) => ({
            name: item.ageRange || item.name || item.category || `Group ${index + 1}`,
            value: item.count || item.value || 0,
            percentage: item.percentage || 0,
            fill: DEFAULT_COLORS[index % DEFAULT_COLORS.length]
          }))
          
          setData(transformedData)
        } else {
          // Fallback: create empty state
          setData([])
        }
      } catch (error) {
        console.error('Error fetching demographics data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load demographics data')
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDemographicsData()
  }, [user?.role?.roleName, attractionId, period])

  // Determine chart title and description based on context
  const getChartTitle = () => {
    if (title) return title
    
    const userRole = user?.role?.roleName?.toLowerCase()
    if (userRole === 'authority') {
      return 'City-wide Visitor Demographics'
    }
    return 'Visitor Demographics'
  }

  const getChartDescription = () => {
    if (description) return description
    
    const userRole = user?.role?.roleName?.toLowerCase()
    if (userRole === 'authority') {
      return 'Age group distribution across all city attractions'
    }
    return 'Age group distribution of your visitors'
  }

  // Calculate total visitors for display
  const totalVisitors = data.reduce((sum, item) => sum + item.value, 0)

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
              <p className="text-sm text-muted-foreground">Loading demographics data...</p>
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
            <Users className="h-5 w-5" />
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
            <Users className="h-5 w-5" />
            {getChartTitle()}
          </CardTitle>
          <CardDescription>{getChartDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No demographic data available for the selected period
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Data will appear once visitors start engaging with attractions
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
          <Users className="h-5 w-5" />
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
                {data.map((entry: DemographicsData, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DemographicsData
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Age Group
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {data.name}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Visitors
                            </span>
                            <span className="font-bold">
                              {data.value.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex flex-col col-span-2">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Percentage
                            </span>
                            <span className="font-bold">
                              {data.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.map((entry: DemographicsData, index: number) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto font-medium">
                {entry.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        
        {/* Summary Statistics */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Visitors</span>
              <p className="text-lg font-semibold">{totalVisitors.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Largest Group</span>
              <p className="text-lg font-semibold">
                {data.length > 0 
                  ? data.reduce((max, group) => group.value > max.value ? group : max, data[0]).name
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
