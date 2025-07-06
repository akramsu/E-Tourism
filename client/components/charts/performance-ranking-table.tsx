"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Search, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { ownerApi, authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface PerformanceRankingData {
  attractionId: number
  rank: number
  name: string
  category: string
  visitors: number
  revenue: number
  rating: number
  capacityUtilization: number
  growthRate: number
  performanceScore: number
}

interface PerformanceRankingTableProps {
  attractionId?: number
  period?: 'week' | 'month' | 'quarter' | 'year'
  metrics?: string[]
  includeComparisons?: boolean
  isAuthorityContext?: boolean
  showCityWideData?: boolean
}

type SortField = "rank" | "visitors" | "revenue" | "rating" | "capacityUtilization" | "growthRate"
type SortDirection = "asc" | "desc"

export function PerformanceRankingTable({
  attractionId,
  period = 'month',
  metrics = ['visitors', 'revenue', 'rating'],
  includeComparisons = true,
  isAuthorityContext = false,
  showCityWideData = false
}: PerformanceRankingTableProps) {
  const { user } = useAuth()
  const [sortField, setSortField] = useState<SortField>("rank")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchTerm, setSearchTerm] = useState("")
  const [data, setData] = useState<PerformanceRankingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getChartTitle = () => {
    if (isAuthorityContext && showCityWideData) {
      return "City-Wide Performance Rankings"
    } else if (isAuthorityContext) {
      return "Attraction Performance Rankings"
    }
    return "Attraction Performance Rankings"
  }

  const getChartDescription = () => {
    if (isAuthorityContext && showCityWideData) {
      return "Comprehensive performance metrics and rankings across all city attractions"
    }
    return "Comprehensive performance metrics and rankings"
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let response
        
        if (isAuthorityContext && user?.role?.roleName === 'AUTHORITY') {
          if (showCityWideData || !attractionId) {
            // Fetch city-wide performance rankings
            response = await authorityApi.getPerformanceRankings({
              period,
              metrics
            })
          } else {
            // Authority viewing specific attraction performance data
            response = await authorityApi.getAttractionStatistics(attractionId, {
              period
            })
            
            // Transform single attraction data to ranking format if needed
            if (response.success && response.data) {
              const attractionData = response.data
              const transformedData: PerformanceRankingData[] = [{
                attractionId: attractionId,
                rank: 1, // Single attraction always rank 1
                name: attractionData.name || 'Attraction',
                category: attractionData.category || 'Tourist Attraction',
                visitors: attractionData.totalVisitors || 0,
                revenue: attractionData.totalRevenue || 0,
                rating: attractionData.averageRating || 0,
                capacityUtilization: attractionData.capacityUtilization || 0,
                growthRate: attractionData.growthRate || 0,
                performanceScore: attractionData.performanceScore || 0
              }]
              setData(transformedData)
              return
            }
          }
        } else {
          // Owner viewing their own attraction performance
          if (!attractionId) {
            setError('Attraction ID is required for performance data')
            return
          }
          
          response = await ownerApi.getAttractionPerformanceData(attractionId, {
            period,
            metrics,
            includeComparisons
          })
        }

        if (response && response.success) {
          setData(response.data || [])
        } else {
          setError(response?.message || 'Failed to load performance ranking data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load performance ranking data')
        console.error('Error fetching performance ranking data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [attractionId, period, metrics, includeComparisons, isAuthorityContext, showCityWideData, user])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedData = data
    .filter(
      (item: PerformanceRankingData) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a: PerformanceRankingData, b: PerformanceRankingData) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const multiplier = sortDirection === "asc" ? 1 : -1

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * multiplier
      }
      return String(aValue).localeCompare(String(bValue)) * multiplier
    })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" onClick={() => handleSort(field)} className="h-8 px-2 text-xs font-medium">
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  )

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>{getChartDescription()}</CardDescription>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search attractions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading performance rankings...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Error loading performance rankings: {error}</p>
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
            <p>No performance data available for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <SortButton field="rank">Rank</SortButton>
                  </th>
                  <th className="text-left p-2">Attraction</th>
                  <th className="text-left p-2">
                    <SortButton field="visitors">Visitors</SortButton>
                  </th>
                  <th className="text-left p-2">
                    <SortButton field="revenue">Revenue</SortButton>
                  </th>
                  <th className="text-left p-2">
                    <SortButton field="rating">Rating</SortButton>
                  </th>
                  <th className="text-left p-2">
                    <SortButton field="capacityUtilization">Capacity</SortButton>
                  </th>
                  <th className="text-left p-2">
                    <SortButton field="growthRate">Growth</SortButton>
                  </th>
                  <th className="text-left p-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((attraction: PerformanceRankingData) => (
                  <tr key={attraction.attractionId} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <Badge variant={attraction.rank <= 3 ? "default" : "secondary"}>#{attraction.rank}</Badge>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{attraction.name}</div>
                        <div className="text-sm text-muted-foreground">{attraction.category}</div>
                      </div>
                    </td>
                    <td className="p-2 font-mono">{attraction.visitors.toLocaleString()}</td>
                    <td className="p-2 font-mono">${attraction.revenue.toLocaleString()}</td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <span className="font-medium">{attraction.rating}</span>
                        <span className="text-muted-foreground ml-1">/5</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${attraction.capacityUtilization}%` }}
                          />
                        </div>
                        <span className="text-sm">{attraction.capacityUtilization}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center">
                        {attraction.growthRate > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={attraction.growthRate > 0 ? "text-green-600" : "text-red-600"}>
                          {attraction.growthRate > 0 ? "+" : ""}
                          {attraction.growthRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          attraction.performanceScore >= 85
                            ? "default"
                            : attraction.performanceScore >= 70
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {attraction.performanceScore}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
