"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowUpDown, Search, TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react"
import { authorityApi } from "@/lib/api"

interface AuthorityPerformanceRankingData {
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
  revenuePerVisitor: number
}

interface AuthorityPerformanceRankingTableProps {
  period?: 'week' | 'month' | 'quarter' | 'year'
  metrics?: string[]
  limit?: number
}

type SortField = "rank" | "visitors" | "revenue" | "rating" | "capacityUtilization" | "growthRate" | "revenuePerVisitor"
type SortDirection = "asc" | "desc"

export function AuthorityPerformanceRankingTable({
  period = 'month',
  metrics = ['visitors', 'revenue', 'rating'],
  limit = 20
}: AuthorityPerformanceRankingTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchTerm, setSearchTerm] = useState("")
  const [data, setData] = useState<AuthorityPerformanceRankingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await authorityApi.getPerformanceRankings({
          period,
          metrics,
          sortBy: sortField,
          sortOrder: sortDirection,
          limit
        })
        
        if (response.success && response.data) {
          // Transform the API response to match our interface
          const transformedData: AuthorityPerformanceRankingData[] = response.data.attractions.map((attraction: any, index: number) => ({
            attractionId: attraction.id,
            rank: index + 1,
            name: attraction.name,
            category: attraction.category,
            visitors: attraction.visitors || 0,
            revenue: attraction.revenue || 0,
            rating: attraction.rating || 0,
            capacityUtilization: attraction.capacityUtilization || 0,
            growthRate: attraction.growthRate || 0,
            performanceScore: attraction.performanceScore || 0,
            revenuePerVisitor: attraction.revenuePerVisitor || 0
          }))
          setData(transformedData)
        } else {
          setData([])
        }
      } catch (err) {
        console.error('Error fetching authority performance ranking data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load performance ranking data')
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period, metrics, limit])

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
      (item: AuthorityPerformanceRankingData) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a: AuthorityPerformanceRankingData, b: AuthorityPerformanceRankingData) => {
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Rankings</CardTitle>
          <CardDescription>City-wide attraction performance comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Performance Rankings
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          City-wide attraction performance comparison for {period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attractions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No performance data available for the selected period.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <SortButton field="rank">Rank</SortButton>
                    </th>
                    <th className="px-3 py-3 text-left min-w-[200px]">Attraction</th>
                    <th className="px-3 py-3 text-left">Category</th>
                    <th className="px-3 py-3 text-right">
                      <SortButton field="visitors">Visitors</SortButton>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortButton field="revenue">Revenue</SortButton>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortButton field="revenuePerVisitor">$/Visitor</SortButton>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortButton field="rating">Rating</SortButton>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortButton field="capacityUtilization">Capacity</SortButton>
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortButton field="growthRate">Growth</SortButton>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((item) => (
                    <tr key={item.attractionId} className="border-b hover:bg-muted/50">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{item.rank}</span>
                          {item.rank <= 3 && (
                            <Badge variant="secondary" className="text-xs">
                              Top {item.rank}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Score: {item.performanceScore.toFixed(1)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-right font-medium">
                        {item.visitors.toLocaleString()}
                      </td>
                      <td className="px-3 py-4 text-right font-medium">
                        ${item.revenue.toLocaleString()}
                      </td>
                      <td className="px-3 py-4 text-right font-medium">
                        ${item.revenuePerVisitor.toFixed(2)}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-medium">{item.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">/5</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-medium">{item.capacityUtilization.toFixed(0)}</span>
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.growthRate > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={`font-medium text-xs ${
                              item.growthRate > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {item.growthRate > 0 ? "+" : ""}{item.growthRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredAndSortedData.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground">
            Showing {filteredAndSortedData.length} of {data.length} attractions
          </div>
        )}
      </CardContent>
    </Card>
  )
}
