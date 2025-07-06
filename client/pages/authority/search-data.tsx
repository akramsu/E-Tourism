"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { authorityApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { 
  Search, 
  Download, 
  RefreshCw, 
  MapPin, 
  DollarSign, 
  Star, 
  Clock, 
  Calendar, 
  Eye, 
  Loader2,
  AlertCircle,
  Filter,
  Database,
  Users,
  Building,
  TrendingUp
} from "lucide-react"

// TypeScript interfaces for live data
interface Attraction {
  id: number
  name: string
  description?: string
  address: string
  category: string
  userId: number
  createdDate: string
  latitude?: number
  longitude?: number
  openingHours?: string
  rating?: number
  price?: number
  user: {
    username: string
    email: string
  }
  images?: {
    id: number
    imageUrl: string
  }[]
  _count?: {
    visits: number
    reports: number
  }
}

interface SearchFilters {
  query: string
  categories: string[]
  minRating?: number
  maxRating?: number
  minPrice?: number
  maxPrice?: number
  sortBy: 'name' | 'rating' | 'price' | 'createdDate' | 'visitCount'
  sortOrder: 'asc' | 'desc'
  limit: number
  offset: number
}

interface DatabaseStats {
  totalAttractions: number
  totalCategories: number
  avgRating: number
  totalVisits: number
  totalRevenue: number
  activeOwners: number
}

export function SearchData() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [searchResults, setSearchResults] = useState<Attraction[]>([])
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    categories: [],
    minRating: undefined,
    maxRating: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: 'name',
    sortOrder: 'asc',
    limit: 50,
    offset: 0
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    if (user && user.role.roleName === 'AUTHORITY') {
      fetchInitialData()
    }
  }, [user])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [attractionsResponse, filterOptionsResponse, statsResponse] = await Promise.all([
        authorityApi.getAllAttractions({ limit: 1000 }),
        authorityApi.getFilterOptions(),
        authorityApi.getCityMetrics({ period: 'month', includeComparisons: true })
      ])

      if (attractionsResponse.success && attractionsResponse.data) {
        const attractionsData = attractionsResponse.data.attractions || attractionsResponse.data
        setAttractions(attractionsData)
        setSearchResults(attractionsData)
        setTotalResults(attractionsResponse.data.total || attractionsData.length)
      }

      if (filterOptionsResponse.success && filterOptionsResponse.data) {
        setCategories(filterOptionsResponse.data.categories || [])
      }

      if (statsResponse.success && statsResponse.data) {
        setDatabaseStats({
          totalAttractions: statsResponse.data.totalAttractions || 0,
          totalCategories: statsResponse.data.totalCategories || 0,
          avgRating: statsResponse.data.avgRating || 0,
          totalVisits: statsResponse.data.totalVisits || 0,
          totalRevenue: statsResponse.data.totalRevenue || 0,
          activeOwners: statsResponse.data.activeOwners || 0
        })
      }

    } catch (err) {
      console.error("Error fetching initial data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setSearching(true)
      setError(null)

      const searchParams = {
        query: filters.query || undefined,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        minRating: filters.minRating,
        maxRating: filters.maxRating,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: filters.limit,
        offset: (currentPage - 1) * itemsPerPage
      }

      const response = await authorityApi.searchAttractions(searchParams)

      if (response.success && response.data) {
        const resultsData = response.data.attractions || response.data
        setSearchResults(resultsData)
        setTotalResults(response.data.total || resultsData.length)
      } else {
        setError("Failed to search attractions")
      }

    } catch (err) {
      console.error("Error searching attractions:", err)
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }

  const handleExport = async () => {
    try {
      setError(null)
      
      const exportParams = {
        format: 'excel' as 'csv' | 'excel' | 'pdf',
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        minRating: filters.minRating,
        maxRating: filters.maxRating,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        includeStatistics: true
      }

      const response = await authorityApi.exportFilteredAttractions(exportParams)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `attractions-export-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

    } catch (err) {
      console.error("Error exporting data:", err)
      setError("Failed to export data")
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleRefresh = () => {
    fetchInitialData()
  }

  const viewAttractionDetails = (attractionId: number) => {
    // Navigate to attraction details page or open modal
    console.log("Viewing attraction details:", attractionId)
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      categories: [],
      minRating: undefined,
      maxRating: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'name',
      sortOrder: 'asc',
      limit: 50,
      offset: 0
    })
    setSearchResults(attractions)
    setTotalResults(attractions.length)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading attractions database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Attraction Database Search</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Search and manage all tourism attractions in the database
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2 text-xs sm:text-sm">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="gap-2 text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4" />
            Refresh Database
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Database Statistics */}
      {databaseStats && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Total Attractions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{databaseStats.totalAttractions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">In database</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{databaseStats.totalCategories}</div>
              <p className="text-xs text-muted-foreground">Unique types</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{databaseStats.avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Overall average</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{databaseStats.totalVisits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(databaseStats.totalRevenue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Search Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searchResults.length}</div>
              <p className="text-xs text-muted-foreground">Current results</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Database Search
          </CardTitle>
          <CardDescription>
            Search by name, description, address, category, or any field. Use advanced filters for precise results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, address, category..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} className="gap-2">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Advanced Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={filters.categories[0] || ""} 
                onValueChange={(value) => handleFilterChange('categories', value ? [value] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Min Rating</Label>
              <Select 
                value={filters.minRating?.toString() || ""} 
                onValueChange={(value) => handleFilterChange('minRating', value ? parseFloat(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Rating</SelectItem>
                  <SelectItem value="1">1+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="createdDate">Date Created</SelectItem>
                  <SelectItem value="visitCount">Visit Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Select 
                value={filters.sortOrder} 
                onValueChange={(value) => handleFilterChange('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filters.query || filters.categories.length > 0 || filters.minRating || filters.maxRating) && (
            <div className="flex justify-start">
              <Button onClick={clearFilters} variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Search Results</CardTitle>
            <CardDescription>
              Found {totalResults} attractions matching your search criteria. Showing {searchResults.length} results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((attraction) => (
                <div
                  key={attraction.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-base sm:text-lg">{attraction.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {attraction.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          ID: {attraction.id}
                        </Badge>
                        {attraction._count && attraction._count.visits > 0 && (
                          <Badge variant="default" className="text-xs">
                            {attraction._count.visits} visits
                          </Badge>
                        )}
                      </div>

                      {attraction.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{attraction.description}</p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground line-clamp-2">{attraction.address}</span>
                        </div>
                        {attraction.openingHours && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">{attraction.openingHours}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {attraction.price === 0 || !attraction.price 
                              ? "Free" 
                              : `$${attraction.price.toLocaleString()}`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Created: {new Date(attraction.createdDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>Owner: {attraction.user.username}</span>
                        <span>Email: {attraction.user.email}</span>
                        {attraction.latitude && attraction.longitude && (
                          <span>
                            Coordinates: {attraction.latitude.toFixed(4)}, {attraction.longitude.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 lg:items-end">
                      {attraction.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-lg font-semibold">{attraction.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => viewAttractionDetails(attraction.id)}
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalResults > itemsPerPage && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {Math.ceil(totalResults / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= Math.ceil(totalResults / itemsPerPage)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !searching && filters.query ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-4">
                No attractions match your search criteria. Try adjusting your filters or search terms.
              </p>
              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !searching && searchResults.length === 0 && !filters.query ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Search</h3>
              <p className="text-muted-foreground mb-4">
                Use the search interface above to find attractions in the database.
              </p>
              <Button onClick={() => {
                setSearchResults(attractions)
                setTotalResults(attractions.length)
              }}>
                Show All Attractions
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default SearchData
