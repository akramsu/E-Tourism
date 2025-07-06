"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface YearComparisonData {
  month: string
  currentYear: number
  previousYear: number
  growth?: number
  category?: string
}

interface YearComparisonChartProps {
  attractionId?: number
  metric?: 'visitors' | 'revenue' | 'ratings'
  includeGrowth?: boolean
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

export function YearComparisonChart({
  attractionId,
  metric = 'visitors',
  includeGrowth = true,
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: YearComparisonChartProps) {
  const { user } = useAuth()
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<YearComparisonData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getChartTitle = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-Wide Year-over-Year Comparison"
    } else if (isAuthorityContext) {
      return "Attraction Year-over-Year Comparison"
    }
    return "Year-over-Year Comparison"
  }

  const getChartDescription = () => {
    if (isAuthorityContext && showCityWideData) {
      return `Comparing city-wide ${metric} performance with previous year`
    }
    return `Comparing ${metric} performance with previous year`
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide year comparison data
            response = await authorityApi.getCityAnalytics({
              period: 'year',
              startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
              endDate: new Date().toISOString(),
              includeBreakdown: true
            })
            
            // Transform city analytics to year comparison format
            if (response.success && response.data?.yearComparison) {
              setData(response.data.yearComparison)
              return
            } else if (response.success && response.data) {
              // Transform general analytics data to year comparison format
              const transformedData = transformCityDataToYearComparison(response.data, metric)
              setData(transformedData)
              return
            }
          } else {
            // Authority viewing specific attraction year comparison
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period: 'year'
            })
            
            // Transform the response to match year comparison structure
            if (response.success && response.data?.yearComparison) {
              setData(response.data.yearComparison)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) return
          
          response = await ownerApi.getAttractionAnalytics(attractionId, {
            period: 'year',
            startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
            endDate: new Date().toISOString()
          })

          if (response.success && response.data) {
            setData(response.data.yearComparison || [])
            return
          }
        }

        if (response && !response.success) {
          setError(response.message || 'Failed to load year comparison data')
        } else {
          setError('Failed to load year comparison data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load year comparison data')
        console.error('Error fetching year comparison data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, metric, includeGrowth, isAuthorityContext, showCityWideData, user])

  // Helper function to transform city data to year comparison format
  const transformCityDataToYearComparison = (cityData: any, selectedMetric: string): YearComparisonData[] => {
    // This would transform city-wide data into monthly comparison format
    // Implementation depends on the actual city analytics API response structure
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return months.map((month, index) => {
      const current = cityData.currentYear?.[selectedMetric]?.[index] || 0
      const previous = cityData.previousYear?.[selectedMetric]?.[index] || 0
      const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0
      
      return {
        month,
        currentYear: current,
        previousYear: previous,
        growth: growth,
        category: selectedMetric
      }
    })
  }

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 80, bottom: 60, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map(d => d.month))
      .range([0, width])
      .padding(0.1)

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d: YearComparisonData) => Math.max(d.currentYear, d.previousYear)) || 0])
      .range([height, 0])

    // Colors
    const currentYearColor = "#6366f1"
    const previousYearColor = "#e5e7eb"

    // Bars
    const barWidth = xScale.bandwidth() / 2 - 2

    // Previous year bars
    g.selectAll(".bar-previous")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-previous")
      .attr("x", (d: YearComparisonData) => (xScale(d.month) || 0) + 2)
      .attr("y", (d: YearComparisonData) => yScale(d.previousYear))
      .attr("width", barWidth)
      .attr("height", (d: YearComparisonData) => height - yScale(d.previousYear))
      .attr("fill", previousYearColor)
      .attr("rx", 4)

    // Current year bars
    g.selectAll(".bar-current")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-current")
      .attr("x", (d: YearComparisonData) => (xScale(d.month) || 0) + barWidth + 4)
      .attr("y", (d: YearComparisonData) => yScale(d.currentYear))
      .attr("width", barWidth)
      .attr("height", (d: YearComparisonData) => height - yScale(d.currentYear))
      .attr("fill", currentYearColor)
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("mouseover", function(this: SVGRectElement, event: MouseEvent, d: YearComparisonData) {
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("opacity", 0)

        tooltip.transition()
          .duration(200)
          .style("opacity", 1)

        tooltip.html(`
          <div><strong>${d.month}</strong></div>
          <div>Current Year: ${d.currentYear.toLocaleString()}</div>
          <div>Previous Year: ${d.previousYear.toLocaleString()}</div>
          ${d.growth ? `<div>Growth: ${d.growth > 0 ? '+' : ''}${d.growth.toFixed(1)}%</div>` : ''}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")

        d3.select(this).attr("fill", "#4338ca")
      })
      .on("mouseout", function(this: SVGRectElement) {
        d3.selectAll(".tooltip").remove()
        d3.select(this).attr("fill", currentYearColor)
      })

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "12px")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".0s")))
      .selectAll("text")
      .style("font-size", "12px")

    // Legend
    const legend = g.append("g")
      .attr("transform", `translate(${width + 10}, 20)`)

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", currentYearColor)
      .attr("rx", 2)

    legend.append("text")
      .attr("x", 16)
      .attr("y", 9)
      .style("font-size", "12px")
      .text("Current Year")

    legend.append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", previousYearColor)
      .attr("rx", 2)

    legend.append("text")
      .attr("x", 16)
      .attr("y", 29)
      .style("font-size", "12px")
      .text("Previous Year")

  }, [data])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            {isAuthorityContext && showCityWideData 
              ? "City-Wide Year-over-Year Comparison" 
              : isAuthorityContext 
                ? "Attraction Year-over-Year Comparison" 
                : "Year-over-Year Comparison"
            }
          </CardTitle>
          <CardDescription>
            {isAuthorityContext && showCityWideData 
              ? `Comparing city-wide ${metric} performance with previous year` 
              : `Comparing ${metric} performance with previous year`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[400px]" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>{getChartDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
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
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>{getChartDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No comparison data available
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
        <svg ref={svgRef} width="600" height="400" />
      </CardContent>
    </Card>
  )
}
