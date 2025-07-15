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
  user?: {
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
  locations: string[]
  minRating?: number
  maxRating?: number
  minPrice?: number
  maxPrice?: number
  sortBy: 'name' | 'rating' | 'price' | 'createdDate' | 'visitCount' | 'revenue'
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
  const [locations, setLocations] = useState<string[]>([])
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    categories: [],
    locations: [],
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
  const itemsPerPage = 7  // Show 7 attractions per page
  const [displayedAttractions, setDisplayedAttractions] = useState<Attraction[]>([])
  const [showLoadMore, setShowLoadMore] = useState(false)

  // Helper function to get current price range value
  const getCurrentPriceRangeValue = () => {
    if (filters.minPrice === undefined && filters.maxPrice === undefined) {
      return "any"
    }
    if (filters.minPrice === 0 && filters.maxPrice === 0) {
      return "free"
    }
    if (filters.minPrice === 0 && filters.maxPrice === 25) {
      return "0-25"
    }
    if (filters.minPrice === 25 && filters.maxPrice === 50) {
      return "25-50"
    }
    if (filters.minPrice === 50 && filters.maxPrice === 100) {
      return "50-100"
    }
    if (filters.minPrice === 100 && filters.maxPrice === undefined) {
      return "100+"
    }
    return "any"
  }

  useEffect(() => {
    if (user && user.role.roleName === 'AUTHORITY') {
      fetchInitialData()
    }
  }, [user])

  // Update displayed attractions when search results change
  useEffect(() => {
    if (searchResults.length > 0) {
      const firstPage = searchResults.slice(0, itemsPerPage)
      setDisplayedAttractions(firstPage)
      setShowLoadMore(searchResults.length > itemsPerPage)
    } else {
      setDisplayedAttractions([])
      setShowLoadMore(false)
    }
  }, [searchResults])

  // Load more attractions
  const loadMoreAttractions = () => {
    const currentCount = displayedAttractions.length
    const nextBatch = searchResults.slice(currentCount, currentCount + itemsPerPage)
    setDisplayedAttractions(prev => [...prev, ...nextBatch])
    setShowLoadMore(currentCount + itemsPerPage < searchResults.length)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
      // Escape to clear filters
      if (e.key === 'Escape' && (filters.query || filters.categories.length > 0)) {
        clearFilters()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filters])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all attractions with proper parameters
      const attractionsResponse = await authorityApi.getAllAttractions({ 
        limit: 1000,
        status: 'all'
      })

      // Fetch filter options (categories, locations)
      const filterOptionsResponse = await authorityApi.getFilterOptions()

      // Fetch city metrics for statistics
      const metricsResponse = await authorityApi.getCityMetrics({ 
        period: 'month', 
        includeComparisons: true 
      })

      console.log("API Responses:", {
        attractions: attractionsResponse,
        filterOptions: filterOptionsResponse,
        metrics: metricsResponse
      })

      // Process attractions data
      if (attractionsResponse.success && attractionsResponse.data) {
        const attractionsData = Array.isArray(attractionsResponse.data) 
          ? attractionsResponse.data 
          : attractionsResponse.data.attractions || []
        
        setAttractions(attractionsData)
        setSearchResults(attractionsData)
        setTotalResults(attractionsData.length)
        
        console.log("Loaded attractions:", attractionsData.length)
      } else {
        console.error("Failed to load attractions:", attractionsResponse)
        setError("Failed to load attractions data")
      }

      // Process filter options
      if (filterOptionsResponse.success && filterOptionsResponse.data) {
        const categories = filterOptionsResponse.data.categories || []
        const locations = filterOptionsResponse.data.locations || []
        setCategories(categories)
        setLocations(locations)
        
        console.log("Loaded filter options:", { categories, locations })
      } else {
        console.log("No filter options available, using defaults")
        setCategories([])
        setLocations([])
      }

      // Process metrics for statistics
      if (metricsResponse.success && metricsResponse.data) {
        const data = metricsResponse.data
        setDatabaseStats({
          totalAttractions: data.totalAttractions || (attractionsResponse.data ? 
            (Array.isArray(attractionsResponse.data) ? attractionsResponse.data.length : attractionsResponse.data.attractions?.length || 0) : 0),
          totalCategories: data.totalCategories || categories.length || 0,
          avgRating: data.avgRating || 0,
          totalVisits: data.totalVisits || 0,
          totalRevenue: data.totalRevenue || 0,
          activeOwners: data.activeOwners || 0
        })
        
        console.log("Loaded statistics:", data)
      } else {
        console.log("No metrics available, using defaults")
        // Set default stats based on loaded attractions
        const attractionsCount = attractionsResponse.data ? 
          (Array.isArray(attractionsResponse.data) ? attractionsResponse.data.length : attractionsResponse.data.attractions?.length || 0) : 0
        setDatabaseStats({
          totalAttractions: attractionsCount,
          totalCategories: categories.length,
          avgRating: 0,
          totalVisits: 0,
          totalRevenue: 0,
          activeOwners: 0
        })
      }

    } catch (err) {
      console.error("Error fetching initial data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load data"
      setError(errorMessage)
      
      // Set mock data for development/testing purposes
      console.log("Setting mock data for development...")
      const mockAttractions: Attraction[] = [
        {
          id: 1,
          name: "Sydney Opera House",
          description: "Iconic performing arts venue and architectural marvel",
          address: "Bennelong Point, Sydney NSW 2000, Australia",
          category: "Cultural",
          userId: 1,
          createdDate: "2024-01-15T00:00:00Z",
          latitude: -33.8568,
          longitude: 151.2153,
          openingHours: "9:00 AM - 5:00 PM",
          rating: 4.8,
          price: 45,
          user: { username: "sydney_venues", email: "contact@sydneyoperahouse.com" },
          _count: { visits: 1250, reports: 3 }
        },
        {
          id: 2,
          name: "Great Barrier Reef Tours",
          description: "World-class snorkeling and diving experiences",
          address: "Cairns, Queensland, Australia",
          category: "Nature",
          userId: 2,
          createdDate: "2024-02-20T00:00:00Z",
          latitude: -16.2908,
          longitude: 145.7781,
          rating: 4.9,
          price: 85,
          user: { username: "reef_tours", email: "info@reeftours.com.au" },
          _count: { visits: 890, reports: 1 }
        },
        {
          id: 3,
          name: "Melbourne Street Art Tour",
          description: "Explore vibrant street art and cultural laneways",
          address: "Melbourne CBD, Victoria, Australia",
          category: "Cultural",
          userId: 3,
          createdDate: "2024-03-10T00:00:00Z",
          rating: 4.6,
          price: 0,
          user: { username: "melbourne_art", email: "tours@melbourneart.com" },
          _count: { visits: 567, reports: 0 }
        }
      ]
      
      const mockCategories = ["Cultural", "Nature", "Adventure", "Historical", "Urban"]
      
      setAttractions(mockAttractions)
      setSearchResults(mockAttractions)
      setCategories(mockCategories)
      setLocations([]) // Remove locations since we're removing location filter
      setTotalResults(mockAttractions.length)
      setDatabaseStats({
        totalAttractions: mockAttractions.length,
        totalCategories: mockCategories.length,
        avgRating: 4.7,
        totalVisits: 2707,
        totalRevenue: 185500,
        activeOwners: 3
      })
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

      console.log("Search params:", searchParams)

      const response = await authorityApi.searchAttractions(searchParams)

      console.log("Search response:", response)

      if (response.success && response.data) {
        const resultsData = Array.isArray(response.data) 
          ? response.data 
          : response.data.attractions || response.data.results || []
        
        setSearchResults(resultsData)
        setTotalResults(response.data.total || resultsData.length)
        
        console.log("Search results:", resultsData.length)
      } else {
        setError("No results found for your search criteria")
        setSearchResults([])
        setTotalResults(0)
      }

    } catch (err) {
      console.error("Error searching attractions:", err)
      const errorMessage = err instanceof Error ? err.message : "Search failed"
      setError(errorMessage)
      setSearchResults([])
      setTotalResults(0)
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

      console.log("Export params:", exportParams)

      const response = await authorityApi.exportFilteredAttractions(exportParams)
      
      if (response instanceof Blob || response instanceof ArrayBuffer) {
        // Create download link
        const blob = response instanceof Blob ? response : new Blob([response])
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `attractions-export-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
      } else {
        console.error("Unexpected export response format:", response)
        setError("Export failed: Invalid response format")
      }

    } catch (err) {
      console.error("Error exporting data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to export data"
      setError(errorMessage)
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

  const viewAttractionDetails = async (attractionId: number) => {
    try {
      // Get detailed attraction information
      const response = await authorityApi.getAttractionDetails(attractionId)
      
      if (response.success && response.data) {
        console.log("Attraction details:", response.data)
        // For now, just log the details. Later this could open a modal or navigate to details page
        alert(`Viewing details for attraction ID: ${attractionId}\nName: ${response.data.name}\nAddress: ${response.data.address}`)
      } else {
        setError("Failed to load attraction details")
      }
    } catch (err) {
      console.error("Error fetching attraction details:", err)
      setError("Failed to load attraction details")
    }
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      categories: [],
      locations: [],
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Trigger search with new page
    setTimeout(() => {
      if (filters.query || filters.categories.length > 0) {
        handleSearch()
      }
    }, 0)
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
            <br />
            <span className="text-xs text-muted-foreground">
              Tip: Press Ctrl+K (Cmd+K on Mac) to focus search, or Escape to clear filters
            </span>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={filters.categories[0] || "all"} 
                onValueChange={(value) => handleFilterChange('categories', value === "all" ? [] : [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
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
                value={filters.minRating?.toString() || "any"} 
                onValueChange={(value) => handleFilterChange('minRating', value === "any" ? undefined : parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Rating</SelectItem>
                  <SelectItem value="1">1+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price Range</Label>
              <Select 
                value={getCurrentPriceRangeValue()} 
                onValueChange={(value) => {
                  if (value === "any") {
                    handleFilterChange('minPrice', undefined)
                    handleFilterChange('maxPrice', undefined)
                  } else if (value === "free") {
                    handleFilterChange('minPrice', 0)
                    handleFilterChange('maxPrice', 0)
                  } else if (value === "0-25") {
                    handleFilterChange('minPrice', 0)
                    handleFilterChange('maxPrice', 25)
                  } else if (value === "25-50") {
                    handleFilterChange('minPrice', 25)
                    handleFilterChange('maxPrice', 50)
                  } else if (value === "50-100") {
                    handleFilterChange('minPrice', 50)
                    handleFilterChange('maxPrice', 100)
                  } else if (value === "100+") {
                    handleFilterChange('minPrice', 100)
                    handleFilterChange('maxPrice', undefined)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Price</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="0-25">$0 - $25</SelectItem>
                  <SelectItem value="25-50">$25 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100+">$100+</SelectItem>
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
                  <SelectItem value="revenue">Revenue</SelectItem>
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

          {/* Active Filters Summary */}
          {(filters.query || filters.categories.length > 0 || filters.minRating || filters.minPrice || filters.maxPrice) && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              {filters.query && (
                <Badge variant="secondary" className="text-xs">
                  Query: "{filters.query}"
                </Badge>
              )}
              {filters.categories.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Category: {filters.categories[0]}
                </Badge>
              )}
              {filters.minRating && (
                <Badge variant="secondary" className="text-xs">
                  Rating: {filters.minRating}+ stars
                </Badge>
              )}
              {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                <Badge variant="secondary" className="text-xs">
                  Price: {filters.minPrice === 0 && filters.maxPrice === 0 ? 'Free' : 
                    `$${filters.minPrice || 0}${filters.maxPrice ? ` - $${filters.maxPrice}` : '+'}`}
                </Badge>
              )}
            </div>
          )}

          {/* Clear Filters Button */}
          {(filters.query || filters.categories.length > 0 || filters.minRating || filters.maxRating || filters.minPrice || filters.maxPrice) && (
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
      {searching ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Searching attractions...</p>
            </div>
          </CardContent>
        </Card>
      ) : searchResults.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Search Results</CardTitle>
            <CardDescription>
              Found {totalResults.toLocaleString()} attractions matching your search criteria. 
              Showing {displayedAttractions.length} of {searchResults.length} results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayedAttractions.map((attraction) => (
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
                            {!attraction.price || attraction.price === 0 || Number(attraction.price) === 0
                              ? "Free" 
                              : `$${Number(attraction.price).toLocaleString()}`
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
                        <span>Owner: {attraction.user?.username || 'Unknown'}</span>
                        <span>Email: {attraction.user?.email || 'N/A'}</span>
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

            {/* Load More Button */}
            {showLoadMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={loadMoreAttractions}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Load More Attractions ({searchResults.length - displayedAttractions.length} remaining)
                </Button>
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
                setCurrentPage(1)
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
