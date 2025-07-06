"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ForecastChart } from "@/components/charts/forecast-chart"
import { AIInsightsPanel } from "@/components/ai/insights-panel"
import { ownerApi } from "@/lib/api"
import { Calendar, Users, DollarSign, AlertTriangle, Loader2, AlertCircle } from "lucide-react"

interface ForecastData {
  nextWeekVisitors: number
  nextMonthRevenue: number
  capacityAlerts: number
  optimalPrice: number
}

interface CapacityData {
  date: string
  day: string
  forecast: number
  capacity: number
  status: 'low' | 'optimal' | 'high' | 'critical'
}

interface StaffingRecommendation {
  type: 'increase' | 'decrease' | 'optimize'
  title: string
  description: string
  details?: Record<string, string>
  savings?: number
}

interface PricingRecommendation {
  period: string
  currentPrice: number
  demand: string
  recommendation: string
}

export function ForecastsPlanning() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attraction, setAttraction] = useState<any>(null)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [capacityPlanning, setCapacityPlanning] = useState<CapacityData[]>([])
  const [staffingRecommendations, setStaffingRecommendations] = useState<StaffingRecommendation[]>([])
  const [pricingRecommendations, setPricingRecommendations] = useState<PricingRecommendation[]>([])

  useEffect(() => {
    loadForecastingData()
  }, [])

  const loadForecastingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get owner's attraction first
      const attractionResponse = await ownerApi.getMyAttraction()
      if (!attractionResponse.success || !attractionResponse.data) {
        throw new Error("No attraction found for this owner")
      }

      const attractionData = attractionResponse.data
      setAttraction(attractionData)

      // Load all forecasting data in parallel
      const [
        forecastResponse,
        revenueResponse,
        capacityResponse,
        pricingResponse
      ] = await Promise.all([
        ownerApi.getForecastData(attractionData.id, { forecastType: 'visitors', period: 'month' }),
        ownerApi.getForecastData(attractionData.id, { forecastType: 'revenue', period: 'month', includeScenarios: true }),
        ownerApi.getCapacityPlanning(attractionData.id, { period: 'week', includeOptimization: true }),
        ownerApi.getPricingRecommendations(attractionData.id, { period: 'month', includeDynamicPricing: true })
      ])

      // Process forecast data
      if (forecastResponse.success && forecastResponse.data) {
        const forecast = forecastResponse.data
        setForecastData({
          nextWeekVisitors: forecast.nextWeekVisitors || 0,
          nextMonthRevenue: forecast.nextMonthRevenue || 0,
          capacityAlerts: forecast.capacityAlerts || 0,
          optimalPrice: forecast.optimalPrice || attractionData.price || 0
        })
      }

      // Process capacity planning data
      if (capacityResponse.success && capacityResponse.data) {
        setCapacityPlanning(capacityResponse.data.dailyCapacity || [])
        setStaffingRecommendations(capacityResponse.data.staffingRecommendations || [])
      }

      // Process pricing recommendations
      if (pricingResponse.success && pricingResponse.data) {
        setPricingRecommendations(pricingResponse.data.recommendations || [])
      }

    } catch (err: any) {
      console.error("Error loading forecasting data:", err)
      setError(err.message || "Failed to load forecasting data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Loading forecasting data...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Planning Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Week Forecast</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {forecastData?.nextWeekVisitors?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">expected visitors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Projection</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  IDR {forecastData?.nextMonthRevenue ? (forecastData.nextMonthRevenue / 1000).toFixed(0) + 'K' : '0'}
                </div>
                <p className="text-xs text-muted-foreground">next month estimate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capacity Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{forecastData?.capacityAlerts || 0}</div>
                <p className="text-xs text-muted-foreground">high-capacity days ahead</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Optimal Pricing</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  IDR {forecastData?.optimalPrice?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">recommended peak price</p>
              </CardContent>
            </Card>
          </div>

          {/* Forecasting Charts */}
          <div className="grid gap-6 md:grid-cols-3">
            <ForecastChart />
            <AIInsightsPanel />
          </div>

          {/* Planning Tools */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Capacity Planning</CardTitle>
                <CardDescription>Upcoming high-demand periods and staffing recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {capacityPlanning.length > 0 ? (
                    capacityPlanning.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{day.day}</div>
                          <div className="text-sm text-muted-foreground">{day.date}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{day.forecast} visitors</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((day.forecast / day.capacity) * 100)}% capacity
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            day.status === "critical"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              : day.status === "high"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                : day.status === "optimal"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                          }`}
                        >
                          {day.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No capacity planning data available</p>
                      <p className="text-xs">Data will appear once you have visitor history</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staffing Recommendations</CardTitle>
                <CardDescription>AI-powered staffing optimization based on forecasts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffingRecommendations.length > 0 ? (
                    staffingRecommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          recommendation.type === "increase"
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : recommendation.type === "decrease"
                              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                              : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                        }`}
                      >
                        <h4
                          className={`font-medium mb-2 ${
                            recommendation.type === "increase"
                              ? "text-blue-800 dark:text-blue-200"
                              : recommendation.type === "decrease"
                                ? "text-green-800 dark:text-green-200"
                                : "text-purple-800 dark:text-purple-200"
                          }`}
                        >
                          {recommendation.title}
                        </h4>
                        <p
                          className={`text-sm mb-3 ${
                            recommendation.type === "increase"
                              ? "text-blue-700 dark:text-blue-300"
                              : recommendation.type === "decrease"
                                ? "text-green-700 dark:text-green-300"
                                : "text-purple-700 dark:text-purple-300"
                          }`}
                        >
                          {recommendation.description}
                        </p>
                        {recommendation.details && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(recommendation.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium ml-1">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {recommendation.savings && (
                          <div className="text-xs mt-2">
                            <span className="text-muted-foreground">Estimated savings:</span>
                            <span className="font-medium ml-1 text-green-600">
                              IDR {recommendation.savings.toLocaleString()}/day
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No staffing recommendations available</p>
                      <p className="text-xs">Recommendations will appear based on visitor patterns</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue and Pricing */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Pricing Recommendations</CardTitle>
                <CardDescription>Optimize pricing based on demand forecasts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pricingRecommendations.length > 0 ? (
                    pricingRecommendations.map((pricing, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{pricing.period}</div>
                          <div className="text-sm text-muted-foreground">
                            Current: IDR {pricing.currentPrice.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{pricing.recommendation}</div>
                          <div
                            className={`text-xs ${
                              pricing.demand === "Critical"
                                ? "text-red-600"
                                : pricing.demand === "High"
                                  ? "text-yellow-600"
                                  : pricing.demand === "Low"
                                    ? "text-blue-600"
                                    : "text-green-600"
                            }`}
                          >
                            {pricing.demand} demand
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pricing recommendations available</p>
                      <p className="text-xs">Recommendations will appear based on demand patterns</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Optimization</CardTitle>
                <CardDescription>Strategies to maximize revenue per visitor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <h4 className="font-medium text-green-800 dark:text-green-200 text-sm">Bundle Packages</h4>
                    <p className="text-xs text-green-600 dark:text-green-300">
                      Create combo tickets with nearby attractions (+15% revenue potential)
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">Premium Experiences</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Offer VIP tours during peak hours (+25% per visitor)
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 text-sm">Merchandise Strategy</h4>
                    <p className="text-xs text-purple-600 dark:text-purple-300">
                      Expand gift shop offerings based on visitor demographics
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200 text-sm">Food & Beverage</h4>
                    <p className="text-xs text-orange-600 dark:text-orange-300">
                      Add café services during high-traffic periods
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
