"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAttractions } from "@/hooks/use-attractions"
import {
  MapPin,
  Star,
  Clock,
  Camera,
  Heart,
  Navigation,
  Search,
  TrendingUp,
  Calendar,
  Award,
  Compass,
  ArrowRight,
  Share,
  Sparkles,
  Eye,
  Loader2,
} from "lucide-react"
import type React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TouristDashboardProps {
  onPageChange: (page: string) => void
  onAttractionSelect: (attractionId: number) => void
}

// Replace the DestinationCard component with this simplified version that only shows images
const DestinationCard: React.FC<{ image: string; title: string; onSelect?: () => void }> = ({ image, title, onSelect }) => {
  return (
    <div className="group cursor-pointer p-1" onClick={onSelect}>
      <div className="relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-4">
          <h3 className="text-white font-bold text-lg drop-shadow-lg">{title}</h3>
        </div>
      </div>
    </div>
  )
}

// Replace the DestinationsCarousel component with this simplified version
const DestinationsCarousel: React.FC<{ images: { url: string; title: string; attractionId?: number }[]; onImageSelect?: (attractionId: number) => void }> = ({ images, onImageSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" })
    }
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  if (!images || images.length === 0) {
    return (
      <div className="lg:col-span-3 flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Loading destinations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:col-span-3">
      <div className="flex items-center justify-end mb-6">
        <div className="flex space-x-3">
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-all duration-300 group ${
              canScrollLeft ? "hover:bg-white/20 cursor-pointer" : "opacity-50 cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-all duration-300 group ${
              canScrollRight ? "hover:bg-white/30 cursor-pointer" : "opacity-50 cursor-not-allowed"
            }`}
          >
            <ChevronRight className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          className={`absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-teal-900/80 via-emerald-900/60 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-teal-900/80 via-emerald-900/60 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-x-auto scrollbar-hide scroll-smooth px-4 pt-8"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            maskImage:
              "linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)",
          }}
        >
          <div className="flex space-x-4 pb-4" style={{ width: "max-content" }}>
            {images.map((img, index) => (
              <div key={index} className="flex-shrink-0" style={{ width: "240px" }}>
                <DestinationCard 
                  image={img.url} 
                  title={img.title} 
                  onSelect={() => img.attractionId && onImageSelect?.(img.attractionId)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Convert price from decimal to formatted string
const formatPrice = (price: string | number) => {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price
  return priceNum === 0 ? 'Free' : `$${priceNum}`
}

// Calculate distance (placeholder function)
const calculateDistance = (lat?: number, lng?: number) => {
  // In a real app, you'd calculate based on user location
  return `${Math.floor(Math.random() * 20) + 1} km`
}

// Update the TouristDashboard component to use live data
export default function TouristDashboard({ onPageChange, onAttractionSelect }: TouristDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Use live attractions data
  const { 
    attractions: featuredAttractions, 
    loading: featuredLoading, 
    error: featuredError,
    fetchFeaturedAttractions 
  } = useAttractions()
  
  // Fetch all attractions for carousel images
  const { 
    attractions: allAttractions, 
    loading: allLoading,
    fetchAttractions 
  } = useAttractions()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Load live data on component mount
  useEffect(() => {
    fetchFeaturedAttractions()
    fetchAttractions({ limit: 20 }) // Get more attractions for variety
  }, [])

  // Extract images from all attractions for the hero carousel
  const carouselImages = allAttractions
    .filter(attraction => attraction.images && attraction.images.length > 0)
    .flatMap(attraction => 
      attraction.images.map(image => ({
        url: image.imageUrl,
        title: attraction.name,
        attractionId: attraction.id
      }))
    )
    .slice(0, 8) // Limit to 8 images for performance

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -350, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 350, behavior: "smooth" })
    }
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

      // Calculate current slide based on scroll position
      const slideWidth = 350 // approximate width of each card + gap
      const newSlide = Math.round(scrollLeft / slideWidth)
      setCurrentSlide(newSlide)
    }
  }

  // Static data that will be replaced with live data in future phases
  const quickStats = [
    { label: "Attractions Visited", value: "12", change: "+3 this month", icon: MapPin, color: "text-blue-600" },
    { label: "Average Rating Given", value: "4.5", change: "★ Excellent", icon: Star, color: "text-yellow-600" },
    { label: "Total Experiences", value: "24", change: "+6 this month", icon: Calendar, color: "text-green-600" },
    { label: "Travel Points", value: "1,247", change: "+250 earned", icon: Award, color: "text-purple-600" },
  ]

  const trendingDestinations = [
    {
      name: "Mount Bromo",
      location: "East Java",
      visitors: "2.3k",
      trend: "+15%",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      name: "Lake Toba",
      location: "North Sumatra",
      visitors: "1.8k",
      trend: "+22%",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      name: "Komodo National Park",
      location: "East Nusa Tenggara",
      visitors: "1.2k",
      trend: "+8%",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      name: "Raja Ampat",
      location: "West Papua",
      visitors: "890",
      trend: "+31%",
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onPageChange("Search Results")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Hero Section - New Design */}
      <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2835&q=80')`,
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-6 py-16 min-h-screen flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <p className="text-cyan-300 text-sm font-medium tracking-wide uppercase mb-2">Travel website</p>
          </div>

          {/* Main Content */}
          <div className="flex-1 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                  NEVER STOP
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    EXPLORING
                  </span>
                  <br />
                  THE WORLD.
                </h1>

                <p className="text-gray-300 text-lg max-w-md leading-relaxed">
                  Discover the world's most incredible destinations and create unforgettable memories. From pristine
                  beaches to majestic mountains, your next adventure awaits.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-300 rounded-full focus:bg-white/20 focus:border-cyan-400 transition-all duration-300"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>

            {/* Right Content - Live Destination Cards */}
            <DestinationsCarousel 
              images={carouselImages} 
              onImageSelect={onAttractionSelect}
            />
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between items-center mt-12">
            <div className="flex space-x-4">
              <div className="w-12 h-1 bg-cyan-400 rounded-full" />
              <div className="w-4 h-1 bg-white/40 rounded-full" />
              <div className="w-4 h-1 bg-white/40 rounded-full" />
            </div>

            <div className="text-6xl font-bold text-white/20">01</div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-cyan-400 rounded-full animate-pulse" />
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/3 left-10 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-500" />
      </section>

      {/* Rest of the dashboard content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Travel Journey</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickStats.map((stat, index) => (
              <Card
                key={index}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl group hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <CardContent className="p-3 sm:p-4 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{stat.label}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">{stat.change}</p>
                    </div>
                    <div
                      className={`p-2 rounded-full bg-slate-100 dark:bg-slate-700 ${stat.color} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Attractions - LIVE DATA */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Featured Attractions</h2>
              <p className="text-slate-600 dark:text-slate-400">Discover the most popular destinations</p>
            </div>
            <Button variant="outline" onClick={() => onPageChange("Search Results")} className="w-fit group">
              View All
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading featured attractions: {featuredError}</p>
              <Button onClick={fetchFeaturedAttractions} variant="outline">
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {featuredAttractions.map((attraction) => (
                <Card
                  key={attraction.id}
                  className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-800 hover:scale-[1.02]"
                  onClick={() => onAttractionSelect(attraction.id)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={attraction.images?.[0]?.imageUrl || "/placeholder.svg"}
                      alt={attraction.name}
                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    {attraction.featured && (
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}

                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 text-slate-900 backdrop-blur-sm">
                        {attraction.category}
                      </Badge>
                    </div>

                    {/* Status Indicator - Based on opening hours */}
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-green-500 text-white">
                        Open
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                        {attraction.name}
                      </h3>
                      <div className="flex items-center gap-1 text-yellow-500 ml-2">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {attraction.rating}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {attraction.address} • {calculateDistance(attraction.latitude, attraction.longitude)}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 line-clamp-2">
                      {attraction.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {attraction.openingHours || "Check hours"}
                      </div>
                      <p className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                        {formatPrice(attraction.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{attraction._count.visits} visits</span>
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
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Trending & Interactive Map Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trending Destinations */}
          <Card className="lg:col-span-1 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Trending Now
              </CardTitle>
              <CardDescription>Popular destinations this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendingDestinations.map((dest, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                  onClick={() => onPageChange("Search Results")}
                >
                  <img
                    src={dest.image || "/placeholder.svg"}
                    alt={dest.name}
                    className="w-12 h-12 object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{dest.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{dest.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{dest.visitors}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{dest.trend}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Interactive Map Preview */}
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-600" />
                Explore Map
              </CardTitle>
              <CardDescription>Discover attractions near you</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-48 sm:h-64 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg mx-4 sm:mx-6 mb-4 sm:mb-6 flex items-center justify-center overflow-hidden">
                {/* Animated Map Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
                <div className="text-center relative z-10">
                  <MapPin className="h-8 sm:h-12 w-8 sm:w-12 text-blue-600 mx-auto mb-2 animate-bounce" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">Interactive map coming soon</p>
                  <Button
                    onClick={() => onPageChange("Search Results")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Explore Map
                  </Button>
                </div>

                {/* Floating Map Markers */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute bottom-6 right-8 w-3 h-3 bg-blue-500 rounded-full animate-ping delay-500"></div>
                <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-green-500 rounded-full animate-ping delay-1000"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">Plan Your Adventure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                title: "Get Recommendations",
                description: "AI-powered suggestions based on your preferences",
                icon: Compass,
                action: () => onPageChange("Recommendations"),
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                title: "Find Events",
                description: "Discover festivals, concerts, and activities",
                icon: Calendar,
                action: () => onPageChange("Events & Activities"),
                gradient: "from-purple-500 to-pink-500",
              },
              {
                title: "Plan Itinerary",
                description: "Create your perfect travel schedule",
                icon: Navigation,
                action: () => onPageChange("Recommendations"),
                gradient: "from-green-500 to-emerald-500",
              },
              {
                title: "Share Experiences",
                description: "Connect with fellow travelers",
                icon: Camera,
                action: () => onPageChange("User Profile"),
                gradient: "from-orange-500 to-red-500",
              },
            ].map((action, index) => (
              <Card
                key={index}
                className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:scale-105 overflow-hidden"
                onClick={action.action}
              >
                <CardContent className="p-4 sm:p-6 text-center relative">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r ${action.gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{action.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{action.description}</p>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    onClick={action.action}
                  >
                    <action.icon className="h-4 w-4 mr-2 text-white" />
                    {action.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
