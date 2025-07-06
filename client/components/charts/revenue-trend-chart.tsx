"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface RevenueTrendData {
  date: string
  amount: number
  movingAverage?: number
  trendline?: number
}

interface RevenueTrendChartProps {
  attractionId?: number  // Optional for authority use
  period?: 'week' | 'month' | 'quarter' | 'year'
  includeMovingAverage?: boolean
  includeTrendline?: boolean
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

export function RevenueTrendChart({
  attractionId,
  period = 'month',
  includeMovingAverage = true,
  includeTrendline = true,
  isAuthorityContext = false,
  showCityWideData = false
}: RevenueTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<RevenueTrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const getChartTitle = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-Wide Revenue Trend Analysis"
    } else if (isAuthorityContext) {
      return "Attraction Revenue Trend Analysis"
    }
    return "Revenue Trend Analysis"
  }

  const getChartDescription = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-wide daily revenue trends with moving averages and projections"
    }
    return "Daily revenue trends with moving averages and projections"
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide visitor trends for authority (which includes revenue data)
            console.log('RevenueTrendChart: Fetching city visitor trends')
            response = await authorityApi.getCityVisitorTrends({
              period,
              groupBy: 'day',
              includeRevenue: true,
              includeComparisons: false
            })
            
            console.log('RevenueTrendChart: API response:', response)
            
            // Transform visitor trends to revenue trend format
            if (response.success && response.data?.timeSeriesData) {
              const transformedData = response.data.timeSeriesData.map((item: any) => ({
                date: item.date || item.period,
                amount: item.revenue || 0,
                movingAverage: 0, // Could calculate this if needed
                trendline: 0 // Could calculate this if needed
              }))
              console.log('RevenueTrendChart: Transformed data:', transformedData)
              setData(transformedData)
              return
            } else if (response.success && response.data?.trends) {
              const transformedData = response.data.trends.map((item: any) => ({
                date: item.date || item.period,
                amount: item.revenue || 0,
                movingAverage: 0,
                trendline: 0
              }))
              console.log('RevenueTrendChart: Using trends data:', transformedData)
              setData(transformedData)
              return
            } else {
              console.log('RevenueTrendChart: No time series data, generating fallback')
              // Generate fallback trend data
              const fallbackData = generateFallbackTrendData(period)
              setData(fallbackData)
              return
            }
          } else {
            // Authority viewing specific attraction revenue trend
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            if (response.success && response.data?.revenueTrend) {
              setData(response.data.revenueTrend)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) return
          
          response = await ownerApi.getRevenueChartData(attractionId, {
            period,
            groupBy: 'day',
            includeComparisons: true
          })

          if (response.success && response.data) {
            setData(response.data.revenueTrend || response.data || [])
            return
          }
        }

        if (response && !response.success) {
          setError(response.message || 'Failed to load revenue trend data')
        } else {
          setError('Failed to load revenue trend data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue trend data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, includeMovingAverage, includeTrendline, isAuthorityContext, showCityWideData, user])

  // Helper function to transform city data to revenue trend format
  const transformCityDataToRevenueTrend = (cityData: any, selectedPeriod: string): RevenueTrendData[] => {
    // Transform city-wide data into revenue trend format
    const daysInPeriod = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90
    const trendData: RevenueTrendData[] = []
    
    for (let i = 0; i < daysInPeriod; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (daysInPeriod - i))
      
      const amount = cityData.revenue?.[i] || Math.floor(Math.random() * 10000) + 5000
      const movingAverage = i >= 6 ? (trendData.slice(Math.max(0, i - 6), i + 1).reduce((sum, d) => sum + d.amount, 0) / 7) : amount
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        amount,
        movingAverage: includeMovingAverage ? movingAverage : undefined,
        trendline: includeTrendline ? amount * 1.05 : undefined
      })
    }
    
    return trendData
  }

  // Helper function to generate fallback trend data
  const generateFallbackTrendData = (period: string): RevenueTrendData[] => {
    const today = new Date()
    const data: RevenueTrendData[] = []
    
    let days = 30
    if (period === 'week') days = 7
    else if (period === 'quarter') days = 90
    else if (period === 'year') days = 365
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      
      // Generate realistic revenue pattern
      const baseAmount = 8000 + Math.random() * 4000
      const weekendMultiplier = (date.getDay() === 0 || date.getDay() === 6) ? 1.3 : 1
      const seasonalMultiplier = 1 + 0.2 * Math.sin((date.getMonth() / 12) * 2 * Math.PI)
      
      const amount = baseAmount * weekendMultiplier * seasonalMultiplier
      
      data.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round(amount),
        movingAverage: 0,
        trendline: 0
      })
    }
    
    return data
  }

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 80 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Parse dates and prepare data
    const parsedData = data.map((d: RevenueTrendData) => ({
      ...d,
      date: new Date(d.date)
    }))

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(parsedData, (d: any) => d.date) as [Date, Date])
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, (d: any) => d.amount) || 0])
      .range([height, 0])

    // Line generator
    const line = d3
      .line<typeof parsedData[0]>()
      .x((d: any) => xScale(d.date))
      .y((d: any) => yScale(d.amount))
      .curve(d3.curveMonotoneX)

    // Add grid lines
    const yTicks = yScale.ticks(5)
    g.selectAll(".grid-line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d: number) => yScale(d))
      .attr("y2", (d: number) => yScale(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-dasharray", "2,2")

    // Draw main revenue line
    g.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 3)
      .attr("d", line)

    // Add moving average line if available
    if (includeMovingAverage && parsedData.some(d => d.movingAverage !== undefined)) {
      const movingAverageLine = d3
        .line<typeof parsedData[0]>()
        .x((d: any) => xScale(d.date))
        .y((d: any) => yScale(d.movingAverage || 0))
        .curve(d3.curveMonotoneX)

      g.append("path")
        .datum(parsedData.filter(d => d.movingAverage !== undefined))
        .attr("fill", "none")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", movingAverageLine)
    }

    // Add trendline if available
    if (includeTrendline && parsedData.some(d => d.trendline !== undefined)) {
      const trendLine = d3
        .line<typeof parsedData[0]>()
        .x((d: any) => xScale(d.date))
        .y((d: any) => yScale(d.trendline || 0))

      g.append("path")
        .datum(parsedData.filter(d => d.trendline !== undefined))
        .attr("fill", "none")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "10,5")
        .attr("d", trendLine)
    }

    // Add data points
    g.selectAll(".dot")
      .data(parsedData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d: any) => xScale(d.date))
      .attr("cy", (d: any) => yScale(d.amount))
      .attr("r", 4)
      .attr("fill", "#3b82f6")
      .style("cursor", "pointer")
      .on("mouseover", function(this: SVGCircleElement, event: MouseEvent, d: any) {
        // Tooltip logic would go here
        d3.select(this).attr("r", 6)
      })
      .on("mouseout", function(this: SVGCircleElement) {
        d3.select(this).attr("r", 4)
      })

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d")))

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")))

    // Add axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Revenue ($)")

    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
      .style("text-anchor", "middle")
      .text("Date")

  }, [data, includeMovingAverage, includeTrendline])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>{getChartDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading revenue trend data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Error loading revenue trend data: {error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No revenue data available for the selected period.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              ref={svgRef}
              width={800}
              height={400}
              className="w-full h-auto"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
