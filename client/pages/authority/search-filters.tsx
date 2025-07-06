"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Loader2,
  AlertCircle,
  Filter,
  Eye
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

interface FilterCategory {
  title: string
  options: string[]
}

interface FilterOptions {
  categories: string[]
  locations: string[]
  priceRanges: string[]
  openingStatuses: string[]
}

export function SearchFilters() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [ratingRange, setRatingRange] = useState([0, 5])
  const [priceRange, setPriceRange] = useState([0, 500000])
  
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [filteredAttractions, setFilteredAttractions] = useState<Attraction[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    locations: [],
    priceRanges: [],
    openingStatuses: []
  })

  const filterCategories: FilterCategory[] = [
    {
      title: "Category",
      options: filterOptions.categories,
    },
    {
      title: "Location",
      options: filterOptions.locations,
    },
    {
      title: "Opening Status",
      options: filterOptions.openingStatuses.length > 0 ? filterOptions.openingStatuses : ["Open Now", "Closed", "24 Hours", "Seasonal"],
    },
    {
      title: "Price Range",
      options: filterOptions.priceRanges.length > 0 ? filterOptions.priceRanges : ["Free", "Under Rp 50K", "Rp 50K - 100K", "Rp 100K - 200K", "Above Rp 200K"],
    },
  ]

  useEffect(() => {
    if (user && user.role.roleName === 'AUTHORITY') {
      fetchInitialData()
    }
  }, [user])

  // Debounced filter application
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedFilters, ratingRange, priceRange, attractions, user])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [attractionsResponse, filterOptionsResponse] = await Promise.all([
        authorityApi.getAllAttractions({ limit: 1000 }),
        authorityApi.getFilterOptions()
      ])

      if (attractionsResponse.success && attractionsResponse.data) {
        const attractionsData = attractionsResponse.data.attractions || attractionsResponse.data
        setAttractions(attractionsData)
        setFilteredAttractions(attractionsData)
      }

      if (filterOptionsResponse.success && filterOptionsResponse.data) {
        setFilterOptions({
          categories: filterOptionsResponse.data.categories || [],
          locations: filterOptionsResponse.data.locations || [],
          priceRanges: filterOptionsResponse.data.priceRanges || [],
          openingStatuses: filterOptionsResponse.data.openingStatuses || []
        })
      }

    } catch (err) {
      console.error("Error fetching filter data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = async () => {
    if (!user || user.role.roleName !== 'AUTHORITY') return

    try {
      setFiltering(true)
      setError(null)

      // Build search parameters
      const searchParams = {
        query: searchQuery || undefined,
        categories: selectedFilters.filter(f => filterOptions.categories.includes(f)),
        locations: selectedFilters.filter(f => filterOptions.locations.includes(f)),
        minRating: ratingRange[0],
        maxRating: ratingRange[1],
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        limit: 1000
      }

      // Use the search API endpoint for better filtering
      const response = await authorityApi.searchAttractions(searchParams)

      if (response.success && response.data) {
        const searchResults = response.data.attractions || response.data
        setFilteredAttractions(searchResults)
      } else {
        // Fallback to client-side filtering if search API fails
        let filtered = attractions.filter((attraction) => {
          // Text search
          const matchesSearch = !searchQuery || (
            attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (attraction.description && attraction.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            attraction.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attraction.category.toLowerCase().includes(searchQuery.toLowerCase())
          )

          // Rating filter
          const matchesRating = !attraction.rating || (attraction.rating >= ratingRange[0] && attraction.rating <= ratingRange[1])
          
          // Price filter
          const attractionPrice = attraction.price || 0
          const matchesPrice = attractionPrice >= priceRange[0] && attractionPrice <= priceRange[1]

          // Category and other filters
          const matchesFilters = selectedFilters.length === 0 || selectedFilters.some(filter => {
            // Category filter
            if (filterOptions.categories.includes(filter)) {
              return attraction.category === filter
            }
            
            // Location filter (check if address contains the location)
            if (filterOptions.locations.includes(filter)) {
              return attraction.address.toLowerCase().includes(filter.toLowerCase())
            }
            
            // Price range filters
            if (filter === "Free") return attractionPrice === 0
            if (filter === "Under Rp 50K") return attractionPrice > 0 && attractionPrice < 50000
            if (filter === "Rp 50K - 100K") return attractionPrice >= 50000 && attractionPrice <= 100000
            if (filter === "Rp 100K - 200K") return attractionPrice >= 100000 && attractionPrice <= 200000
            if (filter === "Above Rp 200K") return attractionPrice > 200000
            
            // Opening status filters (simplified logic)
            if (filter === "24 Hours") return attraction.openingHours?.includes("24") || attraction.openingHours?.includes("00:00")
            if (filter === "Open Now") return true // Would need real-time logic
            if (filter === "Closed") return false // Would need real-time logic
            if (filter === "Seasonal") return attraction.openingHours?.toLowerCase().includes("seasonal")
            
            return false
          })

          return matchesSearch && matchesRating && matchesPrice && matchesFilters
        })

        setFilteredAttractions(filtered)
      }

    } catch (err) {
      console.error("Error applying filters:", err)
      setError("Failed to filter attractions")
      
      // Fallback to showing all attractions
      setFilteredAttractions(attractions)
    } finally {
      setFiltering(false)
    }
  }

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]))
  }

  const clearAllFilters = () => {
    setSelectedFilters([])
    setSearchQuery("")
    setRatingRange([0, 5])
    setPriceRange([0, 500000])
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      setError(null)
      
      const exportParams = {
        format: 'excel' as 'csv' | 'excel' | 'pdf',
        categories: selectedFilters.filter(f => filterOptions.categories.includes(f)),
        minRating: ratingRange[0],
        maxRating: ratingRange[1],
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        includeStatistics: true
      }

      const response = await authorityApi.exportFilteredAttractions(exportParams)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.download = `filtered-attractions-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

    } catch (err) {
      console.error("Error exporting data:", err)
      setError("Failed to export data")
    } finally {
      setExporting(false)
    }
  }

  const handleRefresh = () => {
    fetchInitialData()
  }

  const viewAttractionDetails = (attractionId: number) => {
    // Navigate to attraction details page or open modal
    console.log("Viewing attraction details:", attractionId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading attraction filters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Search & Filter Attractions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Advanced search and filtering for attraction data analysis
          </p>
        </div>                <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="gap-2 text-xs sm:text-sm" 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting...' : 'Export Results'}
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-xs sm:text-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
        {/* Search and Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Search Bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search attractions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Filters */}
          {filterCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {category.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={selectedFilters.includes(option)}
                      onCheckedChange={() => handleFilterToggle(option)}
                    />
                    <Label htmlFor={option} className="text-xs sm:text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Rating Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Rating Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider value={ratingRange} onValueChange={setRatingRange} max={5} step={0.1} className="w-full" />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>{ratingRange[0].toFixed(1)} ⭐</span>
                <span>{ratingRange[1].toFixed(1)} ⭐</span>
              </div>
            </CardContent>
          </Card>

          {/* Price Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Price Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider value={priceRange} onValueChange={setPriceRange} max={500000} step={5000} className="w-full" />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>Rp {(priceRange[0] / 1000).toFixed(0)}K</span>
                <span>Rp {(priceRange[1] / 1000).toFixed(0)}K</span>
              </div>
            </CardContent>
          </Card>

          {/* Clear Filters */}
          <Button variant="outline" onClick={clearAllFilters} className="w-full text-sm">
            Clear All Filters
          </Button>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Active Filters */}
          {selectedFilters.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Active Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedFilters.map((filter) => (
                    <Badge key={filter} variant="secondary" className="gap-1 text-xs">
                      {filter}
                      <button
                        onClick={() => handleFilterToggle(filter)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Search Results</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Found {filteredAttractions.length} attractions matching your criteria
                  </CardDescription>
                </div>
                {filtering && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Filtering...
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredAttractions.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No attractions found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters to find more results.
                  </p>
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {filteredAttractions.map((attraction) => (
                  <div
                    key={attraction.id}
                    className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{attraction.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {attraction.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ID: {attraction.id}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {attraction.description || 'No description available'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{attraction.address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>{attraction.openingHours || 'Hours not specified'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>Rp {attraction.price ? attraction.price.toLocaleString() : '0'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span>Created: {new Date(attraction.createdDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center sm:text-right flex-shrink-0">
                        <div className="text-lg sm:text-xl font-semibold flex items-center justify-center sm:justify-end gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {attraction.rating ? attraction.rating.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Rating</div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 gap-1"
                          onClick={() => viewAttractionDetails(attraction.id)}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Summary */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Attractions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{filteredAttractions.length}</div>
                <p className="text-xs text-muted-foreground">From search results</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Avg Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  Rp{" "}
                  {filteredAttractions.length > 0 ? Math.round(
                    filteredAttractions.reduce((sum, a) => sum + (a.price || 0), 0) / filteredAttractions.length / 1000,
                  ) : 0}
                  K
                </div>
                <p className="text-xs text-muted-foreground">Average entry fee</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Avg Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  {filteredAttractions.length > 0 ? 
                    (filteredAttractions.reduce((sum, a) => sum + (a.rating || 0), 0) / filteredAttractions.length).toFixed(1) :
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  {new Set(filteredAttractions.map((a) => a.category)).size}
                </div>
                <p className="text-xs text-muted-foreground">Unique categories</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchFilters
