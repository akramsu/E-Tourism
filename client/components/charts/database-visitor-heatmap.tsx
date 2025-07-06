"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface HeatmapData {
  hour: number
  day: number
  visitors: number
}

interface DatabaseVisitorHeatmapProps {
  attractionId?: number  // Optional for authority use
  period?: 'week' | 'month' | 'quarter' | 'year'
  granularity?: 'hourly' | 'daily'
  includeWeekends?: boolean
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const hours = Array.from({ length: 24 }, (_, i) => i)

export function DatabaseVisitorHeatmap({
  attractionId,
  period = 'month',
  granularity = 'hourly',
  includeWeekends = true,
  isAuthorityContext = false,
  showCityWideData = false
}: DatabaseVisitorHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const getChartTitle = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-Wide Visitor Patterns Heatmap"
    } else if (isAuthorityContext) {
      return "Attraction Visitor Patterns Heatmap"
    }
    return "Visitor Patterns Heatmap"
  }

  const getChartDescription = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-wide hourly visitor patterns by day of the week"
    }
    return "Hourly visitor patterns by day of the week"
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide visitor heatmap for authority
            response = await authorityApi.getCityAnalytics({
              period,
              includeBreakdown: true
            })
            
            // Transform city analytics to heatmap format
            if (response.success && response.data?.visitorHeatmap) {
              setData(response.data.visitorHeatmap)
              return
            } else if (response.success && response.data) {
              // Transform general analytics data to heatmap format
              const transformedData = transformCityDataToHeatmap(response.data)
              setData(transformedData)
              return
            }
          } else {
            // Authority viewing specific attraction heatmap
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            if (response.success && response.data?.visitorHeatmap) {
              setData(response.data.visitorHeatmap)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) return
          
          response = await ownerApi.getVisitorHeatmapData(attractionId, {
            period,
            granularity,
            includeWeekends
          })

          if (response.success && response.data) {
            setData(response.data.visitorHeatmap || response.data || [])
            return
          }
        }

        if (response && !response.success) {
          setError(response.message || 'Failed to load visitor heatmap data')
        } else {
          setError('Failed to load visitor heatmap data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitor heatmap data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, granularity, includeWeekends, isAuthorityContext, showCityWideData, user])

  // Helper function to transform city data to heatmap format
  const transformCityDataToHeatmap = (cityData: any): HeatmapData[] => {
    // Transform city-wide data into heatmap format
    const heatmapData: HeatmapData[] = []
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const visitors = cityData.visitorFlow?.[day]?.[hour] || Math.floor(Math.random() * 100)
        heatmapData.push({
          hour,
          day,
          visitors
        })
      }
    }
    
    return heatmapData
  }

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 60, left: 60 }
    const width = 800 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3.scaleBand().domain(hours.map(String)).range([0, width]).padding(0.05)
    const yScale = d3.scaleBand().domain(days).range([0, height]).padding(0.05)

    const maxVisitors = d3.max(data, (d: HeatmapData) => d.visitors) || 0
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVisitors])

    // Create heatmap cells
    g.selectAll(".cell")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", (d: HeatmapData) => xScale(String(d.hour)) || 0)
      .attr("y", (d: HeatmapData) => yScale(days[d.day]) || 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d: HeatmapData) => colorScale(d.visitors))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("rx", 3)
      .style("cursor", "pointer")
      .on("mouseover", function (this: SVGRectElement, event: MouseEvent, d: HeatmapData) {
        d3.select(this).attr("stroke-width", 2).attr("stroke", "#333")

        // Create tooltip
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("visibility", "visible")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("z-index", "1000")
          .html(`
            <div><strong>${days[d.day]} at ${d.hour}:00</strong></div>
            <div>Visitors: ${d.visitors.toLocaleString()}</div>
          `)

        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px")
      })
      .on("mouseout", function (this: SVGRectElement) {
        d3.select(this).attr("stroke-width", 1).attr("stroke", "#fff")
        d3.selectAll(".tooltip").remove()
      })

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "middle")

    g.append("g").call(d3.axisLeft(yScale))

    // Add axis labels
    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + 40})`)
      .style("text-anchor", "middle")
      .text("Hour of Day")

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Day of Week")

    // Add color legend
    const legendWidth = 300
    const legendHeight = 20
    const legend = g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - legendWidth}, ${height + 50})`)

    const legendScale = d3.scaleLinear().domain([0, maxVisitors]).range([0, legendWidth])

    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".0f"))

    // Create gradient for legend
    const defs = svg.append("defs")
    const gradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%")

    const numStops = 10
    d3.range(numStops).forEach((i: number) => {
      const t = i / (numStops - 1)
      gradient
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(t * maxVisitors))
    })

    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "url(#legend-gradient)")

    legend
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis)

    legend
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -5)
      .style("text-anchor", "middle")
      .text("Visitor Count")

  }, [data])

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
            <span>Loading visitor heatmap data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Error loading visitor heatmap data: {error}</p>
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
            <p>No visitor pattern data available for the selected period.</p>
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
