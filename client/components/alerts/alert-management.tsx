"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, CheckCircle, Clock, Settings, Bell, Mail, Smartphone, Loader2, AlertCircle } from "lucide-react"
import { useAlerts, type AlertThreshold } from "@/hooks/use-alerts"

export function AlertManagement() {
  const [activeTab, setActiveTab] = useState<"alerts" | "config">("alerts")
  const { activeAlerts, resolvedAlerts, loading, error, resolveAlert, refetch } = useAlerts()
  
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([
    { type: "visitor_capacity", threshold: 90, enabled: true, notificationMethods: ["email", "in_app"] },
    { type: "revenue_drop", threshold: 15, enabled: true, notificationMethods: ["email", "sms"] },
    { type: "rating_drop", threshold: 0.5, enabled: true, notificationMethods: ["email"] },
    { type: "duration_decrease", threshold: 20, enabled: false, notificationMethods: ["in_app"] },
  ])

  const handleResolveAlert = async (alertId: number) => {
    const success = await resolveAlert(alertId)
    if (success) {
      console.log(`Alert ${alertId} resolved successfully`)
    }
  }

  const updateThreshold = (type: string, field: keyof AlertThreshold, value: any) => {
    setThresholds((prev) =>
      prev.map((threshold) => (threshold.type === type ? { ...threshold, [field]: value } : threshold)),
    )
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "Visitor Threshold Exceeded":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "Revenue Drop":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "Rating Drop":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertSeverity = (alertType: string) => {
    switch (alertType) {
      case "Visitor Threshold Exceeded":
        return "high"
      case "Revenue Drop":
        return "medium"
      case "Rating Drop":
        return "low"
      default:
        return "low"
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button variant={activeTab === "alerts" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("alerts")}>
          Active Alerts
        </Button>
        <Button variant={activeTab === "config" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("config")}>
          Configuration
        </Button>
      </div>

      {activeTab === "alerts" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-red-500" />
                    Active Alerts
                  </CardTitle>
                  <CardDescription>Real-time alerts based on database triggers and thresholds</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading alerts...
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-4 text-center py-8">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{error}</p>
                    <Button variant="outline" size="sm" onClick={refetch}>
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getAlertIcon(alert.alertType)}
                          <div>
                            <h4 className="font-medium">{alert.alertType}</h4>
                            <p className="text-sm text-muted-foreground">{alert.alertMessage}</p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            getAlertSeverity(alert.alertType) === "high"
                              ? "destructive"
                              : getAlertSeverity(alert.alertType) === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {getAlertSeverity(alert.alertType)}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                      </div>

                      {alert.alertData && (
                        <div className="bg-muted/50 p-2 rounded text-xs font-mono">
                          Alert Data: {(() => {
                            try {
                              return JSON.stringify(JSON.parse(alert.alertData), null, 2)
                            } catch {
                              return alert.alertData
                            }
                          })()}
                        </div>
                      )}

                      <Button size="sm" onClick={() => handleResolveAlert(alert.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolve Alert
                      </Button>
                    </div>
                  ))}

                  {activeAlerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No active alerts
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolved Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Resolved Alerts
              </CardTitle>
              <CardDescription>Recently resolved alerts and their resolution details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resolvedAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg opacity-75">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <h4 className="font-medium">{alert.alertType}</h4>
                          <p className="text-sm text-muted-foreground">{alert.alertMessage}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Resolved</Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        <Clock className="h-3 w-3 inline mr-1" />
                        Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                      </div>
                      <div>
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Resolved: Recently
                      </div>
                    </div>
                  </div>
                ))}

                {resolvedAlerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    No resolved alerts yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Alert Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Alert Thresholds
              </CardTitle>
              <CardDescription>Configure when alerts should be triggered based on database metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {thresholds.map((threshold) => (
                  <div key={threshold.type} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{threshold.type.replace("_", " ")} Alert</h4>
                      <Switch
                        checked={threshold.enabled}
                        onCheckedChange={(enabled) => updateThreshold(threshold.type, "enabled", enabled)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Threshold Value</Label>
                      <Input
                        type="number"
                        value={threshold.threshold}
                        onChange={(e) =>
                          updateThreshold(threshold.type, "threshold", Number.parseFloat(e.target.value))
                        }
                        disabled={!threshold.enabled}
                      />
                      <div className="text-xs text-muted-foreground">
                        {threshold.type === "visitor_capacity" && "Percentage of capacity (0-100)"}
                        {threshold.type === "revenue_drop" && "Percentage decrease (0-100)"}
                        {threshold.type === "rating_drop" && "Rating point decrease (0-5)"}
                        {threshold.type === "duration_decrease" && "Percentage decrease in visit duration (0-100)"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notification Methods</Label>
                      <div className="flex gap-2">
                        {["email", "sms", "in_app"].map((method) => (
                          <Button
                            key={method}
                            variant={threshold.notificationMethods.includes(method) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const methods = threshold.notificationMethods.includes(method)
                                ? threshold.notificationMethods.filter((m) => m !== method)
                                : [...threshold.notificationMethods, method]
                              updateThreshold(threshold.type, "notificationMethods", methods)
                            }}
                            disabled={!threshold.enabled}
                          >
                            {method === "email" && <Mail className="h-3 w-3 mr-1" />}
                            {method === "sms" && <Smartphone className="h-3 w-3 mr-1" />}
                            {method === "in_app" && <Bell className="h-3 w-3 mr-1" />}
                            {method.replace("_", " ")}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono">
                      SQL Trigger: CREATE TRIGGER {threshold.type}_alert AFTER INSERT ON Visit WHEN NEW.
                      {threshold.type === "visitor_capacity"
                        ? "COUNT(*) > Attraction.Capacity * " + threshold.threshold / 100
                        : threshold.type === "revenue_drop"
                          ? "Amount < (SELECT AVG(Amount) * " + (1 - threshold.threshold / 100) + " FROM Visit)"
                          : "Rating < (SELECT AVG(Rating) - " + threshold.threshold + " FROM Visit)"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and where alerts are delivered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Email Notifications</h4>
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Input placeholder="admin@tourism.gov, manager@tourism.gov" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Template</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Template</SelectItem>
                        <SelectItem value="detailed">Detailed Template</SelectItem>
                        <SelectItem value="summary">Summary Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">SMS Notifications</h4>
                  <div className="space-y-2">
                    <Label>Phone Numbers</Label>
                    <Input placeholder="+62812345678, +62812345679" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="sms-high-priority" />
                    <Label htmlFor="sms-high-priority">Only for high priority alerts</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">In-App Notifications</h4>
                  <div className="flex items-center space-x-2">
                    <Switch id="browser-notifications" defaultChecked />
                    <Label htmlFor="browser-notifications">Browser notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="dashboard-badges" defaultChecked />
                    <Label htmlFor="dashboard-badges">Dashboard notification badges</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="sound-alerts" />
                    <Label htmlFor="sound-alerts">Sound alerts</Label>
                  </div>
                </div>

                <Button className="w-full">Save Notification Settings</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
