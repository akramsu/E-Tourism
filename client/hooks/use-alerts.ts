"use client"

import { useState, useEffect } from "react"
import { alertsApi } from "@/lib/api"

// Types based on database schema
export interface Alert {
  id: number
  alertType: string
  alertMessage: string
  alertData?: string
  triggeredAt: string
  triggeredById: number
  alertResolved: boolean
  triggeredBy?: {
    id: number
    username: string
    email: string
  }
}

export interface AlertThreshold {
  type: string
  threshold: number
  enabled: boolean
  notificationMethods: string[]
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all alerts (both resolved and unresolved)
      const response = await alertsApi.getAlerts({ limit: 50 })
      
      if (response.success && response.data) {
        setAlerts(response.data)
      } else {
        setAlerts([])
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      setError('Failed to load alerts. Please try again.')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: number) => {
    try {
      const response = await alertsApi.updateAlert(alertId, { alertResolved: true })
      
      if (response.success) {
        // Update local state
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, alertResolved: true }
            : alert
        ))
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to resolve alert:', err)
      setError('Failed to resolve alert. Please try again.')
      return false
    }
  }

  const createAlert = async (alertData: { alertType: string; alertMessage: string; alertData?: any }) => {
    try {
      const response = await alertsApi.createAlert(alertData)
      
      if (response.success && response.data) {
        // Add new alert to local state
        setAlerts(prev => [response.data, ...prev])
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to create alert:', err)
      setError('Failed to create alert. Please try again.')
      return false
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  // Filter alerts by resolution status
  const activeAlerts = alerts.filter(alert => !alert.alertResolved)
  const resolvedAlerts = alerts.filter(alert => alert.alertResolved)

  return {
    alerts,
    activeAlerts,
    resolvedAlerts,
    loading,
    error,
    refetch: fetchAlerts,
    resolveAlert,
    createAlert
  }
}
