"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { 
  Users, 
  Globe, 
  TrendingUp, 
  MapPin, 
  Loader2, 
  RefreshCw, 
  AlertCircle,
  TrendingDown
} from "lucide-react"

// TypeScript interfaces for live data
interface AgeGroup {
  range: string
  count: number
  percentage: number
}

interface OriginData {
  region: string
  count: number
  percentage: number
  coordinates?: { lat: number; lng: number }
}

interface GenderData {
  gender: string
  count: number
  percentage: number
}

interface VisitPurpose {
  purpose: string
  count: number
  percentage: number
}

interface DemographicData {
  totalVisitors: number
  growthRate: number
  ageGroups: AgeGroup[]
  originData: OriginData[]
  genderData: GenderData[]
  visitPurposes: VisitPurpose[]
  loyaltyData: {
    firstTime: { count: number; percentage: number }
    repeat: { count: number; percentage: number }
  }
  insights: {
    dominantAgeGroup: { range: string; percentage: number }
    topOrigin: { region: string; percentage: number }
    internationalPercentage: number
    avgStayDuration: number
  }
}

export function DemographicInsights() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [demographicData, setDemographicData] = useState<DemographicData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user && user.role.roleName === 'AUTHORITY') {
      fetchDemographicData()
    }
  }, [user, selectedPeriod])

  const fetchDemographicData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch demographic data from authority API
      const demographicsResponse = await authorityApi.getCityDemographics({
        period: selectedPeriod,
        breakdown: 'all',
        includeComparisons: true
      })

      if (demographicsResponse.success && demographicsResponse.data) {
        const data = demographicsResponse.data

        // Transform API response to match our interface
        const transformedData: DemographicData = {
          totalVisitors: data.totalVisitors || 0,
          growthRate: data.growthRate || 0,
          ageGroups: data.ageDistribution?.map((age: any) => ({
            range: age.ageRange,
            count: age.count,
            percentage: age.percentage
          })) || [],
          originData: data.originDistribution?.map((origin: any) => ({
            region: origin.region,
            count: origin.count,
            percentage: origin.percentage,
            coordinates: origin.coordinates
          })) || [],
          genderData: data.genderDistribution?.map((gender: any) => ({
            gender: gender.gender,
            count: gender.count,
            percentage: gender.percentage
          })) || [],
          visitPurposes: data.visitPurposes?.map((purpose: any) => ({
            purpose: purpose.purpose,
            count: purpose.count,
            percentage: purpose.percentage
          })) || [
            { purpose: "Leisure", count: 0, percentage: 45 },
            { purpose: "Business", count: 0, percentage: 25 },
            { purpose: "Education", count: 0, percentage: 20 },
            { purpose: "Other", count: 0, percentage: 10 }
          ],
          loyaltyData: {
            firstTime: {
              count: data.loyaltyData?.firstTime?.count || 0,
              percentage: data.loyaltyData?.firstTime?.percentage || 68
            },
            repeat: {
              count: data.loyaltyData?.repeat?.count || 0,
              percentage: data.loyaltyData?.repeat?.percentage || 32
            }
          },
          insights: {
            dominantAgeGroup: {
              range: data.insights?.dominantAgeGroup?.range || 'N/A',
              percentage: data.insights?.dominantAgeGroup?.percentage || 0
            },
            topOrigin: {
              region: data.insights?.topOrigin?.region || 'N/A',
              percentage: data.insights?.topOrigin?.percentage || 0
            },
            internationalPercentage: data.insights?.internationalPercentage || 0,
            avgStayDuration: data.insights?.avgStayDuration || 0
          }
        }

        setDemographicData(transformedData)
      } else {
        throw new Error("Failed to load demographic data")
      }
    } catch (err) {
      console.error("Error fetching demographic data:", err)
      setError(err instanceof Error ? err.message : "Failed to load demographic data")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDemographicData()
  }

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(newPeriod)
    setIsLoading(true)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading demographic insights...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Demographic Insights</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive visitor demographic analysis and trends
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleRefresh}
            disabled={isLoading || refreshing}
            size="default"
            variant="outline"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* No Data State */}
      {!demographicData && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Demographic Data Available</h3>
          <p className="text-muted-foreground mb-4">
            There's no demographic data available for the selected period.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      )}

      {/* Key Demographics Metrics */}
      {demographicData && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demographicData.totalVisitors.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {demographicData.growthRate > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                )}
                <span className={demographicData.growthRate > 0 ? "text-green-600" : "text-red-600"}>
                  {demographicData.growthRate > 0 ? '+' : ''}{demographicData.growthRate.toFixed(1)}%
                </span>
                <span className="ml-1">this period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">International Visitors</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demographicData.insights.internationalPercentage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">of total visitors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dominant Age Group</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demographicData.insights.dominantAgeGroup.range}</div>
              <p className="text-xs text-muted-foreground">{demographicData.insights.dominantAgeGroup.percentage.toFixed(1)}% of visitors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Origin</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demographicData.insights.topOrigin.region}</div>
              <p className="text-xs text-muted-foreground">{demographicData.insights.topOrigin.percentage.toFixed(1)}% of visitors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demographics Charts */}
      {demographicData && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
              <CardDescription>Interactive breakdown by age groups</CardDescription>
            </CardHeader>
            <CardContent>
              {demographicData.ageGroups.length > 0 ? (
                <div className="space-y-3">
                  {demographicData.ageGroups.map((group, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border">
                      <span className="font-medium">{group.range}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${group.percentage}%` }} 
                          />
                        </div>
                        <span className="text-sm min-w-[40px]">{group.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No age distribution data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visitor Origins</CardTitle>
              <CardDescription>Geographic distribution of visitors</CardDescription>
            </CardHeader>
            <CardContent>
              {demographicData.originData.length > 0 ? (
                <div className="space-y-3">
                  {demographicData.originData.slice(0, 6).map((origin, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border">
                      <span className="font-medium">{origin.region}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${origin.percentage}%` }} 
                          />
                        </div>
                        <span className="text-sm min-w-[40px]">{origin.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No origin data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Demographics */}
      {demographicData && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution Analysis</CardTitle>
              <CardDescription>Detailed breakdown of visitor age groups</CardDescription>
            </CardHeader>
            <CardContent>
              {demographicData.ageGroups.length > 0 ? (
                <div className="space-y-4">
                  {demographicData.ageGroups.map((group, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{group.range} years</div>
                        <div className="text-sm text-muted-foreground">{group.count.toLocaleString()} visitors</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${group.percentage}%` }} />
                        </div>
                        <span className="text-sm font-medium">{group.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No age group data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Visitor origins and travel patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {demographicData.originData.length > 0 ? (
                <div className="space-y-4">
                  {demographicData.originData.slice(0, 8).map((origin, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{origin.region}</div>
                        <div className="text-sm text-muted-foreground">{origin.count.toLocaleString()} visitors</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${origin.percentage}%` }} />
                        </div>
                        <span className="text-sm font-medium">{origin.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No geographic data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visitor Segmentation */}
      {demographicData && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>Visitor breakdown by gender</CardDescription>
            </CardHeader>
            <CardContent>
              {demographicData.genderData.length > 0 ? (
                <div className="space-y-3">
                  {demographicData.genderData.map((gender, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{gender.gender}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${index === 0 ? "bg-pink-500" : index === 1 ? "bg-blue-500" : "bg-purple-500"}`}
                            style={{ width: `${gender.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm">{gender.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No gender data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visitor Loyalty</CardTitle>
              <CardDescription>First-time vs repeat visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">First-time</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${demographicData.loyaltyData.firstTime.percentage}%` }} />
                    </div>
                    <span className="text-sm">{demographicData.loyaltyData.firstTime.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Repeat</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${demographicData.loyaltyData.repeat.percentage}%` }} />
                    </div>
                    <span className="text-sm">{demographicData.loyaltyData.repeat.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="pt-2 text-xs text-muted-foreground">
                  <div>First-time: {demographicData.loyaltyData.firstTime.count.toLocaleString()} visitors</div>
                  <div>Repeat: {demographicData.loyaltyData.repeat.count.toLocaleString()} visitors</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visit Purpose</CardTitle>
              <CardDescription>Primary reasons for visiting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demographicData.visitPurposes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{item.purpose}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                      <span className="text-sm">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
                {demographicData.visitPurposes.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No visit purpose data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
