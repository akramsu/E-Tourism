"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VisitorOrigin {
  country: string
  city?: string
  count: number
  percentage: number
  coordinates?: {
    lat: number
    lng: number
  }
}

interface VisitorOriginMapProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  topCount?: number
  className?: string
  // New props for authority context
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

export function VisitorOriginMap({
  attractionId,
  period = 'month',
  topCount = 10,
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: VisitorOriginMapProps) {
  const { user } = useAuth()
  const mapRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<VisitorOrigin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getChartTitle = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-Wide Visitor Origin Map"
    } else if (isAuthorityContext) {
      return "Attraction Visitor Origin Map"  
    }
    return "Visitor Origin Map"
  }

  const getChartDescription = () => {
    if (isAuthorityContext && showCityWideData) {
      return "Geographic distribution of visitors across all city attractions"
    }
    return "Geographic distribution of visitors by origin"
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide visitor origins (use available API)
            response = await authorityApi.getCityVisitorTrends({
              period
            })
            
            // Transform city data to origin format if needed
            if (response.success && response.data) {
              const originData = response.data.visitorOrigins || []
              setData(originData.slice(0, topCount))
              return
            }
          } else {
            // Authority viewing specific attraction origins
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            // Transform to origin format if needed
            if (response.success && response.data) {
              const originData = response.data.visitorOrigins || []
              setData(originData)
              return
            }
          }
        } else {
          // Owner viewing their own attraction
          if (!attractionId) {
            setError('Attraction ID is required for visitor origin data')
            return
          }
          
          response = await ownerApi.getVisitorOrigins(attractionId, {
            period
          })
        }

        if (response && response.success && response.data) {
          setData(response.data)
        } else {
          setError(response?.message || 'Failed to load visitor origin data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitor origin data')
        console.error('Error fetching visitor origin data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, topCount, isAuthorityContext, showCityWideData, user])

  useEffect(() => {
    if (!mapRef.current || !data || data.length === 0) return

    // Create a simple visualization using SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "400")
    svg.setAttribute("viewBox", "0 0 800 400")

    // Simple world map background
    const worldRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    worldRect.setAttribute("width", "800")
    worldRect.setAttribute("height", "400")
    worldRect.setAttribute("fill", "#f0f9ff")
    worldRect.setAttribute("stroke", "#e0e7ff")
    svg.appendChild(worldRect)

    // Add visitor origin points (simplified visualization)
    data.forEach((origin, index) => {
      if (!origin.coordinates) return

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")

      // Convert lat/lng to SVG coordinates (simplified projection)
      const x = ((origin.coordinates.lng + 180) / 360) * 800
      const y = ((90 - origin.coordinates.lat) / 180) * 400

      circle.setAttribute("cx", x.toString())
      circle.setAttribute("cy", y.toString())
      circle.setAttribute("r", Math.max(3, Math.sqrt(origin.count / 100) + 2).toString())
      circle.setAttribute("fill", "#3b82f6")
      circle.setAttribute("fill-opacity", "0.7")
      circle.setAttribute("stroke", "#1d4ed8")
      circle.setAttribute("stroke-width", "2")

      // Add hover effect
      circle.addEventListener("mouseenter", () => {
        circle.setAttribute("fill-opacity", "1")
        circle.setAttribute("r", (Math.max(3, Math.sqrt(origin.count / 100) + 4)).toString())
      })

      circle.addEventListener("mouseleave", () => {
        circle.setAttribute("fill-opacity", "0.7")
        circle.setAttribute("r", Math.max(3, Math.sqrt(origin.count / 100) + 2).toString())
      })

      svg.appendChild(circle)
    })

    mapRef.current.innerHTML = ""
    mapRef.current.appendChild(svg)

    return () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = ""
      }
    }
  }, [data])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>Loading visitor origin data...</CardDescription>
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
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>Error loading visitor origin data</CardDescription>
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
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>No visitor origin data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div ref={mapRef} className="w-full h-[400px] border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50" />
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold mb-3">Top Visitor Locations</h4>
            {data.slice(0, topCount).map((origin, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-blue-50 shadow-sm"
              >
                <div>
                  <div className="font-medium">{origin.country}</div>
                  {origin.city && (
                    <div className="text-sm text-muted-foreground">{origin.city}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{origin.count.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{origin.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
