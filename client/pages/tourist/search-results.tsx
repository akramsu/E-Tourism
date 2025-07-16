"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { touristApi } from "@/lib/api"
import {
  MapPin,
  Star,
  Clock,
  Heart,
  Share,
  Filter,
  Grid3X3,
  List,
  Map,
  SlidersHorizontal,
  Search,
  ArrowUpDown,
  Eye,
  Navigation,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface SearchResultsProps {
  onAttractionSelect: (attractionId: number) => void
  searchQuery: string
}

interface Attraction {
  id: number
  name: string
  category: string
  rating: number
  reviews: number
  price: string
  priceValue: number
  image: string
  location: string
  description: string
  tags: string[]
  timeToVisit: string
  distance: string
  openNow: boolean
  featured: boolean
  liked: boolean
  latitude: number
  longitude: number
  amenities: string[]
  openingHours: string
  ticketPrice: number
  capacity: number
}

export default function SearchResults({ onAttractionSelect, searchQuery }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [sortBy, setSortBy] = useState("relevance")
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, 200] as number[],
    rating: 0,
    distance: 50,
    openNow: false,
    features: [] as string[],
    sortBy: "relevance",
  })

  // Real attractions data from database
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [filteredAttractions, setFilteredAttractions] = useState<Attraction[]>([])

  // Load attractions from database
  useEffect(() => {
    const loadAttractions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await touristApi.getFeaturedAttractions(50)
        
        // Transform database data to match component interface
        const transformedAttractions: Attraction[] = response.data?.map((attraction: any) => ({
          id: attraction.id,
          name: attraction.name,
          category: attraction.category || "General",
          rating: attraction.rating || 0,
          reviews: attraction.totalVisits || 0,
          price: attraction.priceFormatted || "Free",
          priceValue: attraction.price || 0,
          image: attraction.images?.[0]?.url || "/placeholder.svg",
          location: attraction.location || "Unknown",
          description: attraction.description || "",
          tags: attraction.tags ? attraction.tags.split(',') : [],
          timeToVisit: "2-3 hours", // Default value
          distance: "1 km", // Default value - would need geolocation
          openNow: true, // Default value - would need hours logic
          featured: attraction.featured || false,
          liked: false, // Would need user preferences
          latitude: attraction.latitude || 0,
          longitude: attraction.longitude || 0,
          amenities: ["Parking", "WiFi"], // Default amenities
          openingHours: attraction.openingHours || "09:00 - 18:00",
          ticketPrice: attraction.price || 0,
          capacity: attraction.capacity || 1000,
        })) || []
        
        setAttractions(transformedAttractions)
      } catch (error) {
        console.error('Error loading attractions:', error)
        setError('Failed to load attractions. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAttractions()
  }, [])

  // Dynamic categories based on loaded attractions
  const categories = Array.from(new Set(attractions.map(a => a.category))).filter(Boolean)
  const features = ["WiFi", "Parking", "Restaurant", "Guided Tours", "Gift Shop", "Wheelchair Accessible"]

  // Filter and sort attractions
  useEffect(() => {
    const filtered = attractions.filter((attraction) => {
      // Search query filter
      if (searchQuery && !attraction.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(attraction.category)) {
        return false
      }

      // Price range filter
      if (
        attraction.priceValue < filters.priceRange[0] * 1000 ||
        attraction.priceValue > filters.priceRange[1] * 1000
      ) {
        return false
      }

      // Rating filter
      if (attraction.rating < filters.rating) {
        return false
      }

      // Open now filter
      if (filters.openNow && !attraction.openNow) {
        return false
      }

      return true
    })

    // Sort attractions
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "price-low":
        filtered.sort((a, b) => a.priceValue - b.priceValue)
        break
      case "price-high":
        filtered.sort((a, b) => b.priceValue - a.priceValue)
        break
      case "distance":
        filtered.sort((a, b) => Number.parseFloat(a.distance) - Number.parseFloat(b.distance))
        break
      case "reviews":
        filtered.sort((a, b) => b.reviews - a.reviews)
        break
      default:
        // Relevance - featured first, then by rating
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return b.rating - a.rating
        })
    }

    setFilteredAttractions(filtered)
  }, [attractions, searchQuery, filters, sortBy])

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleFeatureToggle = (feature: string) => {
    setFilters((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const loadMore = () => {
    setLoadingMore(true)
    // Simulate loading more results
    setTimeout(() => {
      setLoadingMore(false)
      setPage((prev) => prev + 1)
      // In real app, this would fetch more data
      if (page >= 3) {
        setHasMore(false)
      }
    }, 1000)
  }

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label htmlFor={category} className="text-sm">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
            max={200}
            step={5}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>IDR {filters.priceRange[0] * 1000}</span>
            <span>IDR {filters.priceRange[1] * 1000}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Minimum Rating</h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              variant={filters.rating >= rating ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, rating: rating === filters.rating ? 0 : rating })}
              className="p-1"
            >
              <Star className={`h-4 w-4 ${filters.rating >= rating ? "fill-current" : ""}`} />
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Distance</h3>
        <div className="px-2">
          <Slider
            value={[filters.distance]}
            onValueChange={(value) => setFilters({ ...filters, distance: value[0] })}
            max={100}
            step={5}
            className="mb-2"
          />
          <div className="text-sm text-slate-600 dark:text-slate-400">Within {filters.distance} km</div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Features</h3>
        <div className="space-y-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={feature}
                checked={filters.features.includes(feature)}
                onCheckedChange={() => handleFeatureToggle(feature)}
              />
              <Label htmlFor={feature} className="text-sm">
                {feature}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="openNow"
          checked={filters.openNow}
          onCheckedChange={(checked) => setFilters({ ...filters, openNow: checked as boolean })}
        />
        <Label htmlFor="openNow" className="text-sm">
          Open now
        </Label>
      </div>

      <Button
        variant="outline"
        onClick={() =>
          setFilters({
            categories: [],
            priceRange: [0, 200],
            rating: 0,
            distance: 50,
            openNow: false,
            features: [],
            sortBy: "relevance",
          })
        }
        className="w-full"
      >
        Clear All Filters
      </Button>
    </div>
  )

  const AttractionCard = ({ attraction, isListView = false }: { attraction: Attraction; isListView?: boolean }) => (
    <Card
      className={`group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:scale-[1.02] ${
        isListView ? "flex flex-row" : ""
      }`}
      onClick={() => onAttractionSelect(attraction.id)}
    >
      <div className={`relative overflow-hidden ${isListView ? "w-48 flex-shrink-0" : ""}`}>
        <img
          src={attraction.image || "/placeholder.svg"}
          alt={attraction.name}
          className={`object-cover group-hover:scale-110 transition-transform duration-500 ${
            isListView ? "w-full h-full" : "w-full h-48"
          }`}
        />

        {attraction.featured && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <Award className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm">
            <Heart className={`h-4 w-4 ${attraction.liked ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm">
            <Share className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-slate-900 backdrop-blur-sm">
            {attraction.category}
          </Badge>
        </div>

        <div className="absolute bottom-3 right-3">
          <Badge className={`${attraction.openNow ? "bg-green-500" : "bg-red-500"} text-white`}>
            {attraction.openNow ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>

      <CardContent className={`p-4 ${isListView ? "flex-1" : ""}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{attraction.name}</h3>
          <div className="flex items-center gap-1 text-yellow-500 ml-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{attraction.rating}</span>
          </div>
        </div>

        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          {attraction.location} • {attraction.distance}
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 line-clamp-2">{attraction.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {attraction.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
            <Clock className="h-4 w-4 mr-1" />
            {attraction.timeToVisit}
          </div>
          <p className="font-bold text-lg text-slate-900 dark:text-white">{attraction.price}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{attraction.reviews.toLocaleString()} reviews</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs hover:bg-blue-50 dark:hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation()
                onAttractionSelect(attraction.id)
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs hover:bg-green-50 dark:hover:bg-slate-700">
              <Navigation className="h-3 w-3 mr-1" />
              Directions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const LoadingSkeleton = ({ isListView = false }: { isListView?: boolean }) => (
    <Card className={`overflow-hidden ${isListView ? "flex flex-row" : ""}`}>
      <div className={`${isListView ? "w-48 flex-shrink-0" : ""}`}>
        <Skeleton className={`${isListView ? "w-full h-full" : "w-full h-48"}`} />
      </div>
      <div className={`p-4 space-y-3 ${isListView ? "flex-1" : ""}`}>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {searchQuery ? `Search Results for "${searchQuery}"` : "Explore Attractions"}
              </h1>
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading attractions...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">{filteredAttractions.length} attractions found</p>
              )}
            </div>

            {/* View Mode and Sort */}
            <div className="flex items-center gap-3">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list" | "map")}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="grid" className="gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                  <TabsTrigger value="map" className="gap-2">
                    <Map className="h-4 w-4" />
                    <span className="hidden sm:inline">Map</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="reviews">Most Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.categories.length > 0 || filters.rating > 0 || filters.openNow) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.categories.map((category) => (
                <Badge key={category} variant="secondary" className="gap-1">
                  {category}
                  <button onClick={() => handleCategoryToggle(category)} className="ml-1 hover:text-red-500">
                    ×
                  </button>
                </Badge>
              ))}
              {filters.rating > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {filters.rating}+ Stars
                  <button onClick={() => setFilters({ ...filters, rating: 0 })} className="ml-1 hover:text-red-500">
                    ×
                  </button>
                </Badge>
              )}
              {filters.openNow && (
                <Badge variant="secondary" className="gap-1">
                  Open Now
                  <button
                    onClick={() => setFilters({ ...filters, openNow: false })}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <Card className="sticky top-24 border-0 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="h-5 w-5" />
                <h2 className="font-semibold text-slate-900 dark:text-white">Filters</h2>
              </div>
              <FilterSidebar />
            </Card>
          </div>

          {/* Mobile Filter Sheet */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="mb-4">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(filters.categories.length > 0 || filters.rating > 0 || filters.openNow) && (
                    <Badge className="ml-2 h-5 w-5 p-0 text-xs">
                      {filters.categories.length + (filters.rating > 0 ? 1 : 0) + (filters.openNow ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={viewMode} className="w-full">
              {/* Error State */}
              {error && !isLoading && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Unable to load attractions
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </div>
              )}

              {/* No Results State */}
              {!error && !isLoading && filteredAttractions.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No attractions found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button 
                    onClick={() => {
                      setFilters({
                        categories: [],
                        priceRange: [0, 200],
                        rating: 0,
                        distance: 50,
                        openNow: false,
                        features: [],
                        sortBy: "relevance",
                      })
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Grid View */}
              <TabsContent value="grid" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => <LoadingSkeleton key={index} />)
                    : filteredAttractions.map((attraction) => (
                        <AttractionCard key={attraction.id} attraction={attraction} />
                      ))}
                </div>
              </TabsContent>

              {/* List View */}
              <TabsContent value="list" className="mt-0">
                <div className="space-y-6">
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => <LoadingSkeleton key={index} isListView />)
                    : filteredAttractions.map((attraction) => (
                        <AttractionCard key={attraction.id} attraction={attraction} isListView />
                      ))}
                </div>
              </TabsContent>

              {/* Map View */}
              <TabsContent value="map" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-slate-500 dark:text-slate-400">
                      <Map className="h-12 w-12 mx-auto mb-2" />
                      <p>Interactive map coming soon</p>
                    </div>
                  </div>
                  <div className="space-y-4 overflow-y-auto">
                    {filteredAttractions.slice(0, 5).map((attraction) => (
                      <AttractionCard key={attraction.id} attraction={attraction} />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Load More */}
            {hasMore && viewMode !== "map" && (
              <div className="mt-8 text-center">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    "Load More Attractions"
                  )}
                </Button>
              </div>
            )}

            {/* No Results */}
            {filteredAttractions.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No attractions found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">Try adjusting your filters or search terms</p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      categories: [],
                      priceRange: [0, 200],
                      rating: 0,
                      distance: 50,
                      openNow: false,
                      features: [],
                      sortBy: "relevance",
                    })
                  }
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
