"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VisitorDataPoint {
  date: string
  visitors: number
  growth?: number
  trend?: 'up' | 'down' | 'stable'
}

interface AdvancedVisitorChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  groupBy?: 'day' | 'week' | 'month'
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

export function AdvancedVisitorChart({
  attractionId,
  period = 'month',
  groupBy = 'day',
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: AdvancedVisitorChartProps) {
  const { user } = useAuth()
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<VisitorDataPoint[]>([])
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
            // Fetch city-wide visitor trends
            response = await authorityApi.getCityVisitorTrends({
              period,
              groupBy,
              includeRevenue: false,
              includeComparisons: false
            })
          } else {
            // Authority viewing specific attraction
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            // Transform the response to match visitor trends structure
            if (response.success && response.data?.visitorTrends) {
              setData(response.data.visitorTrends)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) return
          
          response = await ownerApi.getVisitorTrends(attractionId, {
            period,
            groupBy
          })
        }

        if (response.success && response.data) {
          // Handle different response structures
          const visitorData = response.data.trends || response.data.visitorTrends || response.data
          setData(visitorData)
        } else {
          setError(response.message || 'Failed to load visitor data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitor data')
        console.error('Error fetching visitor data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, groupBy, isAuthorityContext, showCityWideData, user])

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Parse dates
    const parseDate = d3.timeParse("%Y-%m-%d")
    const formatDate = d3.timeFormat("%b %d")

    const processedData = data.map(d => ({
      ...d,
      parsedDate: parseDate(d.date) || new Date()
    }))

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(processedData, d => d.parsedDate) as [Date, Date])
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(processedData, d => d.visitors) || 0])
      .range([height, 0])

    // Line generator
    const line = d3
      .line<any>()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(d.visitors))
      .curve(d3.curveMonotoneX)

    // Area generator for gradient fill
    const area = d3
      .area<any>()
      .x(d => xScale(d.parsedDate))
      .y0(height)
      .y1(d => yScale(d.visitors))
      .curve(d3.curveMonotoneX)

    // Gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "visitor-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0)

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0.1)

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6366f1")
      .attr("stop-opacity", 0.8)

    // Draw area
    g.append("path")
      .datum(processedData)
      .attr("fill", "url(#visitor-gradient)")
      .attr("d", area)

    // Draw line
    g.append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 3)
      .attr("d", line)

    // Draw dots
    g.selectAll(".dot")
      .data(processedData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.parsedDate))
      .attr("cy", d => yScale(d.visitors))
      .attr("r", 4)
      .attr("fill", "#6366f1")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
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
          <div><strong>${formatDate(d.parsedDate)}</strong></div>
          <div>Visitors: ${d.visitors.toLocaleString()}</div>
          ${d.growth ? `<div>Growth: ${d.growth > 0 ? '+' : ''}${d.growth.toFixed(1)}%</div>` : ''}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")

        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
      })
      .on("mouseout", function() {
        d3.selectAll(".tooltip").remove()
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 4)
      })

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d) => formatDate(d as Date))
        .ticks(5))
      .selectAll("text")
      .style("font-size", "12px")

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale)
        .tickFormat(d3.format(".0s")))
      .selectAll("text")
      .style("font-size", "12px")

    // Grid lines
    g.selectAll(".grid-x")
      .data(xScale.ticks(5))
      .enter()
      .append("line")
      .attr("class", "grid-x")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 0.5)

    g.selectAll(".grid-y")
      .data(yScale.ticks(5))
      .enter()
      .append("line")
      .attr("class", "grid-y")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 0.5)

  }, [data])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            {isAuthorityContext && showCityWideData 
              ? "City-Wide Visitor Trends" 
              : isAuthorityContext 
                ? "Attraction Visitor Trends" 
                : "Visitor Trends"
            }
          </CardTitle>
          <CardDescription>
            {isAuthorityContext && showCityWideData 
              ? "City-wide visitor analytics across all attractions" 
              : `Advanced visitor analytics over time (${period})`
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
          <CardTitle>
            {isAuthorityContext && showCityWideData 
              ? "City-Wide Visitor Trends" 
              : isAuthorityContext 
                ? "Attraction Visitor Trends" 
                : "Visitor Trends"
            }
          </CardTitle>
          <CardDescription>
            {isAuthorityContext && showCityWideData 
              ? "City-wide visitor analytics across all attractions" 
              : `Advanced visitor analytics over time (${period})`
            }
          </CardDescription>
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
          <CardTitle>
            {isAuthorityContext && showCityWideData 
              ? "City-Wide Visitor Trends" 
              : isAuthorityContext 
                ? "Attraction Visitor Trends" 
                : "Visitor Trends"
            }
          </CardTitle>
          <CardDescription>
            {isAuthorityContext && showCityWideData 
              ? "City-wide visitor analytics across all attractions" 
              : `Advanced visitor analytics over time (${period})`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No visitor data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {isAuthorityContext && showCityWideData 
            ? "City-Wide Visitor Trends" 
            : isAuthorityContext 
              ? "Attraction Visitor Trends" 
              : "Visitor Trends"
          }
        </CardTitle>
        <CardDescription>
          {isAuthorityContext && showCityWideData 
            ? "City-wide visitor analytics across all attractions" 
            : `Advanced visitor analytics over time (${period})`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} width="600" height="400" />
      </CardContent>
    </Card>
  )
}
