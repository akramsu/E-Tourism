"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { touristApi, userApi } from "@/lib/api"
import InteractiveMap from "@/components/ui/interactive-map"

interface TouristDashboardProps {
  onPageChange: (page: string) => void
  onAttractionSelect: (attractionId: number) => void
}

interface Attraction {
  id: number
  name: string
  category: string
  rating: number
  reviews: number
  price: string
  image: string
  location: string
  address: string
  description: string
  tags: string[]
  timeToVisit: string
  distance: string
  openNow: boolean
  featured: boolean
  liked: boolean
  latitude?: number
  longitude?: number
  openingHours?: string
  userId: number
  createdDate: string
  images?: { id: number; imageUrl: string }[]
}

interface UserStats {
  attractionsVisited: number
  averageRating: number
  totalExperiences: number
  travelPoints: number
  monthlyVisits: number
  monthlyExperiences: number
  pointsEarned: number
}

interface TrendingDestination {
  id: number
  name: string
  location: string
  visitors: string
  trend: string
  image: string
  category: string
}

// Replace the DestinationCard component with this simplified version that only shows images
const DestinationCard: React.FC<{ image: string; title: string }> = ({ image, title }) => {
  return (
    <div className="group cursor-pointer p-1">
      <div className="relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>
    </div>
  )
}

// Replace the DestinationsCarousel component with this simplified version
const DestinationsCarousel: React.FC<{ images: { url: string; title: string }[] }> = ({ images }) => {
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
                <DestinationCard image={img.url} title={img.title} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Update the TouristDashboard component to use real data from the database
export default function TouristDashboard({ onPageChange, onAttractionSelect }: TouristDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for real data from API
  const [featuredAttractions, setFeaturedAttractions] = useState<Attraction[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [trendingDestinations, setTrendingDestinations] = useState<TrendingDestination[]>([])
  const [attractionStats, setAttractionStats] = useState<any>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

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

  // Load data from API on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load data in parallel
        const [
          featuredResponse,
          userStatsResponse,
          attractionStatsResponse,
        ] = await Promise.all([
          touristApi.getFeaturedAttractions(4),
          userApi.getUserStats().catch(() => null), // Handle case where user stats don't exist
          touristApi.getAttractionStats().catch(() => null),
        ])

        // Process featured attractions
        if (featuredResponse.success && featuredResponse.data) {
          const processedAttractions = featuredResponse.data.map((attraction: any) => ({
            id: attraction.id,
            name: attraction.name,
            category: attraction.category,
            rating: attraction.rating || 0,
            reviews: attraction._count?.visits || 0,
            price: attraction.price ? `IDR ${attraction.price.toLocaleString()}` : "Free",
            image: attraction.images?.[0]?.imageUrl || "/placeholder.svg?height=300&width=400",
            location: attraction.address,
            address: attraction.address,
            description: attraction.description || "",
            tags: [], // Will be populated from categories or other fields
            timeToVisit: "2-3 hours", // Default estimate
            distance: "Unknown", // Would need geolocation calculation
            openNow: true, // Would need opening hours logic
            featured: true,
            liked: false, // Would need user preferences
            latitude: attraction.latitude,
            longitude: attraction.longitude,
            openingHours: attraction.openingHours,
            userId: attraction.userId,
            createdDate: attraction.createdDate,
            images: attraction.images || [],
          }))
          setFeaturedAttractions(processedAttractions)
        }

        // Process user stats
        if (userStatsResponse?.success && userStatsResponse.data) {
          setUserStats(userStatsResponse.data)
        } else {
          // Set default stats if no user data
          setUserStats({
            attractionsVisited: 0,
            averageRating: 0,
            totalExperiences: 0,
            travelPoints: 0,
            monthlyVisits: 0,
            monthlyExperiences: 0,
            pointsEarned: 0,
          })
        }

        // Process attraction stats for trending
        if (attractionStatsResponse?.success && attractionStatsResponse.data) {
          setAttractionStats(attractionStatsResponse.data)
          // Generate trending destinations from top attractions
          const trending = (attractionStatsResponse.data.topAttractions || []).slice(0, 4).map((attr: any, index: number) => ({
            id: attr.id,
            name: attr.name,
            location: attr.address,
            visitors: `${(Math.random() * 5 + 1).toFixed(1)}k`, // Mock visitor count for now
            trend: `+${(Math.random() * 30 + 5).toFixed(0)}%`, // Mock trend for now
            image: attr.images?.[0]?.imageUrl || "/placeholder.svg?height=80&width=80",
            category: attr.category,
          }))
          setTrendingDestinations(trending)
        }

      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // High-quality static images for the carousel (keeping static for hero section)
  const carouselImages = [
    {
      url: "https://images.unsplash.com/photo-1580877854178-95067799fb4c?q=80&w=1000&auto=format&fit=crop",
      title: "Borobudur Temple",
    },
    {
      url: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=1000&auto=format&fit=crop",
      title: "Prambanan Temple",
    },
    {
      url: "https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?q=80&w=1000&auto=format&fit=crop",
      title: "Mount Bromo",
    },
    {
      url: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?q=80&w=1000&auto=format&fit=crop",
      title: "Lake Toba",
    },
    {
      url: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=1000&auto=format&fit=crop",
      title: "Komodo National Park",
    },
    {
      url: "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=1000&auto=format&fit=crop",
      title: "Raja Ampat",
    },
  ]

  // Generate quick stats from real user data
  const quickStats = userStats ? [
    { 
      label: "Attractions Visited", 
      value: (userStats.attractionsVisited || 0).toString(), 
      change: `+${userStats.monthlyVisits || 0} this month`, 
      icon: MapPin, 
      color: "text-blue-600" 
    },
    { 
      label: "Average Rating Given", 
      value: (userStats.averageRating || 0).toFixed(1), 
      change: (userStats.averageRating || 0) >= 4 ? "★ Excellent" : (userStats.averageRating || 0) >= 3 ? "★ Good" : "★ Average", 
      icon: Star, 
      color: "text-yellow-600" 
    },
    { 
      label: "Total Experiences", 
      value: (userStats.totalExperiences || 0).toString(), 
      change: `+${userStats.monthlyExperiences || 0} this month`, 
      icon: Calendar, 
      color: "text-green-600" 
    },
    { 
      label: "Travel Points", 
      value: (userStats.travelPoints || 0).toLocaleString(), 
      change: `+${userStats.pointsEarned || 0} earned`, 
      icon: Award, 
      color: "text-purple-600" 
    },
  ] : []

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onPageChange("Search Results")
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600 dark:text-slate-400">Loading your travel dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
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

            {/* Right Content - Destination Cards */}
            <div className="relative overflow-hidden py-12 px-2">
              {/* Enhanced Dots Indicator Above Images */}
              <div className="flex justify-center space-x-3 mb-8">
                {Array.from({ length: 8 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        const slideWidth = 350
                        scrollContainerRef.current.scrollTo({ left: index * slideWidth, behavior: "smooth" })
                      }
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide ? "bg-cyan-400 scale-125" : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              {/* Cards Container with Image Fading */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-4 pt-8"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  scrollBehavior: "smooth",
                  WebkitOverflowScrolling: "touch",
                  maskImage:
                    "linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), black 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), black 100%)",
                }}
              >
                {[
                  {
                    id: 1,
                    title: "BEACH",
                    image:
                      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80",
                  },
                  {
                    id: 2,
                    title: "NATURE",
                    image:
                      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
                  },
                  {
                    id: 3,
                    title: "HOTEL",
                    image:
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
                  },
                  {
                    id: 4,
                    title: "ADVENTURE",
                    image:
                      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
                  },
                  {
                    id: 5,
                    title: "CITY",
                    image:
                      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2044&q=80",
                  },
                  {
                    id: 6,
                    title: "CULTURE",
                    image:
                      "https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
                  },
                  {
                    id: 7,
                    title: "MOUNTAIN",
                    image:
                      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
                  },
                  {
                    id: 8,
                    title: "DESERT",
                    image:
                      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
                  },
                ].map((destination) => (
                  <div
                    key={destination.id}
                    className="relative flex-shrink-0 w-72 h-96 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group border-2 border-white/20 hover:border-cyan-400/50 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 backdrop-blur-sm"
                    onClick={() => onPageChange("Search Results")}
                  >
                    {/* Background Image - Fully Visible with Maintained Border Radius */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 rounded-3xl overflow-hidden"
                      style={{ backgroundImage: `url(${destination.image})` }}
                    />

                    {/* Subtle Inner Border for Polished Look */}
                    <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>

                    {/* Title with Better Positioning */}
                    <div className="absolute bottom-8 left-8 z-10">
                      <h3 className="text-3xl font-bold text-white tracking-wide drop-shadow-2xl transition-all duration-300 group-hover:text-cyan-300 group-hover:scale-110">
                        {destination.title}
                      </h3>
                    </div>

                    {/* Subtle Dark Overlay Only on Hover for Better Text Visibility */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-3xl"></div>
                  </div>
                ))}
              </div>

              {/* Enhanced Navigation Arrows */}
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 z-30 border border-white/20 ${
                  !canScrollLeft ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 z-30 border border-white/20 ${
                  !canScrollRight ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Enhanced Dots Indicator */}
              <div className="flex justify-center space-x-3 mt-8">
                {Array.from({ length: 8 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        const slideWidth = 350
                        scrollContainerRef.current.scrollTo({ left: index * slideWidth, behavior: "smooth" })
                      }
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide ? "bg-cyan-400 scale-125" : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>
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

      {/* Rest of the dashboard content remains the same */}
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

        {/* Featured Attractions */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {featuredAttractions.length > 0 ? featuredAttractions.map((attraction) => (
              <Card
                key={attraction.id}
                className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-800 hover:scale-[1.02]"
                onClick={() => onAttractionSelect(attraction.id)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={attraction.image || "/placeholder.svg"}
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
                      <Heart className={`h-4 w-4 ${attraction.liked ? "fill-red-500 text-red-500" : ""}`} />
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

                  {/* Status Indicator */}
                  <div className="absolute bottom-3 right-3">
                    <Badge className={`${attraction.openNow ? "bg-green-500" : "bg-red-500"} text-white`}>
                      {attraction.openNow ? "Open" : "Closed"}
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
                        {attraction.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {attraction.location} • {attraction.distance}
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 line-clamp-2">
                    {attraction.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {attraction.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {attraction.tags.length === 0 && (
                      <Badge variant="outline" className="text-xs">
                        {attraction.category}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {attraction.timeToVisit}
                    </div>
                    <p className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">{attraction.price}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{attraction.reviews.toLocaleString()} reviews</span>
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
            )) : (
              // Empty state when no attractions are found
              <div className="col-span-full text-center py-12">
                <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Featured Attractions</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  We couldn't find any featured attractions at the moment.
                </p>
                <Button onClick={() => onPageChange("Search Results")}>
                  Browse All Attractions
                </Button>
              </div>
            )}
          </div>
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
              {trendingDestinations.length > 0 ? trendingDestinations.map((dest, index) => (
                <div
                  key={dest.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                  onClick={() => onAttractionSelect(dest.id)}
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
              )) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No trending destinations available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Map Preview */}
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  Explore Interactive Map
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {featuredAttractions.length} Attractions
                </Badge>
              </CardTitle>
              <CardDescription>Discover attractions and plan your route</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <InteractiveMap
                attractions={featuredAttractions.filter(attr => attr.latitude && attr.longitude).map(attr => ({
                  id: attr.id,
                  name: attr.name,
                  latitude: attr.latitude!,
                  longitude: attr.longitude!,
                  category: attr.category,
                  rating: attr.rating,
                  image: attr.image,
                  price: attr.price,
                }))}
                center={[-7.7956, 110.3695]} // Yogyakarta, Indonesia
                zoom={10}
                height="h-48 sm:h-64"
                onAttractionClick={onAttractionSelect}
              />
              
              {/* Map Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span>Featured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span>Nature</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    <span>Culture</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange("Search Results")}
                  className="hover:bg-blue-50 dark:hover:bg-slate-700"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Full Map View
                </Button>
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
