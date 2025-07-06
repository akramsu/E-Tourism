"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ForecastData {
  forecastDate: string
  predictedVisitors: number
  confidenceInterval: {
    lower: number
    upper: number
  }
  scenario?: string
  accuracy?: number
}

interface ForecastChartProps {
  data?: ForecastData[]
  title?: string
  type?: 'visitors' | 'revenue' | 'capacity'
  attractionId?: number
  forecastType?: 'visitors' | 'revenue' | 'capacity'
  period?: 'week' | 'month' | 'quarter'
  includeConfidenceInterval?: boolean
  includeScenarios?: boolean
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  attractionIds?: number[] // For authority viewing multiple attractions
}

export function ForecastChart({ 
  data: externalData,
  title = "Forecast Analysis",
  type = 'visitors',
  attractionId, 
  forecastType = 'visitors',
  period = 'month',
  includeConfidenceInterval = true,
  includeScenarios = false,
  className,
  isAuthorityContext = false,
  attractionIds
}: ForecastChartProps) {
  const { user } = useAuth()
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If external data is provided, use it instead of fetching
    if (externalData && externalData.length > 0) {
      setData(externalData)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      // For authority context, they can view city-wide forecasts or multiple attractions
      if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
        if (!attractionId && !attractionIds) {
          // Fetch city-wide forecast data
          try {
            setLoading(true)
            setError(null)
            
            const response = await authorityApi.getTourismInsights({
              period,
              includeForecasts: true
            })

            if (response.success && response.data?.forecasts) {
              setData(response.data.forecasts)
            } else {
              setError(response.message || 'Failed to load city-wide forecast data')
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load forecast data')
            console.error('Error fetching city forecast data:', err)
          } finally {
            setLoading(false)
          }
          return
        }
      }

      // For owner context or authority viewing specific attraction
      if (!attractionId) return

      try {
        setLoading(true)
        setError(null)
        
        let response
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          // Authority viewing specific attraction forecast
          response = await authorityApi.getAttractionStatistics(attractionId, {
            period
          })
          
          // Transform the response to match forecast data structure
          if (response.success && response.data?.forecasts) {
            setData(response.data.forecasts)
          } else {
            setError(response.message || 'Failed to load attraction forecast data')
          }
        } else {
          // Owner viewing their own attraction
          response = await ownerApi.getForecastData(attractionId, {
            forecastType,
            period,
            includeScenarios
          })

          if (response.success && response.data) {
            setData(response.data)
          } else {
            setError(response.message || 'Failed to load forecast data')
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast data')
        console.error('Error fetching forecast data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [externalData, attractionId, forecastType, period, includeScenarios, isAuthorityContext, attractionIds, user])

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 60 }
    const width = 800 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Parse dates
    const processedData = data.map((d) => ({
      ...d,
      date: new Date(d.forecastDate),
    }))

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(processedData, (d: any) => d.date) as [Date, Date])
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([
        includeConfidenceInterval 
          ? d3.min(processedData, (d: any) => d.confidenceInterval?.lower || d.predictedVisitors) || 0
          : d3.min(processedData, (d: any) => d.predictedVisitors) || 0,
        includeConfidenceInterval 
          ? d3.max(processedData, (d: any) => d.confidenceInterval?.upper || d.predictedVisitors) || 0
          : d3.max(processedData, (d: any) => d.predictedVisitors) || 0,
      ])
      .range([height, 0])

    if (includeConfidenceInterval) {
      // Create gradient for confidence interval
      const defs = svg.append("defs")
      const gradient = defs
        .append("linearGradient")
        .attr("id", "confidenceGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", height)
        .attr("x2", 0)
        .attr("y2", 0)

      gradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.1)
      gradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.3)

      // Area generator for confidence interval
      const area = d3
        .area<typeof processedData[0]>()
        .x((d: any) => xScale(d.date))
        .y0((d: any) => yScale(d.confidenceInterval?.lower || d.predictedVisitors))
        .y1((d: any) => yScale(d.confidenceInterval?.upper || d.predictedVisitors))
        .curve(d3.curveCardinal)

      // Add confidence interval area
      g.append("path").datum(processedData).attr("fill", "url(#confidenceGradient)").attr("d", area)
    }

    // Line generator for prediction
    const line = d3
      .line<typeof processedData[0]>()
      .x((d: any) => xScale(d.date))
      .y((d: any) => yScale(d.predictedVisitors))
      .curve(d3.curveCardinal)

    // Add prediction line
    g.append("path").datum(processedData).attr("fill", "none").attr("stroke", "#3b82f6").attr("stroke-width", 3).attr("d", line)

    // Add dots for predictions
    g.selectAll(".dot")
      .data(processedData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d: any) => xScale(d.date))
      .attr("cy", (d: any) => yScale(d.predictedVisitors))
      .attr("r", 4)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .on("mouseover", (event: any, d: any) => {
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0)
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.9)")
          .style("color", "white")
          .style("padding", "12px")
          .style("border-radius", "8px")
          .style("font-size", "12px")
          .style("pointer-events", "none")

        tooltip.transition().duration(200).style("opacity", 1)
        tooltip
          .html(`
            <div><strong>Date:</strong> ${d.date.toLocaleDateString()}</div>
            <div><strong>Predicted ${forecastType}:</strong> ${d.predictedVisitors.toLocaleString()}</div>
            ${includeConfidenceInterval && d.confidenceInterval ? `
              <div><strong>Range:</strong> ${d.confidenceInterval.lower.toLocaleString()} - ${d.confidenceInterval.upper.toLocaleString()}</div>
            ` : ''}
            ${d.accuracy ? `<div><strong>Accuracy:</strong> ${(d.accuracy * 100).toFixed(1)}%</div>` : ''}
          `)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", () => {
        d3.selectAll(".tooltip").remove()
      })

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d")))

    g.append("g").call(d3.axisLeft(yScale).tickFormat(d3.format(".0s")))

    // Add grid lines
    g.selectAll(".grid-line")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d: any) => yScale(d))
      .attr("y2", (d: any) => yScale(d))
      .attr("stroke", "rgba(148, 163, 184, 0.1)")
      .attr("stroke-width", 1)
  }, [data, includeConfidenceInterval, forecastType])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Forecast Analysis</CardTitle>
          <CardDescription>Loading forecast data...</CardDescription>
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
          <CardTitle>Forecast Analysis</CardTitle>
          <CardDescription>Error loading forecast data</CardDescription>
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
          <CardTitle>Forecast Analysis</CardTitle>
          <CardDescription>No forecast data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No forecast data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  const getChartTitle = () => {
    return title || `${forecastType.charAt(0).toUpperCase() + forecastType.slice(1)} Forecast`
  }

  const getChartDescription = () => {
    return `Predicted ${type || forecastType} trends for the next ${period}${includeConfidenceInterval ? ' with confidence intervals' : ''}`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>{getChartDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4 space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Predicted {forecastType}</span>
          </div>
          {includeConfidenceInterval && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Confidence Interval</span>
            </div>
          )}
        </div>
        <svg ref={svgRef} width="100%" height="400" className="overflow-visible" />
      </CardContent>
    </Card>
  )
}
