"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Download, FileText, Users, DollarSign, TrendingUp, Clock, Star, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ownerApi } from "@/lib/api"

interface ReportConfig {
  title: string
  description: string
  reportType: string
  dateRange: { start: Date | undefined; end: Date | undefined }
  metrics: string[]
  exportFormat: string
}

interface ReportType {
  value: string
  label: string
  description: string
}

interface Metric {
  id: string
  label: string
  icon: any
  available: boolean
}

interface Report {
  id: number
  title: string
  description?: string
  reportType: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  downloadCount: number
  fileSize?: number
  errorMessage?: string
}

const defaultReportTypes = [
  { value: "visitor_analytics", label: "Visitor Analytics", description: "Analyze visitor patterns and demographics" },
  { value: "revenue_report", label: "Revenue Report", description: "Financial performance and revenue analysis" },
  { value: "performance_summary", label: "Performance Summary", description: "Overall attraction performance metrics" },
  { value: "seasonal_analysis", label: "Seasonal Analysis", description: "Seasonal trends and patterns" },
]

const defaultMetrics = [
  { id: "visitor_count", label: "Total Visitors", icon: Users, available: true },
  { id: "revenue", label: "Revenue", icon: DollarSign, available: true },
  { id: "avg_rating", label: "Average Rating", icon: Star, available: true },
  { id: "peak_hours", label: "Peak Hours", icon: Clock, available: true },
  { id: "visitor_growth", label: "Visitor Growth", icon: TrendingUp, available: true },
]

const exportFormats = [
  { value: "pdf", label: "PDF Document" },
  { value: "excel", label: "Excel Spreadsheet" },
  { value: "csv", label: "CSV Data" },
]

const recentReports = [
  {
    id: 1,
    title: "Monthly Visitor Report",
    type: "Visitor Analytics",
    date: "2024-01-15",
    status: "completed",
    downloads: 23,
  },
  {
    id: 2,
    title: "Q4 Revenue Analysis",
    type: "Revenue Report",
    date: "2024-01-10",
    status: "completed",
    downloads: 45,
  },
  {
    id: 3,
    title: "Performance Summary",
    type: "Performance Summary",
    date: "2024-01-08",
    status: "processing",
    downloads: 0,
  },
]

export function OwnerReports() {
  const [attraction, setAttraction] = useState<any>(null)
  const [reportTypes, setReportTypes] = useState<ReportType[]>(defaultReportTypes)
  const [availableMetrics, setAvailableMetrics] = useState<Metric[]>(defaultMetrics)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [config, setConfig] = useState<ReportConfig>({
    title: "",
    description: "",
    reportType: "",
    dateRange: { start: undefined, end: undefined },
    metrics: [],
    exportFormat: "pdf",
  })
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
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

      // Fetch reports, report types, and available metrics in parallel
      const [
        reportsResponse,
        reportTypesResponse,
        metricsResponse
      ] = await Promise.all([
        ownerApi.getReports(attractionData.id, { limit: 10 }),
        ownerApi.getReportTypes().catch(() => ({ success: false, data: null })),
        ownerApi.getAvailableMetrics(attractionData.id).catch(() => ({ success: false, data: null }))
      ])

      if (reportsResponse.success && reportsResponse.data) {
        setReports(reportsResponse.data)
      }

      if (reportTypesResponse.success && reportTypesResponse.data) {
        setReportTypes(reportTypesResponse.data)
      }

      if (metricsResponse.success && metricsResponse.data) {
        setAvailableMetrics(metricsResponse.data)
      }

    } catch (err) {
      console.error("Error fetching reports data:", err)
      setError(err instanceof Error ? err.message : "Failed to load reports")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMetricToggle = (metricId: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((m) => m !== metricId)
        : [...prev.metrics, metricId],
    }))
  }

  const handleGenerate = async () => {
    if (!config.title || !config.reportType || !config.dateRange.start || !config.dateRange.end || !attraction) {
      setError("Please fill in all required fields")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const reportData = {
        title: config.title,
        description: config.description,
        reportType: config.reportType,
        startDate: config.dateRange.start.toISOString(),
        endDate: config.dateRange.end.toISOString(),
        metrics: config.metrics,
        exportFormat: config.exportFormat as 'pdf' | 'excel' | 'csv'
      }

      const response = await ownerApi.generateReport(attraction.id, reportData)

      if (response.success) {
        setSuccess("Report generation started successfully!")
        
        // Reset form
        setConfig({
          title: "",
          description: "",
          reportType: "",
          dateRange: { start: undefined, end: undefined },
          metrics: [],
          exportFormat: "pdf",
        })

        // Refresh reports list
        await fetchInitialData()

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to generate report")
      }
    } catch (err) {
      console.error("Error generating report:", err)
      setError(err instanceof Error ? err.message : "Failed to generate report")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = async (reportId: number) => {
    if (!attraction) return

    try {
      const blob = await ownerApi.downloadReport(attraction.id, reportId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `report-${reportId}.pdf` // Default to PDF, could be dynamic based on format
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess("Report downloaded successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error downloading report:", err)
      setError(err instanceof Error ? err.message : "Failed to download report")
    }
  }

  const handleDeleteReport = async (reportId: number) => {
    if (!attraction || !confirm("Are you sure you want to delete this report?")) return

    try {
      const response = await ownerApi.deleteReport(attraction.id, reportId)
      
      if (response.success) {
        setReports(prev => prev.filter(report => report.id !== reportId))
        setSuccess("Report deleted successfully!")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to delete report")
      }
    } catch (err) {
      console.error("Error deleting report:", err)
      setError(err instanceof Error ? err.message : "Failed to delete report")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Processing</Badge>
        )
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Pending</Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!attraction) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error || "No attraction found. Create an attraction to generate reports."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate detailed reports for {attraction?.name || 'your attraction'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Generator */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate New Report
              </CardTitle>
              <CardDescription>Create custom reports for your attraction performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter report title"
                    value={config.title}
                    onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Report Type *</Label>
                  <Select
                    value={config.reportType}
                    onValueChange={(value) => setConfig((prev) => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the purpose of this report..."
                  value={config.description}
                  onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Date Range *</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {config.dateRange.start ? format(config.dateRange.start, "PPP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={config.dateRange.start}
                        onSelect={(date) =>
                          setConfig((prev) => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, start: date },
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {config.dateRange.end ? format(config.dateRange.end, "PPP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={config.dateRange.end}
                        onSelect={(date) =>
                          setConfig((prev) => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, end: date },
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Metrics to Include</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={metric.id}
                        checked={config.metrics.includes(metric.id)}
                        onCheckedChange={() => handleMetricToggle(metric.id)}
                        disabled={!metric.available}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                        <Label 
                          htmlFor={metric.id} 
                          className={`text-sm font-medium cursor-pointer ${!metric.available ? 'text-muted-foreground' : ''}`}
                        >
                          {metric.label}
                          {!metric.available && " (Unavailable)"}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select
                  value={config.exportFormat}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, exportFormat: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exportFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={
                  !config.title ||
                  !config.reportType ||
                  !config.dateRange.start ||
                  !config.dateRange.end ||
                  isGenerating
                }
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your recently generated reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">{report.reportType}</p>
                        {report.description && (
                          <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                        )}
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Created: {formatDate(report.createdAt)}</span>
                      <span>Downloads: {report.downloadCount}</span>
                      {report.fileSize && (
                        <span>Size: {formatFileSize(report.fileSize)}</span>
                      )}
                      {report.completedAt && (
                        <span>Completed: {formatDate(report.completedAt)}</span>
                      )}
                    </div>

                    {report.status === "failed" && report.errorMessage && (
                      <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                        Error: {report.errorMessage}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {report.status === "completed" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleDownloadReport(report.id)}
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Download
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">No reports yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Generate your first report to get insights about your attraction.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
