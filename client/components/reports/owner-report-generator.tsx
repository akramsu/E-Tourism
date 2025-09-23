"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { 
  Loader2, 
  FileText, 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertCircle,
  Bot,
  Download
} from "lucide-react"
import { ownerApi } from "@/lib/api"

interface OwnerReportGeneratorProps {
  onReportGenerated?: () => void
  attractionId: number
  attractionName: string
}

export function OwnerReportGenerator({ onReportGenerated, attractionId, attractionName }: OwnerReportGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    reportType: '',
    reportTitle: '',
    description: '',
    dateRange: 'last_month',
    includeCharts: true,
    format: 'pdf'
  })

  const reportTypes = [
    {
      value: 'visitor_analysis',
      label: 'Visitor Analysis',
      description: 'Detailed analysis of visitor patterns and behavior for your attraction',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      value: 'revenue_report',
      label: 'Revenue Report',
      description: 'Financial performance and revenue trends for your attraction',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      value: 'attraction_performance',
      label: 'Attraction Performance',
      description: 'Overall performance metrics and KPIs for your attraction',
      icon: BarChart3,
      color: 'text-purple-600'
    },
    {
      value: 'demographic_insights',
      label: 'Demographic Insights',
      description: 'Visitor demographics and market segmentation analysis',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ]

  const dateRangeOptions = [
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'year_to_date', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.reportType || !formData.reportTitle) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      console.log('🚀 Generating owner report...', formData)

      const reportConfig = {
        title: formData.reportTitle,
        description: formData.description,
        reportType: formData.reportType,
        startDate: getStartDateFromRange(formData.dateRange),
        endDate: new Date().toISOString(),
        metrics: getMetricsForReportType(formData.reportType),
        exportFormat: formData.format as 'pdf' | 'excel' | 'csv'
      }

      const response = await ownerApi.generateReport(attractionId, reportConfig)
      
      if (response.success) {
        setSuccess(`Report "${formData.reportTitle}" generated successfully for ${attractionName}!`)
        
        // Reset form
        setFormData({
          reportType: '',
          reportTitle: '',
          description: '',
          dateRange: 'last_month',
          includeCharts: true,
          format: 'pdf'
        })

        // Callback to refresh parent component
        if (onReportGenerated) {
          onReportGenerated()
        }
      } else {
        setError(response.message || 'Failed to generate report')
      }

    } catch (err) {
      console.error('Error generating report:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const getStartDateFromRange = (range: string): string => {
    const now = new Date()
    let startDate = new Date()

    switch (range) {
      case 'last_week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'last_month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'last_quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'last_year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'year_to_date':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    return startDate.toISOString()
  }

  const getMetricsForReportType = (reportType: string): string[] => {
    switch (reportType) {
      case 'visitor_analysis':
        return ['visitor_count', 'visitor_growth', 'peak_hours', 'visitor_demographics']
      case 'revenue_report':
        return ['revenue', 'revenue_growth', 'avg_revenue_per_visitor', 'ticket_sales']
      case 'attraction_performance':
        return ['visitor_count', 'revenue', 'avg_rating', 'review_count', 'capacity_utilization']
      case 'demographic_insights':
        return ['age_distribution', 'gender_breakdown', 'visitor_origins', 'repeat_visitors']
      default:
        return ['visitor_count', 'revenue', 'avg_rating']
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectedReportType = reportTypes.find(type => type.value === formData.reportType)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Bot className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Attraction Context */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">Generating Report for {attractionName}</h4>
              <p className="text-sm text-blue-700">
                This report will focus exclusively on your attraction's performance and analytics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Report Type *</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {reportTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <Card 
                key={type.value}
                className={`cursor-pointer transition-all ${
                  formData.reportType === type.value 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleInputChange('reportType', type.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <IconComponent className={`h-5 w-5 mt-0.5 ${type.color}`} />
                    <div>
                      <h4 className="font-medium text-sm">{type.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Report Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reportTitle">Report Title *</Label>
          <Input
            id="reportTitle"
            placeholder="e.g., Monthly Performance Analysis"
            value={formData.reportTitle}
            onChange={(e) => handleInputChange('reportTitle', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateRange">Date Range *</Label>
          <Select value={formData.dateRange} onValueChange={(value) => handleInputChange('dateRange', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description of what this report should focus on..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Export Options</h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="format">Download Format</Label>
            <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="csv">CSV Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-6">
            <div className="space-y-1">
              <Label htmlFor="includeCharts">Include Charts & Visualizations</Label>
              <p className="text-xs text-muted-foreground">
                Add visual charts and graphs to the report
              </p>
            </div>
            <Switch
              id="includeCharts"
              checked={formData.includeCharts}
              onCheckedChange={(value) => handleInputChange('includeCharts', value)}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={loading || !formData.reportType || !formData.reportTitle}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>

        {selectedReportType && (
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-2">
            <selectedReportType.icon className={`h-3 w-3 ${selectedReportType.color}`} />
            {selectedReportType.label}
          </Badge>
        )}
      </div>

      {formData.reportType && (
        <div className="bg-muted/50 p-3 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Report Preview</span>
          </div>
          <p className="text-muted-foreground">
            This {selectedReportType?.label.toLowerCase()} will analyze data from{' '}
            <strong>{dateRangeOptions.find(opt => opt.value === formData.dateRange)?.label}</strong>
            {' '}for <strong>{attractionName}</strong> and provide detailed insights about your attraction's performance.
          </p>
        </div>
      )}
    </form>
  )
}
