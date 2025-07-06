"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Loader2, Users, DollarSign, Clock, Star, Target, Building2, MapPin } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ownerApi, authorityApi } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface MetricCardProps {
  // For basic usage (when data is already provided)
  title?: string
  value?: string
  change?: string
  trend?: "up" | "down"
  icon?: LucideIcon
  gradient?: string
  
  // For smart fetching (when component should fetch its own data)
  metricType?: 'totalVisitors' | 'revenue' | 'avgDuration' | 'rating' | 'growthRate' | 'capacity' | 'activeAttractions' | 'avgSatisfaction' | 'topAttraction'
  attractionId?: number
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year'
  className?: string
}

interface MetricData {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: LucideIcon
  gradient: string
}

const MetricConfig = {
  totalVisitors: {
    title: "Total Visitors",
    icon: Users,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  revenue: {
    title: "Revenue",
    icon: DollarSign,
    gradient: "bg-gradient-to-br from-green-500 to-green-600",
  },
  avgDuration: {
    title: "Avg. Visit Duration",
    icon: Clock,
    gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
  },
  rating: {
    title: "Customer Rating",
    icon: Star,
    gradient: "bg-gradient-to-br from-yellow-500 to-yellow-600",
  },
  growthRate: {
    title: "Growth Rate",
    icon: TrendingUp,
    gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  capacity: {
    title: "Capacity",
    icon: Target,
    gradient: "bg-gradient-to-br from-red-500 to-red-600",
  },
  activeAttractions: {
    title: "Active Attractions",
    icon: Building2,
    gradient: "bg-gradient-to-br from-green-500 to-emerald-600",
  },
  avgSatisfaction: {
    title: "Avg Satisfaction",
    icon: Star,
    gradient: "bg-gradient-to-br from-orange-500 to-red-600",
  },
  topAttraction: {
    title: "Top Attraction",
    icon: MapPin,
    gradient: "bg-gradient-to-br from-teal-500 to-blue-600",
  },
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  gradient,
  metricType,
  attractionId,
  period = 'month',
  className = ""
}: MetricCardProps) {
  const [metricData, setMetricData] = useState<MetricData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // If all basic props are provided, use them directly
  const isBasicMode = title && value && change && trend && Icon && gradient

  useEffect(() => {
    if (!isBasicMode && metricType) {
      fetchMetricData()
    }
  }, [metricType, attractionId, period, user?.role?.roleName, isBasicMode])

  const fetchMetricData = async () => {
    if (!metricType || !user) return

    setIsLoading(true)
    setError(null)

    try {
      let data: any = null
      const userRole = user.role?.roleName?.toLowerCase()

      if (userRole === 'owner' && attractionId) {
        // Fetch owner-specific metrics
        const response = await ownerApi.getPerformanceMetrics(attractionId, { 
          period: period === 'today' ? 'week' : period === 'quarter' ? 'month' : period as 'today' | 'week' | 'month' | 'year',
          includeComparisons: true 
        })
        
        if (response.success && response.data) {
          data = response.data
        }
      } else if (userRole === 'authority') {
        // Fetch authority-specific city-wide metrics
        const response = await authorityApi.getCityMetrics({ 
          period: period === 'today' ? 'week' : period === 'year' ? 'quarter' : period,
          includeComparisons: true 
        })
        
        if (response.success && response.data) {
          data = response.data
        }
      }

      if (data) {
        const metricValue = getMetricValue(data, metricType)
        if (metricValue) {
          setMetricData(formatMetricData(metricType, metricValue))
        }
      }
    } catch (err) {
      console.error(`Error fetching ${metricType} metric:`, err)
      setError(err instanceof Error ? err.message : "Failed to load metric")
    } finally {
      setIsLoading(false)
    }
  }

  const getMetricValue = (data: any, type: string) => {
    switch (type) {
      case 'totalVisitors':
        return data.totalVisitors || data.visitors
      case 'revenue':
        return data.revenue || data.totalRevenue
      case 'avgDuration':
        return data.avgDuration || data.averageDuration
      case 'rating':
        return data.rating || data.averageRating
      case 'growthRate':
        return data.growthRate || data.growth
      case 'capacity':
        return data.capacity || data.capacityUtilization
      case 'activeAttractions':
        return data.activeAttractions || data.totalAttractions
      case 'avgSatisfaction':
        return data.avgSatisfaction || data.averageRating
      case 'topAttraction':
        return data.topAttraction || data.topPerformer
      default:
        return null
    }
  }

  const formatMetricData = (type: string, value: any): MetricData => {
    const config = MetricConfig[type as keyof typeof MetricConfig]
    
    const formatValue = (val: any) => {
      if (!val || (typeof val === 'object' && val.value === undefined)) return "N/A"
      
      const numericValue = typeof val === 'object' ? val.value : val
      
      switch (type) {
        case 'totalVisitors':
        case 'activeAttractions':
          return new Intl.NumberFormat("en-US").format(numericValue)
        case 'revenue':
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(numericValue)
        case 'avgDuration':
          return `${Number(numericValue).toFixed(1)} hrs`
        case 'rating':
        case 'avgSatisfaction':
          return `${Number(numericValue).toFixed(1)}/5`
        case 'growthRate':
          return `${numericValue > 0 ? '+' : ''}${Number(numericValue).toFixed(1)}%`
        case 'capacity':
          return `${Number(numericValue).toFixed(0)}%`
        case 'topAttraction':
          return typeof numericValue === 'string' ? numericValue : "N/A"
        default:
          return String(numericValue)
      }
    }

    const formatChange = (val: any) => {
      if (!val || (typeof val === 'object' && val.change === undefined)) return "No data"
      
      const changeValue = typeof val === 'object' ? val.change : 0
      const periodText = typeof val === 'object' ? val.period || period : period
      
      if (type === 'topAttraction') {
        return "Highest revenue generator"
      }
      
      return `${changeValue > 0 ? '+' : ''}${Number(changeValue).toFixed(1)}% from last ${periodText}`
    }

    const getTrend = (val: any): "up" | "down" => {
      if (!val || (typeof val === 'object' && val.change === undefined)) return "up"
      
      const changeValue = typeof val === 'object' ? val.change : val
      return Number(changeValue) >= 0 ? "up" : "down"
    }

    return {
      title: config.title,
      value: formatValue(value),
      change: formatChange(value),
      trend: getTrend(value),
      icon: config.icon,
      gradient: config.gradient,
    }
  }

  // Loading state for smart mode
  if (!isBasicMode && isLoading) {
    const config = metricType ? MetricConfig[metricType as keyof typeof MetricConfig] : null
    
    return (
      <Card className={`relative overflow-hidden border-0 shadow-lg ${className}`}>
        <div className={`absolute inset-0 ${config?.gradient || 'bg-gradient-to-br from-gray-500 to-gray-600'} opacity-90`} />
        <CardContent className="relative p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-20 bg-white/20 mb-2" />
              <Skeleton className="h-8 w-16 bg-white/20 mb-2" />
              <Skeleton className="h-3 w-24 bg-white/20" />
            </div>
            <div className="bg-white/20 p-2 sm:p-3 rounded-full backdrop-blur-sm ml-2 flex-shrink-0">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state for smart mode
  if (!isBasicMode && error) {
    const config = metricType ? MetricConfig[metricType as keyof typeof MetricConfig] : null
    
    return (
      <Card className={`relative overflow-hidden border-0 shadow-lg ${className}`}>
        <div className={`absolute inset-0 ${config?.gradient || 'bg-gradient-to-br from-gray-500 to-gray-600'} opacity-90`} />
        <CardContent className="relative p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-xs sm:text-sm font-medium truncate">
                {config?.title || "Error"}
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 truncate">
                N/A
              </p>
              <p className="text-xs sm:text-sm text-white/60 truncate">
                Failed to load
              </p>
            </div>
            <div className="bg-white/20 p-2 sm:p-3 rounded-full backdrop-blur-sm ml-2 flex-shrink-0">
              {config?.icon && <config.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Determine which data to use
  const displayData = isBasicMode 
    ? { title, value, change, trend, icon: Icon, gradient }
    : metricData

  if (!displayData) {
    return null
  }

  return (
    <Card className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className={`absolute inset-0 ${displayData.gradient} opacity-90`} />
      <CardContent className="relative p-3 sm:p-4 lg:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-white/80 text-xs sm:text-sm font-medium truncate">
              {displayData.title}
            </p>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 truncate">
              {displayData.value}
            </p>
            <div className="flex items-center mt-1 sm:mt-2">
              {displayData.trend === "up" ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium truncate">
                {displayData.change}
              </span>
            </div>
          </div>
          <div className="bg-white/20 p-2 sm:p-3 rounded-full backdrop-blur-sm ml-2 flex-shrink-0">
            <displayData.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
