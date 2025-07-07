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
import { authorityApi } from "@/lib/api"

interface ReportGeneratorProps {
  onReportGenerated?: () => void
}

export function ReportGenerator({ onReportGenerated }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    reportType: '',
    reportTitle: '',
    description: '',
    dateRange: 'last_month',
    attractionId: '',
    includeCharts: true,
    format: 'pdf'
  })

  const reportTypes = [
    {
      value: 'visitor_analysis',
      label: 'Visitor Analysis',
      description: 'Comprehensive analysis of visitor patterns and behavior',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      value: 'revenue_report',
      label: 'Revenue Report',
      description: 'Financial performance and revenue trends analysis',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      value: 'attraction_performance',
      label: 'Attraction Performance',
      description: 'Individual attraction metrics and comparisons',
      icon: BarChart3,
      color: 'text-purple-600'
    },
    {
      value: 'demographic_insights',
      label: 'Demographic Insights',
      description: 'Visitor demographics and market segmentation',
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

      console.log('🚀 Generating report with AI...', formData)

      const reportConfig = {
        reportType: formData.reportType as 'visitor_analysis' | 'revenue_report' | 'attraction_performance' | 'demographic_insights' | 'custom',
        reportTitle: formData.reportTitle,
        description: formData.description,
        dateRange: formData.dateRange,
        attractionId: formData.attractionId ? parseInt(formData.attractionId) : undefined,
        includeCharts: formData.includeCharts,
        format: formData.format as 'pdf' | 'excel' | 'csv'
      }

      const response = await authorityApi.generateReport(reportConfig)
      
      if (response.success) {
        setSuccess(`Report "${formData.reportTitle}" generated successfully with AI analysis!`)
        
        // Reset form
        setFormData({
          reportType: '',
          reportTitle: '',
          description: '',
          dateRange: 'last_month',
          attractionId: '',
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
            placeholder="e.g., Monthly Visitor Analysis"
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

      {/* AI Features Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">AI-Powered Analysis</h4>
              <p className="text-sm text-blue-700">
                Your report will be generated using Google Gemini AI for advanced insights and recommendations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <div className="space-y-4">
        <Separator />
        <h4 className="font-medium">Advanced Options</h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="attractionId">Specific Attraction (Optional)</Label>
            <Input
              id="attractionId"
              type="number"
              placeholder="Enter attraction ID"
              value={formData.attractionId}
              onChange={(e) => handleInputChange('attractionId', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to include all attractions
            </p>
          </div>

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
        </div>

        <div className="flex items-center justify-between">
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
              Generating with AI...
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
            {formData.attractionId && ` for attraction ID ${formData.attractionId}`}
            {' '}and generate AI-powered insights using Google Gemini.
          </p>
        </div>
      )}
    </form>
  )
}
