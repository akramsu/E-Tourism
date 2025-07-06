"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Filter, Download, RefreshCw, MapPin, DollarSign, Star, Clock, Calendar, X, AlertCircle, Loader2, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { authorityApi } from "@/lib/api"

interface Attraction {
  id: number
  name: string
  description: string
  address: string
  category: string
  userId: number
  createdDate: string
  latitude?: number
  longitude?: number
  openingHours?: string
  rating?: number
  price?: number
  location?: string
  visitCount?: number
  revenue?: number
  images?: Array<{ id: number; imageUrl: string }>
  user?: {
    id: number
    username: string
    email: string
  }
}

interface FilterOptions {
  categories: string[]
  locations: string[]
  minPrice: number
  maxPrice: number
  minRating: number
  maxRating: number
}

export function ApplyFilters() {
  const { user } = useAuth()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [ratingRange, setRatingRange] = useState([0, 5])
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [sortBy, setSortBy] = useState("")
  const [filteredResults, setFilteredResults] = useState<Attraction[]>([])
  const [allAttractions, setAllAttractions] = useState<Attraction[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch filter options and initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.role?.roleName || user.role.roleName.toLowerCase() !== 'authority') {
        setError('Access denied: This interface is only available to tourism authorities')
        setIsLoadingInitial(false)
        return
      }

      try {
        setIsLoadingInitial(true)
        setError(null)

        // Fetch filter options and all attractions in parallel
        const [filterOptionsResponse, attractionsResponse] = await Promise.all([
          authorityApi.getFilterOptions(),
          authorityApi.getAllAttractions({ limit: 1000 }) // Get all attractions
        ])

        if (filterOptionsResponse.data) {
          setFilterOptions(filterOptionsResponse.data)
          // Set initial price range based on actual data
          setPriceRange([
            filterOptionsResponse.data.minPrice || 0,
            filterOptionsResponse.data.maxPrice || 500000
          ])
          setRatingRange([
            filterOptionsResponse.data.minRating || 0,
            filterOptionsResponse.data.maxRating || 5
          ])
        }

        if (attractionsResponse.data) {
          setAllAttractions(attractionsResponse.data)
          setFilteredResults(attractionsResponse.data)
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load filter data')
      } finally {
        setIsLoadingInitial(false)
      }
    }

    fetchInitialData()
  }, [user?.role?.roleName])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleLocationToggle = (location: string) => {
    setSelectedLocations((prev) => (prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]))
  }

  const applyFilters = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Build filter parameters
      const filterParams = {
        query: searchQuery,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
        minRating: ratingRange[0] > 0 ? ratingRange[0] : undefined,
        maxRating: ratingRange[1] < 5 ? ratingRange[1] : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < (filterOptions?.maxPrice || 500000) ? priceRange[1] : undefined,
        sortBy: sortBy ? (sortBy.includes('-') ? sortBy.split('-')[0] : sortBy) : undefined,
        sortOrder: sortBy?.includes('-') ? (sortBy.endsWith('high') ? 'desc' : 'asc') : undefined,
        limit: 100,
        offset: 0
      }

      // Clean undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(filterParams).filter(([_, value]) => value !== undefined)
      )

      const response = await authorityApi.searchAttractions(cleanParams)
      
      if (response.data) {
        setFilteredResults(response.data)
      } else {
        setFilteredResults([])
      }
    } catch (error) {
      console.error('Error applying filters:', error)
      setError(error instanceof Error ? error.message : 'Failed to apply filters')
      setFilteredResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedLocations([])
    setRatingRange([filterOptions?.minRating || 0, filterOptions?.maxRating || 5])
    setPriceRange([filterOptions?.minPrice || 0, filterOptions?.maxPrice || 500000])
    setSortBy("")
    setSearchQuery("")
    setFilteredResults(allAttractions)
  }

  const refreshData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await authorityApi.getAllAttractions({ limit: 1000 })
      if (response.data) {
        setAllAttractions(response.data)
        if (filteredResults.length === 0) {
          setFilteredResults(response.data)
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportFilteredData = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const exportParams = {
        format,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
        minRating: ratingRange[0] > 0 ? ratingRange[0] : undefined,
        maxRating: ratingRange[1] < 5 ? ratingRange[1] : undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < (filterOptions?.maxPrice || 500000) ? priceRange[1] : undefined,
        includeStatistics: true
      }

      const response = await authorityApi.exportFilteredAttractions(exportParams)
      
      // Create download link
      const blob = new Blob([response], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `filtered_attractions_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting data:', error)
      setError(error instanceof Error ? error.message : 'Failed to export data')
    }
  }

  const activeFiltersCount =
    selectedCategories.length +
    selectedLocations.length +
    (ratingRange[0] > (filterOptions?.minRating || 0) || ratingRange[1] < (filterOptions?.maxRating || 5) ? 1 : 0) +
    (priceRange[0] > (filterOptions?.minPrice || 0) || priceRange[1] < (filterOptions?.maxPrice || 500000) ? 1 : 0) +
    (searchQuery.length > 0 ? 1 : 0)

  // Loading state
  if (isLoadingInitial) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !filterOptions) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Apply Filters</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Filter attraction data using multiple criteria and sorting options
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Apply Filters</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Filter attraction data using multiple criteria and sorting options
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="gap-2 text-xs sm:text-sm"
            onClick={() => exportFilteredData('csv')}
            disabled={isLoading || filteredResults.length === 0}
          >
            <Download className="h-4 w-4" />
            Export Filtered
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-xs sm:text-sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Data
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Filter Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Active Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={applyFilters} 
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearAllFilters} className="w-full gap-2">
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </CardContent>
          </Card>

          {/* Search Query */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Search</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                placeholder="Search attractions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              />
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filterOptions?.categories ? filterOptions.categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label htmlFor={category} className="text-xs sm:text-sm">
                    {category}
                  </Label>
                </div>
              )) : (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filterOptions?.locations ? filterOptions.locations.map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={location}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => handleLocationToggle(location)}
                  />
                  <Label htmlFor={location} className="text-xs sm:text-sm">
                    {location}
                  </Label>
                </div>
              )) : (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                <span>{priceRange[0] === 0 ? "Free" : `Rp ${(priceRange[0] / 1000).toFixed(0)}K`}</span>
                <span>Rp {(priceRange[1] / 1000).toFixed(0)}K</span>
              </div>
            </CardContent>
          </Card>

          {/* Sort Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Sort By</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sorting option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating-high">Rating (High to Low)</SelectItem>
                  <SelectItem value="rating-low">Rating (Low to High)</SelectItem>
                  <SelectItem value="price-high">Price (High to Low)</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="name">Name (A to Z)</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Active Filter Tags */}
          {(selectedCategories.length > 0 || selectedLocations.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Active Filter Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="gap-1 text-xs">
                      {category}
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {selectedLocations.map((location) => (
                    <Badge key={location} variant="outline" className="gap-1 text-xs">
                      {location}
                      <button
                        onClick={() => handleLocationToggle(location)}
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

          {/* Filtered Results */}
          {filteredResults.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Filtered Results</CardTitle>
                <CardDescription>
                  Showing {filteredResults.length} of {allAttractions.length} attractions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredResults.map((attraction) => (
                    <div
                      key={attraction.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-sm sm:text-base">{attraction.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {attraction.category}
                            </Badge>
                            {attraction.location && (
                              <Badge variant="secondary" className="text-xs">
                                {attraction.location}
                              </Badge>
                            )}
                            {attraction.user && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {attraction.user.username}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {attraction.description || 'No description available'}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{attraction.address}</span>
                            </div>
                            {attraction.openingHours && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>{attraction.openingHours}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span>
                                {attraction.price === 0 || attraction.price === null || attraction.price === undefined 
                                  ? "Free" 
                                  : `Rp ${Number(attraction.price).toLocaleString()}`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span>{new Date(attraction.createdDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {/* Additional stats */}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {attraction.visitCount && (
                              <span>Visits: {attraction.visitCount.toLocaleString()}</span>
                            )}
                            {attraction.revenue && (
                              <span>Revenue: Rp {Number(attraction.revenue).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-center sm:text-right flex-shrink-0">
                          <div className="text-lg sm:text-xl font-semibold flex items-center justify-center sm:justify-end gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {attraction.rating?.toFixed(1) || 'N/A'}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Rating</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results</h3>
                <p className="text-muted-foreground mb-4">
                  {activeFiltersCount > 0
                    ? "No attractions match your current filters. Try adjusting your criteria."
                    : "Click 'Apply Filters' to see results based on your filter criteria."}
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Filter Statistics */}
          {filteredResults.length > 0 && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredResults.length}</div>
                  <p className="text-xs text-muted-foreground">Attractions found</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredResults.length > 0 
                      ? (filteredResults.reduce((sum, a) => sum + (a.rating || 0), 0) / filteredResults.length).toFixed(1)
                      : 'N/A'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Average rating</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rp{" "}
                    {filteredResults.length > 0
                      ? Math.round(filteredResults.reduce((sum, a) => sum + (Number(a.price) || 0), 0) / filteredResults.length / 1000)
                      : 0
                    }K
                  </div>
                  <p className="text-xs text-muted-foreground">Average price</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{new Set(filteredResults.map((a) => a.category)).size}</div>
                  <p className="text-xs text-muted-foreground">Unique types</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
