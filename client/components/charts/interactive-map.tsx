"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { MapPin, Globe, Users, Loader2, TrendingUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { authorityApi, ownerApi } from "@/lib/api"
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  ZoomableGroup
} from "react-simple-maps"

interface CountryData {
  country: string
  count: number
  percentage: number
  color?: string
  iso?: string
}

interface InteractiveMapProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  className?: string
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

// World map topology URL (Natural Earth data)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

export function InteractiveMap({
  attractionId,
  period = 'month',
  className,
  isAuthorityContext = false,
  showCityWideData = false
}: InteractiveMapProps) {
  const { user } = useAuth()
  const [countryData, setCountryData] = useState<CountryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [totalVisitors, setTotalVisitors] = useState(0)
  const [tooltipContent, setTooltipContent] = useState("")

  // Map country names to ISO codes for API data matching
  const getCountryISO = (country: string): string => {
    const isoMap: { [key: string]: string } = {
      'Australia': 'AUS',
      'United States': 'USA',
      'United Kingdom': 'GBR',
      'Germany': 'DEU',
      'France': 'FRA',
      'Japan': 'JPN',
      'Canada': 'CAN',
      'Netherlands': 'NLD',
      'China': 'CHN',
      'India': 'IND',
      'Brazil': 'BRA',
      'Italy': 'ITA',
      'Spain': 'ESP',
      'South Korea': 'KOR',
      'New Zealand': 'NZL',
      'Singapore': 'SGP',
      'Thailand': 'THA',
      'Malaysia': 'MYS',
      'South Africa': 'ZAF',
      'Mexico': 'MEX'
    }
    return isoMap[country] || 'XXX'
  }

  // Get country data by ISO code
  const getCountryByISO = (iso: string): CountryData | undefined => {
    return countryData.find(country => country.iso === iso)
  }

  // Color scale for visitor percentages
  const getCountryColor = (percentage: number): string => {
    if (percentage >= 50) return "#1e40af" // Blue-700
    if (percentage >= 20) return "#3b82f6" // Blue-500
    if (percentage >= 10) return "#60a5fa" // Blue-400
    if (percentage >= 5) return "#93c5fd"  // Blue-300
    if (percentage >= 1) return "#dbeafe"  // Blue-100
    return "#f1f5f9" // Gray-100
  }

  // Get country fill color based on data
  const getCountryFill = (geo: any): string => {
    const countryISO = geo.properties.ISO_A3
    const country = getCountryByISO(countryISO)
    
    if (country) {
      return getCountryColor(country.percentage)
    }
    
    return "#f8fafc" // Default gray for countries with no data
  }

  // Fetch visitor data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        let response
        if (isAuthorityContext) {
          if (showCityWideData) {
            // Fetch city-wide demographics from authority API
            console.log('InteractiveMap: Fetching city demographics for period:', period)
            response = await authorityApi.getCityDemographics({
              period,
              breakdown: 'location',
              includeComparisons: false
            })
          } else if (attractionId) {
            // For specific attraction, we still need to implement this
            // For now, fallback to city-wide data
            console.log('InteractiveMap: Fetching city demographics for attraction:', attractionId)
            response = await authorityApi.getCityDemographics({
              period,
              breakdown: 'location',
              includeComparisons: false
            })
          } else {
            throw new Error("Missing required parameters for authority context")
          }
        } else {
          if (!attractionId) {
            throw new Error("Attraction ID required for owner context")
          }
          // Use visitor demographics endpoint for owners
          console.log('InteractiveMap: Fetching visitor demographics for attraction:', attractionId)
          response = await ownerApi.getVisitorDemographics(attractionId, { period })
        }

        console.log('InteractiveMap: API response received:', response)

        if (response?.success && response?.data) {
          const apiData = response.data
          
          // Extract location data from the demographics object
          let locationData = apiData.demographics?.location || {}
          
          console.log('InteractiveMap: Location data extracted:', locationData)
          
          if (typeof locationData === 'object' && !Array.isArray(locationData)) {
            // Convert object to array format and calculate totals
            const locationArray = Object.entries(locationData).map(([country, count]) => ({
              country,
              count: Number(count)
            }))
            
            console.log('InteractiveMap: Location array processed:', locationArray)
            
            const total = locationArray.reduce((sum, item) => sum + item.count, 0)
            setTotalVisitors(total)

            if (total === 0) {
              console.log('InteractiveMap: No visitor data found for the selected period')
              setCountryData([])
              return
            }

            const countries = locationArray
              .filter(item => item.country && item.country !== 'Unknown')
              .map(item => ({
                country: item.country,
                count: item.count,
                percentage: total > 0 ? (item.count / total * 100) : 0,
                iso: getCountryISO(item.country)
              }))
              .sort((a: CountryData, b: CountryData) => b.count - a.count)

            console.log('InteractiveMap: Final country data processed:', countries)
            setCountryData(countries)
          } else {
            throw new Error('Invalid data format from API - location data is not an object')
          }
        } else {
          throw new Error('No data received from API')
        }
      } catch (err) {
        console.error("Error fetching country data:", err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(`Failed to load visitor origin data: ${errorMessage}`)
        setCountryData([])
        setTotalVisitors(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, isAuthorityContext, showCityWideData, user])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error && countryData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Visitor Origins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!loading && countryData.length === 0 && !error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Visitor Origins
          </CardTitle>
          <CardDescription>
            No visitor data available for the selected {period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No visitor origin data available for this period</p>
              <p className="text-sm mt-2">Try selecting a different time period or check back later</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Global Visitor Origins
          </CardTitle>
          <CardDescription>
            Interactive world map showing visitor distribution by country for the selected {period}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Map Container */}
      <Card>
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden rounded-lg">
            {/* Map */}
            <div className="relative h-96 w-full">
              <ComposableMap
                projection="geoNaturalEarth1"
                projectionConfig={{
                  scale: 140,
                  center: [0, 20]
                }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup>
                  <Sphere 
                    stroke="#e2e8f0" 
                    strokeWidth={0.5} 
                    fill="transparent" 
                  />
                  <Graticule 
                    stroke="#e2e8f0" 
                    strokeWidth={0.3} 
                  />
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const countryISO = geo.properties.ISO_A3
                        const country = getCountryByISO(countryISO)
                        
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={getCountryFill(geo)}
                            stroke="#cbd5e1"
                            strokeWidth={0.5}
                            style={{
                              default: {
                                outline: "none",
                                transition: "all 0.2s ease-in-out"
                              },
                              hover: {
                                fill: country ? "#1e40af" : "#64748b",
                                outline: "none",
                                transform: "scale(1.02)",
                                filter: "brightness(1.1)"
                              },
                              pressed: {
                                fill: "#1e3a8a",
                                outline: "none"
                              }
                            }}
                            onMouseEnter={() => {
                              if (country) {
                                setHoveredCountry(countryISO)
                                setTooltipContent(
                                  `${country.country}: ${country.count.toLocaleString()} visitors (${country.percentage.toFixed(1)}%)`
                                )
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredCountry(null)
                              setTooltipContent("")
                            }}
                            onClick={() => {
                              if (country) {
                                setSelectedCountry(selectedCountry === country.country ? null : country.country)
                              }
                            }}
                          />
                        )
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>

              {/* Tooltip */}
              {tooltipContent && (
                <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white z-10">
                  {tooltipContent}
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visitor Percentage
                </div>
                <div className="space-y-1">
                  {[
                    { range: "50%+", color: "#1e40af" },
                    { range: "20-49%", color: "#3b82f6" },
                    { range: "10-19%", color: "#60a5fa" },
                    { range: "5-9%", color: "#93c5fd" },
                    { range: "1-4%", color: "#dbeafe" },
                    { range: "No data", color: "#f8fafc" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm border border-gray-300"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {item.range}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Origin Countries
            </CardTitle>
            <CardDescription>
              Countries with the highest visitor numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {countryData.slice(0, 5).map((country, index) => (
                <div 
                  key={country.iso}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedCountry === country.country 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedCountry(selectedCountry === country.country ? null : country.country)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: getCountryColor(country.percentage) }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {country.country}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {country.count.toLocaleString()} visitors
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {country.percentage.toFixed(1)}%
                    </div>
                    <Progress 
                      value={country.percentage} 
                      className="w-16 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Visitor Summary
            </CardTitle>
            <CardDescription>
              Overview of global visitor distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalVisitors.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Visitors
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {countryData.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Countries
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Top Country ({countryData[0]?.country}):
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {countryData[0]?.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    International Visitors:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {countryData.filter(c => c.country !== 'Australia').reduce((sum, c) => sum + c.percentage, 0).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Avg. per Country:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {countryData.length > 0 ? Math.round(totalVisitors / countryData.length).toLocaleString() : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
