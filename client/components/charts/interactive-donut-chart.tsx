"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DonutChartData {
  name: string
  value: number
  color: string
  count?: number
}

interface InteractiveDonutChartProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  breakdown?: 'age' | 'gender' | 'location' | 'all'
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

export function InteractiveDonutChart({
  attractionId,
  period = 'month',
  breakdown = 'age',
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: InteractiveDonutChartProps) {
  const { user } = useAuth()
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<DonutChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide demographics for donut chart
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
            
            // Transform the response to match donut chart structure
            if (response.success && response.data?.demographics) {
              setData(response.data.demographics)
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
          setData(demographicsData)
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

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 300
    const height = 300
    const radius = Math.min(width, height) / 2 - 10

    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`)

    // Create pie layout
    const pie = d3
      .pie<DonutChartData>()
      .value((d) => d.value)
      .sort(null)

    // Create arc generators
    const arc = d3
      .arc<d3.PieArcDatum<DonutChartData>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius)

    const arcHover = d3
      .arc<d3.PieArcDatum<DonutChartData>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius + 10)

    // Create gradient definitions
    const defs = svg.append("defs")

    data.forEach((d, i) => {
      const gradient = defs
        .append("radialGradient")
        .attr("id", `donutGradient${i}`)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%")

      gradient.append("stop").attr("offset", "0%").attr("stop-color", d.color).attr("stop-opacity", 0.8)
      gradient.append("stop").attr("offset", "100%").attr("stop-color", d.color).attr("stop-opacity", 1)
    })

    // Create arcs
    const arcs = g.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc")

    // Add paths
    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d: any, i: number) => `url(#donutGradient${i})`)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (event: any, d: d3.PieArcDatum<DonutChartData>) {
        d3.select(this).transition().duration(200).attr("d", arcHover)
        setSelectedSegment(d.data.name)
      })
      .on("mouseout", function (event: any, d: d3.PieArcDatum<DonutChartData>) {
        d3.select(this).transition().duration(200).attr("d", arc)
        setSelectedSegment(null)
      })

    // Add labels
    arcs
      .append("text")
      .attr("transform", (d: d3.PieArcDatum<DonutChartData>) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text((d: d3.PieArcDatum<DonutChartData>) => `${d.data.value}%`)

    // Add center text
    const centerText = g.append("g").attr("class", "center-text")

    centerText
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .attr("y", -5)
      .text(getBreakdownTitle())

    centerText
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "currentColor")
      .attr("y", 15)
      .text("Distribution")
  }, [data, breakdown])

  const getBreakdownTitle = () => {
    switch (breakdown) {
      case 'age': return 'Demographics'
      case 'gender': return 'Gender'
      case 'location': return 'Location'
      default: return 'Analytics'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Visitor {getBreakdownTitle()}</CardTitle>
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
          <CardTitle>Visitor {getBreakdownTitle()}</CardTitle>
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
          <CardTitle>Visitor {getBreakdownTitle()}</CardTitle>
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Visitor {getBreakdownTitle()}</CardTitle>
        <CardDescription>Interactive {breakdown} distribution analysis for {period}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <svg ref={svgRef} width="300" height="300" />
          <div className="space-y-3 ml-6">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                  selectedSegment === item.name
                    ? "bg-white dark:bg-gray-800 shadow-md scale-105"
                    : "hover:bg-white/50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.value}% {item.count && `(${item.count.toLocaleString()})`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
