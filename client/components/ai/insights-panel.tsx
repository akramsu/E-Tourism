"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, TrendingUp, AlertTriangle, Lightbulb, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import { useAIInsights } from "@/hooks/use-ai-insights"

const iconMap = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  recommendation: Lightbulb,
}

const colorMap = {
  high: "destructive",
  medium: "default",
  low: "secondary",
} as const

interface AIInsightsPanelProps {
  insights?: {
    keyPredictions: string[]
    riskFactors: string[]
    opportunities: string[]
  }
  accuracy?: {
    overall: number
    visitorAccuracy: number
    revenueAccuracy: number
    trend: 'improving' | 'stable' | 'declining'
  }
  className?: string
}

export function AIInsightsPanel({ insights: externalInsights, accuracy: externalAccuracy, className }: AIInsightsPanelProps) {
  const { insights, loading, error, refetch } = useAIInsights()

  // Use external data if provided, otherwise use hook data
  const displayInsights = externalInsights || insights
  const displayAccuracy = externalAccuracy
  const isLoading = !externalInsights && loading
  const hasError = !externalInsights && error

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Insights
          </CardTitle>
          <CardDescription>Machine learning powered insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading AI insights...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Insights
          </CardTitle>
          <CardDescription>Machine learning powered insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={refetch}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Insights
        </CardTitle>
        <CardDescription>Machine learning powered insights and recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!displayInsights ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No AI insights available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Handle external insights data structure */}
            {externalInsights && (
              <>
                {/* Key Predictions */}
                {externalInsights.keyPredictions && externalInsights.keyPredictions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Key Predictions
                    </h4>
                    {externalInsights.keyPredictions.map((prediction: string, index: number) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">{prediction}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Risk Factors */}
                {externalInsights.riskFactors && externalInsights.riskFactors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Risk Factors
                    </h4>
                    {externalInsights.riskFactors.map((risk: string, index: number) => (
                      <div key={index} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-sm text-orange-800 dark:text-orange-200">{risk}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Opportunities */}
                {externalInsights.opportunities && externalInsights.opportunities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      Opportunities
                    </h4>
                    {externalInsights.opportunities.map((opportunity: string, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">{opportunity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Handle original insights data structure */}
            {!externalInsights && Array.isArray(displayInsights) && displayInsights.length > 0 && (
              displayInsights.map((insight: any) => {
                const Icon = iconMap[insight.type as keyof typeof iconMap]

                return (
                  <div key={insight.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">{insight.title}</h4>
                      </div>
                      <Badge variant={colorMap[insight.impact as keyof typeof colorMap]}>{insight.impact}</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${insight.confidence * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium">{Math.round(insight.confidence * 100)}%</span>
                      </div>

                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                )
              })
            )}

            {/* Model Accuracy */}
            {displayAccuracy && (
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Model Accuracy</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Overall:</span>
                    <span className="font-medium">{displayAccuracy.overall.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Visitor Forecast:</span>
                    <span className="font-medium">{displayAccuracy.visitorAccuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Revenue Forecast:</span>
                    <span className="font-medium">{displayAccuracy.revenueAccuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trend:</span>
                    <span className={`font-medium ${
                      displayAccuracy.trend === 'improving' ? 'text-green-600' :
                      displayAccuracy.trend === 'stable' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {displayAccuracy.trend}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!externalInsights && (
          <Button className="w-full" variant="outline" onClick={refetch}>
            Refresh Insights
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
