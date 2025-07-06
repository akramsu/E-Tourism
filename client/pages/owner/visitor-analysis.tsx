"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VisitorHeatmap } from "@/components/charts/visitor-heatmap"
import { VisitorOriginMap } from "@/components/charts/visitor-origin-map"
import { Clock, Users, MapPin, TrendingUp, Loader2, AlertCircle } from "lucide-react"
import { ownerApi } from "@/lib/api"

interface VisitorAnalytics {
  avgVisitDuration: number
  visitDurationChange: number
  peakHour: string
  repeatVisitorRate: number
  topOrigin: string
  topOriginPercentage: number
}

interface DurationDistribution {
  range: string
  count: number
  percentage: number
}

interface Demographics {
  ageGroups: Array<{
    range: string
    percentage: number
    count: number
  }>
  genderData: Array<{
    gender: string
    percentage: number
    count: number
  }>
}

interface BehaviorInsights {
  engagementLevel: string
  engagementDetails: string
  peakEfficiency: string
  peakDetails: string
  loyaltyInsight: string
  loyaltyDetails: string
  seasonalPattern: string
  seasonalDetails: string
}

export function VisitorAnalysis() {
  const [attraction, setAttraction] = useState<any>(null)
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null)
  const [demographics, setDemographics] = useState<Demographics | null>(null)
  const [durationDistribution, setDurationDistribution] = useState<DurationDistribution[]>([])
  const [behaviorInsights, setBehaviorInsights] = useState<BehaviorInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    fetchVisitorData()
  }, [selectedPeriod])

  const fetchVisitorData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get attraction first
      const attractionResponse = await ownerApi.getMyAttraction()
      if (!attractionResponse.success || !attractionResponse.data) {
        setError("No attraction found")
        return
      }

      const attractionData = attractionResponse.data
      setAttraction(attractionData)

      // Fetch all visitor analysis data in parallel
      const [
        analyticsResponse,
        demographicsResponse,
        behaviorResponse
      ] = await Promise.all([
        ownerApi.getVisitorAnalytics(attractionData.id, { period: selectedPeriod }),
        ownerApi.getVisitorDemographics(attractionData.id, { period: selectedPeriod }),
        ownerApi.getVisitorBehavior(attractionData.id, { period: selectedPeriod, includeComparisons: true })
      ])

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data)
        
        // Set duration distribution if available
        if (analyticsResponse.data.durationDistribution) {
          setDurationDistribution(analyticsResponse.data.durationDistribution)
        }
      }

      if (demographicsResponse.success && demographicsResponse.data) {
        setDemographics(demographicsResponse.data)
      }

      if (behaviorResponse.success && behaviorResponse.data) {
        setBehaviorInsights(behaviorResponse.data)
      }

    } catch (err) {
      console.error("Error fetching visitor data:", err)
      setError(err instanceof Error ? err.message : "Failed to load visitor analysis")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`
    }
    return `${hours.toFixed(1)}h`
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading visitor analysis...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={fetchVisitorData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // No attraction state
  if (!attraction) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Attraction Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create an attraction to view visitor analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visitor Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400">Analyze visitor patterns for {attraction?.name}</p>
        </div>
        <Select
          value={selectedPeriod}
          onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') => setSelectedPeriod(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Visitor Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visit Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? formatDuration(analytics.avgVisitDuration) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics ? formatPercentage(analytics.visitDurationChange) + " from last period" : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.peakHour || "N/A"}</div>
            <p className="text-xs text-muted-foreground">highest visitor count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.repeatVisitorRate || 0}%</div>
            <p className="text-xs text-muted-foreground">returning customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Origin</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.topOrigin || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.topOriginPercentage || 0}% of visitors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Patterns */}
      <div className="grid gap-6 md:grid-cols-2">
        <VisitorHeatmap />
        <VisitorOriginMap />
      </div>

      {/* Demographics and Behavior */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Visit Duration Distribution</CardTitle>
            <CardDescription>How long visitors stay at your attraction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {durationDistribution.length > 0 ? (
                durationDistribution.map((duration, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{duration.range}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${duration.percentage}%` }} 
                        />
                      </div>
                      <span className="text-xs">{duration.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No duration data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitor Demographics</CardTitle>
            <CardDescription>Age and gender breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Age Groups</h4>
                {demographics?.ageGroups.length ? (
                  demographics.ageGroups.slice(0, 3).map((group, index) => (
                    <div key={index} className="flex items-center justify-between mb-2">
                      <span className="text-sm">{group.range}</span>
                      <span className="text-sm font-medium">{group.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No age data available</p>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Gender</h4>
                {demographics?.genderData.length ? (
                  demographics.genderData.map((gender, index) => (
                    <div key={index} className="flex items-center justify-between mb-2">
                      <span className="text-sm">{gender.gender}</span>
                      <span className="text-sm font-medium">{gender.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No gender data available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitor Behavior</CardTitle>
            <CardDescription>Key behavioral insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {behaviorInsights ? (
                <>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <h4 className="font-medium text-green-800 dark:text-green-200 text-sm">
                      {behaviorInsights.engagementLevel}
                    </h4>
                    <p className="text-xs text-green-600 dark:text-green-300">
                      {behaviorInsights.engagementDetails}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                      {behaviorInsights.peakEfficiency}
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      {behaviorInsights.peakDetails}
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 text-sm">
                      {behaviorInsights.loyaltyInsight}
                    </h4>
                    <p className="text-xs text-purple-600 dark:text-purple-300">
                      {behaviorInsights.loyaltyDetails}
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200 text-sm">
                      {behaviorInsights.seasonalPattern}
                    </h4>
                    <p className="text-xs text-orange-600 dark:text-orange-300">
                      {behaviorInsights.seasonalDetails}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No behavioral insights available</p>
                  <p className="text-xs text-gray-400">Visit data needed to generate insights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
