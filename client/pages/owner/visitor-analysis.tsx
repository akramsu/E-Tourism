"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const VisitorAnalysis: React.FC = () => {
  const [attraction, setAttraction] = useState<any>(null)
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null)
  const [demographics, setDemographics] = useState<Demographics | null>(null)
  const [behaviorInsights, setBehaviorInsights] = useState<BehaviorInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    console.log('VisitorAnalysis component mounted, checking authentication...')
    
    // Check for authentication token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      console.warn('No authentication token found')
      setError("Authentication required. Please login to view visitor analytics.")
      setIsLoading(false)
      return
    }
    
    console.log('Authentication token found, fetching data...')
    fetchVisitorData()
  }, [selectedPeriod])

  const fetchVisitorData = async () => {
    console.log('fetchVisitorData called with period:', selectedPeriod)
    
    // Re-check authentication before API calls
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setError("Authentication required. Please login to view visitor analytics.")
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)

      console.log('Fetching attraction data...')
      // Get attraction first
      const attractionResponse = await ownerApi.getMyAttraction()
      console.log('Attraction response:', attractionResponse)
      
      if (!attractionResponse?.success || !attractionResponse?.data) {
        console.error('No attraction found:', attractionResponse)
        setError("No attraction found. Please create an attraction first.")
        return
      }

      const attractionData = attractionResponse.data
      setAttraction(attractionData)
      console.log('Attraction data set:', attractionData)

      // Fetch visitor analytics with better error handling
      try {
        console.log('Fetching visitor analytics for attraction:', attractionData.id)
        const analyticsResponse = await ownerApi.getVisitorAnalytics(attractionData.id, { period: selectedPeriod })
        console.log('Analytics response:', analyticsResponse)
        
        if (analyticsResponse?.success && analyticsResponse?.data) {
          setAnalytics(analyticsResponse.data)
        } else {
          console.warn('Analytics not available:', analyticsResponse)
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
        if (error instanceof Error && error.message.includes('401')) {
          setError("Authentication expired. Please login again.")
          return
        }
        // Don't fail the whole component for one API call
      }

      // Fetch demographics with better error handling
      try {
        console.log('Fetching visitor demographics for attraction:', attractionData.id)
        const demographicsResponse = await ownerApi.getVisitorDemographics(attractionData.id, { period: selectedPeriod })
        console.log('Demographics response:', demographicsResponse)
        
        if (demographicsResponse?.success && demographicsResponse?.data) {
          setDemographics(demographicsResponse.data)
        } else {
          console.warn('Demographics not available:', demographicsResponse)
        }
      } catch (error) {
        console.error("Error fetching demographics:", error)
        if (error instanceof Error && error.message.includes('401')) {
          setError("Authentication expired. Please login again.")
          return
        }
        // Don't fail the whole component for one API call
      }

      // Fetch behavior insights with better error handling
      try {
        console.log('Fetching visitor behavior for attraction:', attractionData.id)
        const behaviorResponse = await ownerApi.getVisitorBehavior(attractionData.id, { period: selectedPeriod })
        console.log('Behavior response:', behaviorResponse)
        
        if (behaviorResponse?.success && behaviorResponse?.data) {
          setBehaviorInsights(behaviorResponse.data)
        } else {
          console.warn('Behavior insights not available:', behaviorResponse)
        }
      } catch (error) {
        console.error("Error fetching behavior:", error)
        if (error instanceof Error && error.message.includes('401')) {
          setError("Authentication expired. Please login again.")
          return
        }
        // Don't fail the whole component for one API call
      }

    } catch (err) {
      console.error("Error in fetchVisitorData:", err)
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('authentication') || err.message.includes('Unauthorized')) {
          setError("Authentication expired. Please login again.")
        } else if (err.message.includes('403') || err.message.includes('permission')) {
          setError("You don't have permission to access this data.")
        } else if (err.message.includes('404')) {
          setError("No attraction found. Please create an attraction first.")
        } else {
          setError(`Failed to load visitor analysis data: ${err.message}`)
        }
      } else {
        setError('Failed to load visitor analysis data: Unknown error')
      }
    } finally {
      setIsLoading(false)
      console.log('fetchVisitorData completed')
    }
  }

  const handleTestLogin = () => {
    // For testing purposes, set the authentication token we obtained earlier
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwOCwiZW1haWwiOiJ0ZXN0b3duZXJAdGVzdC5jb20iLCJyb2xlSWQiOjIsImlhdCI6MTc1ODUwNjA5NiwiZXhwIjoxNzU5MTEwODk2fQ.WJsQASqY_UGbMKgxI7Pxrv1ZnpyNOjRzA7HAhdXUre8"
    const testUser = {
      id: 108,
      username: "testowner",
      email: "testowner@test.com",
      roleId: 2,
      role: { id: 2, roleName: "OWNER" }
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', testToken)
      localStorage.setItem('user', JSON.stringify(testUser))
      console.log('Test authentication set, refreshing data...')
      setError(null)
      fetchVisitorData()
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading visitor analysis...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    const isAuthError = error.includes('Authentication') || error.includes('login')
    
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 space-x-2">
          {isAuthError ? (
            <>
              <Button 
                onClick={() => {
                  // Clear any stored data and redirect to login
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    window.location.href = '/auth/signin'
                  }
                }}
                variant="default"
              >
                Login
              </Button>
              <Button 
                onClick={handleTestLogin}
                variant="outline"
              >
                Test Login (Demo)
              </Button>
            </>
          ) : (
            <Button onClick={fetchVisitorData} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!attraction) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No attraction found. Please create an attraction first.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visitor Analysis</h1>
          <p className="text-muted-foreground">
            Analyze visitor patterns and behavior for {attraction.name}
          </p>
        </div>
        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-[180px]">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Avg Visit Duration</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {analytics ? formatDuration(analytics.avgVisitDuration) : '0m'}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics && analytics.visitDurationChange !== 0 ? (
                  <>
                    {analytics.visitDurationChange > 0 ? '+' : ''}
                    {analytics.visitDurationChange}% from last period
                  </>
                ) : (
                  'No change data available'
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Peak Hour</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {analytics?.peakHour || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Busiest time of day</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Repeat Visitors</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {analytics ? `${analytics.repeatVisitorRate}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">Customer loyalty rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Top Origin</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {analytics?.topOrigin || 'Unknown'}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics ? `${analytics.topOriginPercentage}% of visitors` : 'No data'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demographics and Behavior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visitor Demographics</CardTitle>
            <CardDescription>Age and gender breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Age Groups</h4>
                {demographics?.ageGroups && Array.isArray(demographics.ageGroups) && demographics.ageGroups.length > 0 ? (
                  demographics.ageGroups.slice(0, 3).map((group, index) => (
                    <div key={index} className="flex items-center justify-between mb-2">
                      <span className="text-sm">{group?.range || 'Unknown'}</span>
                      <span className="text-sm font-medium">{group?.percentage || 0}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No age data available</p>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Gender</h4>
                {demographics?.genderData && Array.isArray(demographics.genderData) && demographics.genderData.length > 0 ? (
                  demographics.genderData.map((gender, index) => (
                    <div key={index} className="flex items-center justify-between mb-2">
                      <span className="text-sm">{gender?.gender || 'Unknown'}</span>
                      <span className="text-sm font-medium">{gender?.percentage || 0}%</span>
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
            <CardTitle>Visitor Behavior Insights</CardTitle>
            <CardDescription>Key behavioral patterns and recommendations</CardDescription>
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
                <div className="text-center py-8">
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

export default VisitorAnalysis
