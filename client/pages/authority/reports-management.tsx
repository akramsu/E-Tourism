"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ReportGenerator } from "@/components/reports/report-generator"
import { authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Trash2,
  Play,
  Pause
} from "lucide-react"

// TypeScript interfaces for live data
interface Report {
  id: number
  reportType: string
  reportTitle: string
  description?: string
  generatedDate: string
  authorityId: number
  dateRange: string
  attractionId?: number
  reportData: string | any
  authority: {
    username: string
  }
  attraction?: {
    name: string
  }
}

interface ReportTemplate {
  id: number
  name: string
  description: string
  reportType: string
  defaultFilters: any
  queries: string[]
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  isActive: boolean
}

interface ReportStats {
  totalReports: number
  reportsThisMonth: number
  mostUsedType: string
  avgGenerationTime: number
  totalDownloads: number
}

interface ScheduledReport {
  id: number
  reportTemplateId: number
  frequency: string
  recipients: string[]
  enabled: boolean
  nextRun: string
  lastRun?: string
  template: {
    name: string
    reportType: string
  }
}

export default function ReportsManagement() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("reports")
  
  const [reports, setReports] = useState<Report[]>([])
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [reportStats, setReportStats] = useState<ReportStats | null>(null)
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  
  const [filters, setFilters] = useState({
    reportType: "",
    dateFrom: "",
    dateTo: "",
    search: "",
    sortBy: "generatedDate" as 'generatedDate' | 'reportType' | 'reportTitle',
    sortOrder: "desc" as 'asc' | 'desc'
  })
  
  const [generating, setGenerating] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => {
    if (user && user.role.roleName === 'AUTHORITY') {
      fetchReportsData()
    }
  }, [user, filters])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Fetching reports data with filters:', filters)

      const [reportsResponse, templatesResponse, statsResponse, scheduledResponse] = await Promise.all([
        authorityApi.getReports({
          limit: 50,
          reportType: filters.reportType || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        }),
        authorityApi.getReportTemplates(),
        authorityApi.getReportStats(),
        authorityApi.getScheduledReports()
      ])

      console.log('✅ API responses received:', {
        reports: reportsResponse.success,
        templates: templatesResponse.success,
        stats: statsResponse.success,
        scheduled: scheduledResponse.success
      })

      if (reportsResponse.success && reportsResponse.data) {
        setReports(reportsResponse.data)
      }

      if (templatesResponse.success && templatesResponse.data) {
        setReportTemplates(templatesResponse.data)
      }

      if (statsResponse.success && statsResponse.data) {
        setReportStats(statsResponse.data)
      }

      if (scheduledResponse.success && scheduledResponse.data) {
        setScheduledReports(scheduledResponse.data)
      }

    } catch (err) {
      console.error("Error fetching reports data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load reports data"
      console.error("Detailed error:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (reportId: number, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    try {
      setDownloadingId(reportId)
      setError(null)

      const blob = await authorityApi.downloadReport(reportId, format)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `report-${reportId}.${format}`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

    } catch (err) {
      console.error("Error downloading report:", err)
      setError("Failed to download report")
    } finally {
      setDownloadingId(null)
    }
  }

  const viewReport = async (reportId: number) => {
    try {
      const response = await authorityApi.getReport(reportId)
      if (response.success && response.data) {
        // You can implement a modal or navigation to view full report
        console.log("Viewing report:", response.data)
      }
    } catch (err) {
      console.error("Error viewing report:", err)
      setError("Failed to load report details")
    }
  }

  const deleteReport = async (reportId: number) => {
    try {
      setError(null)
      const response = await authorityApi.deleteReport(reportId)
      
      if (response.success) {
        setReports(prev => prev.filter(report => report.id !== reportId))
      } else {
        setError("Failed to delete report")
      }
    } catch (err) {
      console.error("Error deleting report:", err)
      setError("Failed to delete report")
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleRefresh = () => {
    fetchReportsData()
  }

  const getReportTypeIcon = (reportType: string) => {
    switch (reportType) {
      case 'visitor_analysis':
        return Users
      case 'revenue_report':
        return DollarSign
      case 'attraction_performance':
        return BarChart3
      case 'demographic_insights':
        return TrendingUp
      default:
        return FileText
    }
  }

  const getReportTypeColor = (reportType: string) => {
    switch (reportType) {
      case 'visitor_analysis':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'revenue_report':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'attraction_performance':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'demographic_insights':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Reports Management</h1>
          <p className="text-sm text-muted-foreground">Generate, manage, and analyze tourism reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="default">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogDescription>
                  Create a custom report based on your tourism data
                </DialogDescription>
              </DialogHeader>
              <ReportGenerator onReportGenerated={fetchReportsData} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      {reportStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{reportStats.totalReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{reportStats.reportsThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Download className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                  <p className="text-2xl font-bold">{reportStats.totalDownloads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                  <p className="text-2xl font-bold">{reportStats.avgGenerationTime}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Popular Type</p>
                  <p className="text-lg font-bold">{reportStats.mostUsedType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search reports..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={filters.reportType || "all"} onValueChange={(value) => handleFilterChange("reportType", value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="visitor_analysis">Visitor Analysis</SelectItem>
                      <SelectItem value="revenue_report">Revenue Report</SelectItem>
                      <SelectItem value="attraction_performance">Attraction Performance</SelectItem>
                      <SelectItem value="demographic_insights">Demographics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generatedDate">Date</SelectItem>
                      <SelectItem value="reportType">Type</SelectItem>
                      <SelectItem value="reportTitle">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Reports ({reports.length})
              </CardTitle>
              <CardDescription>Previously generated reports based on database analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports
                    .filter(report => 
                      !filters.search || 
                      report.reportTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
                      report.description?.toLowerCase().includes(filters.search.toLowerCase())
                    )
                    .map((report) => {
                      const IconComponent = getReportTypeIcon(report.reportType)
                      return (
                        <div key={report.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                              <div>
                                <h4 className="font-medium">{report.reportTitle}</h4>
                                <p className="text-sm text-muted-foreground">{report.description}</p>
                                {report.attraction && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Attraction: {report.attraction.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge className={getReportTypeColor(report.reportType)}>
                              {report.reportType.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Generated: {new Date(report.generatedDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              By: {report.authority.username}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Range: {report.dateRange}
                            </div>
                          </div>

                          {report.reportData && typeof report.reportData === 'object' && (
                            <div className="bg-muted/50 p-3 rounded text-xs">
                              <strong>Report Summary:</strong>
                              <div className="mt-1">
                                {report.reportData.summary && (
                                  <p>{report.reportData.summary}</p>
                                )}
                                {report.reportData.keyFindings && (
                                  <div className="mt-2">
                                    <strong>Key Findings:</strong>
                                    <ul className="list-disc list-inside mt-1">
                                      {report.reportData.keyFindings.map((finding: string, index: number) => (
                                        <li key={index}>{finding}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => viewReport(report.id)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => downloadReport(report.id, 'pdf')} 
                              disabled={downloadingId === report.id}
                            >
                              {downloadingId === report.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3 mr-1" />
                              )}
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => deleteReport(report.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No reports match your current filters. Try adjusting the filters or generate a new report.
                  </p>
                  <Button onClick={() => setActiveTab("templates")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Pre-configured report templates for common analytics needs</CardDescription>
            </CardHeader>
            <CardContent>
              {reportTemplates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {reportTemplates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                      <div className="space-y-2 mb-3">
                        <div className="text-xs font-medium">Queries:</div>
                        <div className="flex flex-wrap gap-1">
                          {template.queries.map((query, qIndex) => (
                            <Badge key={qIndex} variant="secondary" className="text-xs">
                              {query.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground capitalize">{template.frequency}</span>
                        <Button size="sm" variant="outline">
                          Use Template
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
                  <p className="text-muted-foreground">Create custom templates for frequently used reports.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automated report generation schedules</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledReports.length > 0 ? (
                <div className="space-y-4">
                  {scheduledReports.map((schedule) => (
                    <div key={schedule.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{schedule.template.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={schedule.enabled ? "default" : "secondary"}>
                            {schedule.enabled ? "Active" : "Paused"}
                          </Badge>
                          <Button size="sm" variant="outline">
                            {schedule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Frequency: {schedule.frequency}</p>
                        <p>Next run: {new Date(schedule.nextRun).toLocaleString()}</p>
                        {schedule.lastRun && (
                          <p>Last run: {new Date(schedule.lastRun).toLocaleString()}</p>
                        )}
                        <p>Recipients: {schedule.recipients.join(", ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
                  <p className="text-muted-foreground">Set up automated report generation schedules.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Analytics</CardTitle>
              <CardDescription>Insights about your report usage and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed analytics about report usage, performance metrics, and trends will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Named export for compatibility
export { ReportsManagement }
