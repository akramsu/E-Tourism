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
import { OwnerReportGenerator } from "@/components/reports/owner-report-generator"
import { ownerApi } from "@/lib/api"
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
  Building
} from "lucide-react"

// TypeScript interfaces for live data
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

interface Attraction {
  id: number
  name: string
  description: string
  category: string
  address: string
}

export default function OwnerReportsManagement() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("reports")
  
  const [attraction, setAttraction] = useState<Attraction | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [reportStats, setReportStats] = useState<ReportStats | null>(null)
  
  const [filters, setFilters] = useState({
    reportType: "",
    dateFrom: "",
    dateTo: "",
    search: "",
    sortBy: "createdAt" as 'createdAt' | 'reportType' | 'title',
    sortOrder: "desc" as 'asc' | 'desc'
  })
  
  const [generating, setGenerating] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => {
    if (user && user.role.roleName === 'OWNER') {
      fetchReportsData()
    }
  }, [user, filters])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Fetching owner reports data with filters:', filters)

      // First get the attraction
      const attractionResponse = await ownerApi.getMyAttraction()
      if (!attractionResponse.success || !attractionResponse.data) {
        setError("No attraction found. Please create an attraction first.")
        return
      }

      const attractionData = attractionResponse.data
      setAttraction(attractionData)

      // Then fetch reports and stats
      const [reportsResponse, reportTypesResponse] = await Promise.all([
        ownerApi.getReports(attractionData.id, {
          limit: 50,
          reportType: filters.reportType || undefined,
        }),
        ownerApi.getReportTypes().catch(() => ({ success: false, data: [] }))
      ])

      console.log('✅ API responses received:', {
        attraction: attractionResponse.success,
        reports: reportsResponse.success,
        templates: reportTypesResponse.success,
      })

      if (reportsResponse.success && reportsResponse.data) {
        setReports(reportsResponse.data)
      }

      if (reportTypesResponse.success && reportTypesResponse.data) {
        setReportTemplates(reportTypesResponse.data.map((type: any) => ({
          id: type.value,
          name: type.label,
          description: type.description,
          reportType: type.value,
          defaultFilters: {},
          queries: [],
          frequency: 'monthly' as const,
          isActive: true
        })))
      }

      // Calculate stats from reports
      if (reports.length > 0) {
        const currentMonth = new Date().getMonth()
        const reportsThisMonth = reports.filter(report => 
          new Date(report.createdAt).getMonth() === currentMonth
        ).length

        const typeCount = reports.reduce((acc, report) => {
          acc[report.reportType] = (acc[report.reportType] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const mostUsedType = Object.entries(typeCount).reduce((a, b) => 
          typeCount[a[0]] > typeCount[b[0]] ? a : b
        )[0] || 'visitor_analysis'

        const totalDownloads = reports.reduce((sum, report) => sum + report.downloadCount, 0)

        setReportStats({
          totalReports: reports.length,
          reportsThisMonth,
          mostUsedType,
          avgGenerationTime: 45, // Mock data
          totalDownloads
        })
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
    if (!attraction) return

    try {
      setDownloadingId(reportId)
      setError(null)

      const blob = await ownerApi.downloadReport(attraction.id, reportId)
      
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
    if (!attraction) return

    try {
      const response = await ownerApi.getReport(attraction.id, reportId)
      if (response.success && response.data) {
        console.log("Viewing report:", response.data)
        // You can implement a modal or navigation to view full report
      }
    } catch (err) {
      console.error("Error viewing report:", err)
      setError("Failed to load report details")
    }
  }

  const deleteReport = async (reportId: number) => {
    if (!attraction) return

    try {
      setError(null)
      const response = await ownerApi.deleteReport(attraction.id, reportId)
      
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Processing</Badge>
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
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

  if (!attraction) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "No attraction found. Please create an attraction first to generate reports."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Reports Management</h1>
          <p className="text-sm text-muted-foreground">Generate and manage reports for {attraction.name}</p>
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
                  Create a custom report for your attraction
                </DialogDescription>
              </DialogHeader>
              <OwnerReportGenerator 
                onReportGenerated={fetchReportsData} 
                attractionId={attraction.id}
                attractionName={attraction.name}
              />
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

      {/* Attraction Context */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">{attraction.name}</h4>
              <p className="text-sm text-blue-700">
                {attraction.category} • {attraction.address}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                All reports are generated specifically for this attraction
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <p className="text-lg font-bold">{reportStats.mostUsedType.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <CardDescription>Reports generated for {attraction.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports
                    .filter(report => 
                      !filters.search || 
                      report.title.toLowerCase().includes(filters.search.toLowerCase()) ||
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
                                <h4 className="font-medium">{report.title}</h4>
                                <p className="text-sm text-muted-foreground">{report.description}</p>
                              </div>
                            </div>
                            <Badge className={getReportTypeColor(report.reportType)}>
                              {report.reportType.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created: {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Downloads: {report.downloadCount}
                            </div>
                            <div className="flex items-center gap-1">
                              {getStatusBadge(report.status)}
                            </div>
                          </div>

                          {report.status === "failed" && report.errorMessage && (
                            <div className="bg-red-50 p-3 rounded text-xs text-red-700">
                              <strong>Error:</strong> {report.errorMessage}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => viewReport(report.id)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {report.status === "completed" && (
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
                            )}
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
                    No reports have been generated for {attraction.name} yet.
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Your First Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Generate New Report</DialogTitle>
                        <DialogDescription>
                          Create your first report for {attraction.name}
                        </DialogDescription>
                      </DialogHeader>
                      <OwnerReportGenerator 
                        onReportGenerated={fetchReportsData} 
                        attractionId={attraction.id}
                        attractionName={attraction.name}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Pre-configured report templates for your attraction analytics</CardDescription>
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

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground capitalize">{template.frequency}</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              Use Template
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Generate Report: {template.name}</DialogTitle>
                              <DialogDescription>
                                Generate a report using the {template.name} template
                              </DialogDescription>
                            </DialogHeader>
                            <OwnerReportGenerator 
                              onReportGenerated={fetchReportsData} 
                              attractionId={attraction.id}
                              attractionName={attraction.name}
                            />
                          </DialogContent>
                        </Dialog>
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

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Analytics</CardTitle>
              <CardDescription>Insights about your report usage and {attraction.name} performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed analytics about report usage, performance metrics, and trends for {attraction.name} will be available here.
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
export { OwnerReportsManagement }
