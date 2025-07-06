"use client"

import { useState, useEffect } from "react"
import { aiInsightsApi } from "@/lib/api"

// Types based on database schema
interface PredictiveModel {
  id: number
  predictionType: string
  predictedValue: number
  generatedDate: string
  modelData: string
  createdById: number
  attractionId?: number
}

interface Alert {
  id: number
  alertType: string
  alertMessage: string
  alertData?: string
  triggeredAt: string
  triggeredById: number
  alertResolved: boolean
}

interface Report {
  id: number
  reportType: string
  generatedDate: string
  authorityId: number
  reportData: string
  attractionId?: number
  dateRange: string
  description?: string
  reportTitle: string
}

// Unified AI Insight type for the component
export interface AIInsight {
  id: string
  type: 'trend' | 'anomaly' | 'recommendation'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  generatedDate: string
  source: 'predictive' | 'alert' | 'report'
  sourceId: number
}

export function useAIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAIInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch data from the database via API endpoints
      const [predictiveData, alertsData, reportsData] = await Promise.all([
        fetchPredictiveModels(),
        fetchAlerts(),
        fetchReports()
      ])

      // Transform database data into unified AI insights
      const transformedInsights = [
        ...transformPredictiveModels(predictiveData),
        ...transformAlerts(alertsData),
        ...transformReports(reportsData)
      ]

      // Sort by date (newest first) and take top 10
      const sortedInsights = transformedInsights
        .sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime())
        .slice(0, 10)

      setInsights(sortedInsights)
    } catch (err) {
      console.error('Failed to fetch AI insights:', err)
      setError('Failed to load AI insights. Please try again.')
      // Provide fallback empty data
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAIInsights()
  }, [])

  return { insights, loading, error, refetch: fetchAIInsights }
}

// API calls to fetch data from the database
async function fetchPredictiveModels(): Promise<PredictiveModel[]> {
  try {
    const response = await aiInsightsApi.getPredictiveModels(5)
    return response.success ? response.data || [] : []
  } catch (error) {
    console.error('Error fetching predictive models:', error)
    return []
  }
}

async function fetchAlerts(): Promise<Alert[]> {
  try {
    const response = await aiInsightsApi.getAlerts(5)
    return response.success ? response.data || [] : []
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return []
  }
}

async function fetchReports(): Promise<Report[]> {
  try {
    const response = await aiInsightsApi.getReports(5)
    return response.success ? response.data || [] : []
  } catch (error) {
    console.error('Error fetching reports:', error)
    return []
  }
}

// Transform functions to convert database models to AI insights
function transformPredictiveModels(models: PredictiveModel[]): AIInsight[] {
  return models.map(model => {
    let modelData: any = {}
    try {
      modelData = typeof model.modelData === 'string' ? JSON.parse(model.modelData) : model.modelData
    } catch (e) {
      console.warn('Failed to parse model data:', e)
    }

    const predictionTypeDisplay = model.predictionType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())

    return {
      id: `predictive-${model.id}`,
      type: 'trend' as const,
      title: `${predictionTypeDisplay} Forecast`,
      description: `Predicted value: ${model.predictedValue.toLocaleString()}. ${modelData.accuracy ? `Model accuracy: ${Math.round(modelData.accuracy * 100)}%` : 'AI-powered prediction'}`,
      impact: model.predictedValue > 10000 ? 'high' : model.predictedValue > 5000 ? 'medium' : 'low',
      confidence: modelData.accuracy || 0.8,
      generatedDate: model.generatedDate,
      source: 'predictive',
      sourceId: model.id
    }
  })
}

function transformAlerts(alerts: Alert[]): AIInsight[] {
  return alerts.filter(alert => !alert.alertResolved).map(alert => {
    let alertData: any = {}
    try {
      alertData = alert.alertData ? JSON.parse(alert.alertData) : {}
    } catch (e) {
      console.warn('Failed to parse alert data:', e)
    }

    const alertTypeDisplay = alert.alertType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())

    // Determine impact based on alert type and data
    let impact: 'high' | 'medium' | 'low' = 'medium'
    if (alert.alertType.includes('capacity') || alert.alertType.includes('critical')) {
      impact = 'high'
    } else if (alert.alertType.includes('warning') || alert.alertType.includes('anomaly')) {
      impact = 'medium'
    } else {
      impact = 'low'
    }

    return {
      id: `alert-${alert.id}`,
      type: 'anomaly' as const,
      title: alertTypeDisplay,
      description: alert.alertMessage,
      impact,
      confidence: 0.95, // Alerts are typically high confidence
      generatedDate: alert.triggeredAt,
      source: 'alert',
      sourceId: alert.id
    }
  })
}

function transformReports(reports: Report[]): AIInsight[] {
  return reports.filter(report => 
    report.reportType === 'recommendation' || 
    report.reportType === 'insight' ||
    report.description?.toLowerCase().includes('recommendation') ||
    report.reportTitle?.toLowerCase().includes('recommendation')
  ).map(report => {
    let reportData: any = {}
    try {
      reportData = typeof report.reportData === 'string' ? JSON.parse(report.reportData) : report.reportData
    } catch (e) {
      console.warn('Failed to parse report data:', e)
    }

    const confidence = reportData.confidence || 0.7
    const impact: 'high' | 'medium' | 'low' = confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low'

    return {
      id: `report-${report.id}`,
      type: 'recommendation' as const,
      title: report.reportTitle || 'Analysis Report',
      description: report.description || reportData.recommendation || 'Detailed analysis and recommendations available',
      impact,
      confidence,
      generatedDate: report.generatedDate,
      source: 'report',
      sourceId: report.id
    }
  })
}
