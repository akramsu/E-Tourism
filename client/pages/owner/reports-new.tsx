"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Download, FileText, Loader2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { reportsAPI } from "@/lib/api"

interface ReportConfig {
  title: string
  description: string
  reportType: string
  dateRange: {
    start: Date | undefined
    end: Date | undefined
  }
  metrics: string[]
  exportFormat: string
}

interface GeneratedReport {
  id: string
  title: string
  type: string
  generatedAt: string
  status: 'pending' | 'completed' | 'failed'
  downloadUrl?: string
}

const reportTypes = [
  { value: "visitor_analytics", label: "Visitor Analytics" },
  { value: "revenue_summary", label: "Revenue Summary" },
  { value: "attraction_performance", label: "Attraction Performance" },
  { value: "demographic_insights", label: "Demographic Insights" },
  { value: "seasonal_trends", label: "Seasonal Trends" },
  { value: "custom", label: "Custom Report" },
]

const availableMetrics = [
  { id: "total_visitors", label: "Total Visitors" },
  { id: "revenue", label: "Revenue" },
  { id: "avg_visit_duration", label: "Average Visit Duration" },
  { id: "visitor_satisfaction", label: "Visitor Satisfaction" },
  { id: "peak_hours", label: "Peak Hours" },
  { id: "demographics", label: "Demographics" },
]

const exportFormats = [
  { value: "pdf", label: "PDF Document" },
  { value: "excel", label: "Excel Spreadsheet" },
  { value: "csv", label: "CSV Data" },
]

export function Reports() {
  const [config, setConfig] = useState<ReportConfig>({
    title: "",
    description: "",
    reportType: "",
    dateRange: { start: undefined, end: undefined },
    metrics: [],
    exportFormat: "pdf",
  })
  
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await reportsAPI.getReports()
        if (response.data && Array.isArray(response.data)) {
          const formattedReports: GeneratedReport[] = response.data.map((report: any) => ({
            id: report.reportId?.toString() || report.id?.toString(),
            title: report.reportTitle || report.title || 'Untitled Report',
            type: report.reportType || 'custom',
            generatedAt: report.createdAt || report.generatedDate || new Date().toISOString(),
            status: 'completed',
            downloadUrl: report.downloadUrl || '#'
          }))
          setRecentReports(formattedReports)
        } else {
          // Fallback to sample data
          const sampleReports: GeneratedReport[] = [
            {
              id: "1",
              title: "Monthly Visitor Analytics",
              type: "visitor_analytics",
              generatedAt: new Date().toISOString(),
              status: "completed",
              downloadUrl: "#"
            }
          ]
          setRecentReports(sampleReports)
        }
      } catch (err) {
        console.error('Error fetching reports:', err)
        setError('Failed to load reports')
        
        const sampleReports: GeneratedReport[] = [
          {
            id: "1",
            title: "Monthly Visitor Analytics", 
            type: "visitor_analytics",
            generatedAt: new Date().toISOString(),
            status: "completed"
          }
        ]
        setRecentReports(sampleReports)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const handleMetricToggle = (metricId: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((m) => m !== metricId)
        : [...prev.metrics, metricId],
    }))
  }

  const handleGenerateReport = async () => {
    if (!config.title || !config.reportType || !config.dateRange.start || !config.dateRange.end) {
      alert("Please fill in all required fields")
      return
    }

    setGenerating(true)
    
    try {
      const reportData = {
        reportType: config.reportType,
        reportTitle: config.title,
        description: config.description,
        dateRange: `${config.dateRange.start?.toISOString()} - ${config.dateRange.end?.toISOString()}`,
        reportData: {
          metrics: config.metrics,
          exportFormat: config.exportFormat
        }
      }
      
      const response = await reportsAPI.createReport(reportData)
      
      if (response.data) {
        const newReport: GeneratedReport = {
          id: response.data.reportId?.toString() || Date.now().toString(),
          title: config.title,
          type: config.reportType,
          generatedAt: new Date().toISOString(),
          status: 'completed',
          downloadUrl: response.data.downloadUrl || '#'
        }
        
        setRecentReports(prev => [newReport, ...prev])
        
        // Reset form
        setConfig({
          title: "",
          description: "",
          reportType: "",
          dateRange: { start: undefined, end: undefined },
          metrics: [],
          exportFormat: "pdf",
        })
      }
    } catch (err) {
      console.error('Error generating report:', err)
      alert('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadReport = (reportId: string) => {
    console.log('Downloading report:', reportId)
    // Implementation for downloading reports
  }

  const handleViewReport = (reportId: string) => {
    console.log('Viewing report:', reportId)
    // Implementation for viewing reports
  }

  return (
    <div className="space-y-6">
      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
          <CardDescription>Create detailed analytics reports for your attractions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                placeholder="Monthly Analytics Report"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Report Type</Label>
              <Select value={config.reportType} onValueChange={(value) => setConfig({ ...config, reportType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
              placeholder="Brief description of the report..."
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !config.dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.start ? format(config.dateRange.start, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.start}
                    onSelect={(date) => setConfig({ ...config, dateRange: { ...config.dateRange, start: date } })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !config.dateRange.end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.dateRange.end ? format(config.dateRange.end, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={config.dateRange.end}
                    onSelect={(date) => setConfig({ ...config, dateRange: { ...config.dateRange, end: date } })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Metrics to Include</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric.id}
                    checked={config.metrics.includes(metric.id)}
                    onCheckedChange={() => handleMetricToggle(metric.id)}
                  />
                  <Label htmlFor={metric.id} className="text-sm">
                    {metric.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={config.exportFormat} onValueChange={(value) => setConfig({ ...config, exportFormat: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
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
          </div>

          <Button onClick={handleGenerateReport} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>View and download your generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading reports...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reports generated yet. Create your first report above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{report.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.type.replace("_", " ")} • Generated {new Date(report.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={report.status === "completed" ? "default" : "secondary"}>
                      {report.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => handleViewReport(report.id)}>
                      <Eye className="h-3 w-3 mr-2" />
                      View
                    </Button>
                    {report.status === "completed" && (
                      <Button size="sm" onClick={() => handleDownloadReport(report.id)}>
                        <Download className="h-3 w-3 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Reports
