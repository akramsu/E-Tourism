"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ModernRevenueData {
  category: string
  revenue: number
  visitors?: number
  growth?: number
  color?: string
}

interface ModernRevenueChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  groupBy?: 'week' | 'month' | 'category' | 'day'
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

export function ModernRevenueChart({
  attractionId,
  period = 'month',
  groupBy = 'category',
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: ModernRevenueChartProps) {
  const { user } = useAuth()
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<ModernRevenueData[]>([])
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
            // Fetch city-wide revenue data
            response = await authorityApi.getCityRevenue({
              period,
              breakdown: groupBy as 'category' | 'attraction' | 'time',
              includeComparisons: false
            })
          } else {
            // Authority viewing specific attraction revenue
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            // Transform the response to match revenue structure
            if (response.success && response.data?.revenue) {
              setData(response.data.revenue)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) return
          
          response = await ownerApi.getRevenueChartData(attractionId, {
            period,
            groupBy
          })
        }

        if (response.success && response.data) {
          // Handle different response structures
          const revenueData = response.data.revenue || response.data
          setData(revenueData)
        } else {
          setError(response.message || 'Failed to load revenue data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue data')
        console.error('Error fetching revenue data:', err)
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

    const margin = { top: 20, right: 30, bottom: 60, left: 80 }
    const width = 500 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d: ModernRevenueData) => d.category))
      .range([0, width])
      .padding(0.3)

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d: ModernRevenueData) => d.revenue) || 0])
      .range([height, 0])

    // Color scale
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, data.length - 1])
      .range(["#6366f1", "#ec4899"])

    // Gradient definitions
    const defs = svg.append("defs")
    data.forEach((d, i) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", `barGradient${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")

      gradient.append("stop").attr("offset", "0%").attr("stop-color", colorScale(i)).attr("stop-opacity", 0.9)
      gradient.append("stop").attr("offset", "100%").attr("stop-color", colorScale(i)).attr("stop-opacity", 0.6)
    })

    // Add grid lines
    g.selectAll(".grid-line")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d: number) => yScale(d))
      .attr("y2", (d: number) => yScale(d))
      .attr("stroke", "rgba(148, 163, 184, 0.1)")
      .attr("stroke-width", 1)

    // Add bars
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d: ModernRevenueData) => xScale(d.category) || 0)
      .attr("y", height)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("fill", (d: any, i: number) => `url(#barGradient${i})`)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .transition()
      .duration(800)
      .delay((d: any, i: number) => i * 100)
      .attr("y", (d: ModernRevenueData) => yScale(d.revenue))
      .attr("height", (d: ModernRevenueData) => height - yScale(d.revenue))

    // Add value labels
    g.selectAll(".value-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("x", (d: ModernRevenueData) => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text((d: ModernRevenueData) => `$${(d.revenue / 1000).toFixed(0)}K`)
      .transition()
      .duration(800)
      .delay((d: any, i: number) => i * 100)
      .attr("y", (d: ModernRevenueData) => yScale(d.revenue) + 20)

    // Add growth labels
    if (data.some(d => d.growth !== undefined)) {
      g.selectAll(".growth-label")
        .data(data.filter(d => d.growth !== undefined))
        .enter()
        .append("text")
        .attr("class", "growth-label")
        .attr("x", (d: ModernRevenueData) => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
        .attr("y", (d: ModernRevenueData) => yScale(d.revenue) - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", (d: ModernRevenueData) => d.growth && d.growth >= 0 ? "#10b981" : "#ef4444")
        .text((d: ModernRevenueData) => d.growth ? `${d.growth > 0 ? '+' : ''}${d.growth.toFixed(1)}%` : '')
        .style("opacity", 0)
        .transition()
        .duration(600)
        .delay((d: any, i: number) => i * 100 + 400)
        .style("opacity", 1)
    }

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".0s")))

    // Add tooltip
    const tooltip = d3.select("body").selectAll(".tooltip").data([1])
      .enter().append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)

    // Add interactions
    g.selectAll(".bar")
      .on("mouseover", function (this: SVGRectElement, event: any, d: ModernRevenueData) {
        d3.select(this).attr("opacity", 0.8)
        tooltip.transition().duration(200).style("opacity", 0.9)
        tooltip
          .html(`
            <div><strong>${d.category}:</strong> $${d.revenue.toLocaleString()}</div>
            ${d.visitors ? `<div><strong>Visitors:</strong> ${d.visitors.toLocaleString()}</div>` : ''}
            ${d.growth ? `<div><strong>Growth:</strong> ${d.growth > 0 ? '+' : ''}${d.growth.toFixed(1)}%</div>` : ''}
          `)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", function (this: SVGRectElement) {
        d3.select(this).attr("opacity", 1)
        tooltip.transition().duration(500).style("opacity", 0)
      })

    // Cleanup function
    return () => {
      d3.select("body").selectAll(".tooltip").remove()
    }
  }, [data])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            {isAuthorityContext && showCityWideData 
              ? "City-Wide Revenue Analysis" 
              : isAuthorityContext 
                ? "Attraction Revenue Analysis" 
                : "Modern Revenue Analysis"
            }
          </CardTitle>
          <CardDescription>
            {isAuthorityContext && showCityWideData 
              ? "City-wide revenue analytics across all attractions" 
              : "Advanced revenue analytics and performance insights"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
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
              ? "City-Wide Revenue Analysis" 
              : isAuthorityContext 
                ? "Attraction Revenue Analysis" 
                : "Modern Revenue Analysis"
            }
          </CardTitle>
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
          <CardTitle>Modern Revenue Analysis</CardTitle>
          <CardDescription>No revenue data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const avgGrowth = data.filter(d => d.growth !== undefined).reduce((sum, d) => sum + (d.growth || 0), 0) / data.filter(d => d.growth !== undefined).length

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Modern Revenue Analysis</CardTitle>
        <CardDescription>
          Revenue breakdown by {groupBy} for {period} - Total: ${totalRevenue.toLocaleString()}
          {!isNaN(avgGrowth) && ` (Avg Growth: ${avgGrowth > 0 ? '+' : ''}${avgGrowth.toFixed(1)}%)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} width="100%" height="400" className="overflow-visible" />
      </CardContent>
    </Card>
  )
}
