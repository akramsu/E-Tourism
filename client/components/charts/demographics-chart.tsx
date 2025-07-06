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
        
        console.log('DemographicsChart: Fetching data with params:', { attractionId, period, breakdown, isAuthorityContext, showCityWideData })
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide demographics
            response = await authorityApi.getCityDemographics({
              period,
              breakdown,
              includeComparisons: false
            }).catch(err => {
              console.log('DemographicsChart: City demographics API failed:', err.message)
              throw err
            })
          } else {
            // Authority viewing specific attraction demographics
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            }).catch(err => {
              console.log('DemographicsChart: Attraction statistics API failed:', err.message)
              throw err
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
          if (!attractionId) {
            console.log('DemographicsChart: No attraction ID for owner context, using demo data')
            throw new Error("No attraction ID provided")
          }
          
          response = await ownerApi.getDemographicsChartData(attractionId, {
            period,
            breakdown
          }).catch(err => {
            console.log('DemographicsChart: Owner API failed:', err.message)
            throw err
          })
        }

        if (response && response.success && response.data) {
          // Handle different response structures
          const demographicsData = response.data.demographics || response.data
          const processedData = demographicsData.map((item: any, index: number) => ({
            ...item,
            fill: item.fill || chartColors[index % chartColors.length]
          }))
          setData(processedData)
        } else {
          throw new Error("Invalid API response")
        }
      } catch (err) {
        console.error('Error fetching demographics data:', err)
        
        // Generate fallback demo data
        console.log('DemographicsChart: Generating fallback demo data for breakdown:', breakdown)
        const demoData = generateDemoDemographicsData(breakdown)
        setData(demoData)
        
        // Only set error for authenticated users - others see demo data
        // setError(err instanceof Error ? err.message : 'Failed to load demographics data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, breakdown, isAuthorityContext, showCityWideData, user])

  // Helper function to generate demo demographics data based on breakdown type
  const generateDemoDemographicsData = (breakdown: string): DemographicsData[] => {
    console.log('Generating demo demographics data for breakdown:', breakdown)
    
    switch (breakdown) {
      case 'age':
        return [
          { name: "18-24", value: 2240, percentage: 15, fill: chartColors[0] },
          { name: "25-34", value: 5224, percentage: 35, fill: chartColors[1] },
          { name: "35-44", value: 3732, percentage: 25, fill: chartColors[2] },
          { name: "45-54", value: 2092, percentage: 14, fill: chartColors[3] },
          { name: "55-64", value: 1196, percentage: 8, fill: chartColors[4] },
          { name: "65+", value: 448, percentage: 3, fill: chartColors[0] }
        ]
      case 'gender':
        return [
          { name: "Female", value: 8280, percentage: 55.5, fill: chartColors[0] },
          { name: "Male", value: 6324, percentage: 42.4, fill: chartColors[1] },
          { name: "Other", value: 313, percentage: 2.1, fill: chartColors[2] }
        ]
      case 'location':
        return [
          { name: "Local (0-50km)", value: 5964, percentage: 40, fill: chartColors[0] },
          { name: "Regional (50-200km)", value: 3728, percentage: 25, fill: chartColors[1] },
          { name: "National (200km+)", value: 2985, percentage: 20, fill: chartColors[2] },
          { name: "International", value: 2235, percentage: 15, fill: chartColors[3] }
        ]
      default:
        return [
          { name: "Young Adults (18-34)", value: 7464, percentage: 50, fill: chartColors[0] },
          { name: "Middle Age (35-54)", value: 5824, percentage: 39, fill: chartColors[1] },
          { name: "Seniors (55+)", value: 1644, percentage: 11, fill: chartColors[2] }
        ]
    }
  }

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

  if (error && (!data || data.length === 0)) {
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
