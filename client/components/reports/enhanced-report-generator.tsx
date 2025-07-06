"use client"

import { useState } from "react"
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
import { CalendarIcon, Download, FileText, Users, DollarSign, TrendingUp, Clock, Star, Target } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface ReportConfig {
  title: string
  description: string
  reportType: string
  dateRange: { start: Date | undefined; end: Date | undefined }
  metrics: string[]
  attractions: string[]
  exportFormat: string
  reportData: any
}

interface GeneratedReport {
  reportId: number
  reportType: string
  title: string
  description: string
  generatedDate: string
  reportData: any
  dateRange: { start: Date | undefined; end: Date | undefined }
  exportFormat: string
  status: "completed" | "processing" | "failed"
}

export function EnhancedReportGenerator() {
  const [config, setConfig] = useState<ReportConfig>({
    title: "",
    description: "",
    reportType: "",
    dateRange: { start: undefined, end: undefined },
    metrics: [],
    attractions: [],
    exportFormat: "pdf",
    reportData: {},
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])

  const availableMetrics = [
    {
      id: "visitor_count",
      label: "Visitor Count",
      icon: Users,
      query: "SELECT COUNT(*) as total_visitors FROM Visit WHERE VisitDate BETWEEN ? AND ?",
      description: "Total number of visitors in the selected period",
    },
    {
      id: "revenue",
      label: "Revenue Analysis",
      icon: DollarSign,
      query: "SELECT SUM(Amount) as total_revenue FROM Visit WHERE VisitDate BETWEEN ? AND ?",
      description: "Total revenue generated from ticket sales and services",
    },
    {
      id: "avg_duration",
      label: "Average Visit Duration",
      icon: Clock,
      query: "SELECT AVG(Duration) as avg_duration FROM Visit WHERE VisitDate BETWEEN ? AND ?",
      description: "Average time visitors spend at attractions",
    },
    {
      id: "satisfaction_rating",
      label: "Visitor Satisfaction",
      icon: Star,
      query: "SELECT AVG(Rating) as avg_rating FROM Visit WHERE VisitDate BETWEEN ? AND ? AND Rating IS NOT NULL",
      description: "Average visitor satisfaction ratings",
    },
    {
      id: "capacity_utilization",
      label: "Capacity Utilization",
      icon: Target,
      query:
        "SELECT (COUNT(*) * 100.0 / MAX(Attraction.Capacity)) as utilization FROM Visit JOIN Attraction ON Visit.AttractionID = Attraction.AttractionID WHERE VisitDate BETWEEN ? AND ?",
      description: "Percentage of attraction capacity being utilized",
    },
    {
      id: "visitor_demographics",
      label: "Visitor Demographics",
      icon: Users,
      query:
        "SELECT Gender, COUNT(*) as count FROM Visit JOIN Visitor ON Visit.VisitorID = Visitor.VisitorID WHERE VisitDate BETWEEN ? AND ? GROUP BY Gender",
      description: "Breakdown of visitors by demographics",
    },
    {
      id: "peak_hours",
      label: "Peak Hours Analysis",
      icon: TrendingUp,
      query:
        "SELECT HOUR(VisitDate) as hour, COUNT(*) as visits FROM Visit WHERE VisitDate BETWEEN ? AND ? GROUP BY HOUR(VisitDate) ORDER BY visits DESC",
      description: "Identify peak visiting hours and patterns",
    },
    {
      id: "repeat_visitors",
      label: "Repeat Visitor Rate",
      icon: Users,
      query:
        "SELECT (COUNT(DISTINCT CASE WHEN visit_count > 1 THEN VisitorID END) * 100.0 / COUNT(DISTINCT VisitorID)) as repeat_rate FROM (SELECT VisitorID, COUNT(*) as visit_count FROM Visit WHERE VisitDate BETWEEN ? AND ? GROUP BY VisitorID) t",
      description: "Percentage of visitors who return multiple times",
    },
  ]

  const reportTypes = [
    {
      value: "tourism_trend",
      label: "Tourism Trend Analysis",
      description: "Analyze visitor patterns and seasonal trends",
      defaultMetrics: ["visitor_count", "peak_hours", "visitor_demographics"],
    },
    {
      value: "revenue_performance",
      label: "Revenue Performance Report",
      description: "Comprehensive revenue analysis and financial metrics",
      defaultMetrics: ["revenue", "avg_duration", "capacity_utilization"],
    },
    {
      value: "visitor_preferences",
      label: "Visitor Preferences Analysis",
      description: "Understanding visitor behavior and preferences",
      defaultMetrics: ["satisfaction_rating", "repeat_visitors", "visitor_demographics"],
    },
    {
      value: "operational_efficiency",
      label: "Operational Efficiency Report",
      description: "Analyze operational performance and capacity management",
      defaultMetrics: ["capacity_utilization", "peak_hours", "avg_duration"],
    },
    {
      value: "custom",
      label: "Custom Report",
      description: "Create a custom report with selected metrics",
      defaultMetrics: [],
    },
  ]

  const exportFormats = [
    { value: "pdf", label: "PDF Document", description: "Professional formatted document" },
    { value: "excel", label: "Excel Spreadsheet", description: "Data analysis and manipulation" },
    { value: "csv", label: "CSV Data", description: "Raw data for further processing" },
    { value: "powerpoint", label: "PowerPoint Presentation", description: "Executive presentation format" },
  ]

  const handleReportTypeChange = (value: string) => {
    const selectedType = reportTypes.find((type) => type.value === value)
    setConfig((prev) => ({
      ...prev,
      reportType: value,
      metrics: selectedType?.defaultMetrics || [],
    }))
  }

  const handleMetricToggle = (metricId: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((m) => m !== metricId)
        : [...prev.metrics, metricId],
    }))
  }

  const generateMockData = (metrics: string[], dateRange: any) => {
    const mockData: any = {
      summary: {
        reportType: config.reportType,
        dateRange: {
          start: dateRange.start?.toISOString().split("T")[0],
          end: dateRange.end?.toISOString().split("T")[0],
        },
        generatedAt: new Date().toISOString(),
        totalMetrics: metrics.length,
      },
      metrics: {},
    }

    metrics.forEach((metricId) => {
      const metric = availableMetrics.find((m) => m.id === metricId)
      if (metric) {
        switch (metricId) {
          case "visitor_count":
            mockData.metrics[metricId] = {
              value: Math.floor(Math.random() * 10000) + 5000,
              previousPeriod: Math.floor(Math.random() * 8000) + 4000,
              growth: (Math.random() * 30 - 5).toFixed(1) + "%",
              query: metric.query,
            }
            break
          case "revenue":
            mockData.metrics[metricId] = {
              value: Math.floor(Math.random() * 500000) + 200000,
              previousPeriod: Math.floor(Math.random() * 400000) + 150000,
              growth: (Math.random() * 25 - 3).toFixed(1) + "%",
              currency: "IDR",
              query: metric.query,
            }
            break
          case "avg_duration":
            mockData.metrics[metricId] = {
              value: (Math.random() * 3 + 1).toFixed(1) + " hours",
              previousPeriod: (Math.random() * 2.5 + 1).toFixed(1) + " hours",
              trend: Math.random() > 0.5 ? "increasing" : "stable",
              query: metric.query,
            }
            break
          case "satisfaction_rating":
            mockData.metrics[metricId] = {
              value: (Math.random() * 1.5 + 3.5).toFixed(1) + "/5",
              previousPeriod: (Math.random() * 1.2 + 3.3).toFixed(1) + "/5",
              distribution: {
                "5_star": Math.floor(Math.random() * 40) + 30,
                "4_star": Math.floor(Math.random() * 30) + 25,
                "3_star": Math.floor(Math.random() * 20) + 15,
                "2_star": Math.floor(Math.random() * 10) + 5,
                "1_star": Math.floor(Math.random() * 5) + 2,
              },
              query: metric.query,
            }
            break
          case "capacity_utilization":
            mockData.metrics[metricId] = {
              value: (Math.random() * 40 + 50).toFixed(1) + "%",
              peak: (Math.random() * 20 + 80).toFixed(1) + "%",
              average: (Math.random() * 30 + 45).toFixed(1) + "%",
              status: Math.random() > 0.7 ? "optimal" : "underutilized",
              query: metric.query,
            }
            break
          case "visitor_demographics":
            mockData.metrics[metricId] = {
              gender: {
                male: Math.floor(Math.random() * 30) + 40,
                female: Math.floor(Math.random() * 30) + 40,
                other: Math.floor(Math.random() * 5) + 2,
              },
              ageGroups: {
                "18-25": Math.floor(Math.random() * 20) + 15,
                "26-35": Math.floor(Math.random() * 25) + 20,
                "36-45": Math.floor(Math.random() * 20) + 18,
                "46-55": Math.floor(Math.random() * 15) + 12,
                "55+": Math.floor(Math.random() * 15) + 10,
              },
              query: metric.query,
            }
            break
          default:
            mockData.metrics[metricId] = {
              value: "Data available",
              query: metric.query,
            }
        }
      }
    })

    return mockData
  }

  const handleGenerateReport = async () => {
    if (!config.title || !config.reportType || !config.dateRange.start || !config.dateRange.end) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including title, report type, and date range.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Simulate report generation with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const reportData = generateMockData(config.metrics, config.dateRange)

      const newReport: GeneratedReport = {
        reportId: Date.now(),
        reportType: config.reportType,
        title: config.title,
        description: config.description,
        generatedDate: new Date().toISOString().split("T")[0],
        reportData: reportData,
        dateRange: config.dateRange,
        exportFormat: config.exportFormat,
        status: "completed",
      }

      setGeneratedReports((prev) => [newReport, ...prev])

      toast({
        title: "Report Generated Successfully",
        description: `${config.title} has been generated and is ready for download.`,
      })

      // Reset form
      setConfig({
        title: "",
        description: "",
        reportType: "",
        dateRange: { start: undefined, end: undefined },
        metrics: [],
        attractions: [],
        exportFormat: "pdf",
        reportData: {},
      })
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadReport = (report: GeneratedReport) => {
    // Simulate download
    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${report.title.replace(/\s+/g, "_")}_${report.generatedDate}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Download Started",
      description: `${report.title} is being downloaded.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>Configure your custom report parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                placeholder="Enter report title..."
                value={config.title}
                onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and scope of this report..."
                value={config.description}
                onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Report Type *</Label>
              <Select value={config.reportType} onValueChange={handleReportTypeChange}>
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

            <div className="space-y-2">
              <Label>Date Range *</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1">
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
                    <Button variant="outline" className="flex-1">
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
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-muted-foreground">{format.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={
                !config.title || !config.reportType || !config.dateRange.start || !config.dateRange.end || isGenerating
              }
              className="w-full"
            >
              {isGenerating ? (
                <>Generating Report...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metrics Selection</CardTitle>
            <CardDescription>Choose which metrics to include in your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableMetrics.map((metric) => (
                <div key={metric.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={metric.id}
                    checked={config.metrics.includes(metric.id)}
                    onCheckedChange={() => handleMetricToggle(metric.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={metric.id} className="font-medium">
                        {metric.label}
                      </Label>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{metric.description}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1 bg-muted/50 p-1 rounded">
                      {metric.query}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {config.metrics.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">Selected Metrics:</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {config.metrics.map((metricId) => {
                    const metric = availableMetrics.find((m) => m.id === metricId)
                    return (
                      <Badge key={metricId} variant="secondary">
                        {metric?.label}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generated Reports */}
      {generatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>Your recently generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div key={report.reportId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>Type: {report.reportType}</span>
                      <span>Generated: {report.generatedDate}</span>
                      <span>Format: {report.exportFormat.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {report.status}
                    </Badge>
                    <Button size="sm" onClick={() => handleDownloadReport(report)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
