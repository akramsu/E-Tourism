"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { touristApi, userApi } from "@/lib/api"
import {
  Brain,
  MapPin,
  Star,
  Clock,
  Heart,
  Plus,
  Trash2,
  Calendar,
  Compass,
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  ChevronRight,
  Share,
  Download,
  Settings,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface RecommendationsProps {
  onAttractionSelect: (attractionId: number) => void
}

interface ItineraryItem {
  id: string
  attractionId: number
  name: string
  image: string
  duration: string
  price: string
  category: string
  timeSlot: string
}

interface AIRecommendation {
  id: number
  name: string
  image: string
  rating: number
  category: string
  price: string
  location: string
  reason: string
  confidence: number
  timeToVisit: string
  bestTime: string
  tags: string[]
  aiInsights: string[]
}

interface TrendingAttraction {
  id: number
  name: string
  image: string
  location: string
  trendScore: number
  visitors: string
  category: string
  rating: number
  price: string
}

export default function Recommendations({ onAttractionSelect }: RecommendationsProps) {
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [trendingAttractions, setTrendingAttractions] = useState<TrendingAttraction[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [preferences, setPreferences] = useState({
    interests: ["historical", "cultural"],
    budget: [50],
    duration: [3],
    groupSize: "solo",
    travelStyle: "cultural",
  })

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([
    {
      id: "1",
      attractionId: 1,
      name: "Borobudur Temple",
      image: "/placeholder.svg?height=60&width=80",
      duration: "2-3 hours",
      price: "IDR 50,000",
      category: "Historical",
      timeSlot: "09:00 - 12:00",
    },
    {
      id: "2",
      attractionId: 2,
      name: "Prambanan Temple",
      image: "/placeholder.svg?height=60&width=80",
      duration: "2-3 hours",
      price: "IDR 50,000",
      category: "Historical",
      timeSlot: "14:00 - 17:00",
    },
  ])

  // Load data from APIs
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load user profile for personalization
        try {
          const profileResponse = await userApi.getProfile()
          if (profileResponse.success) {
            setUserProfile(profileResponse.data)
          }
        } catch (profileError) {
          console.warn("Could not load user profile:", profileError)
        }

        // Load featured attractions and convert to AI recommendations
        const attractionsResponse = await touristApi.getFeaturedAttractions(20)
        if (attractionsResponse.success && attractionsResponse.data) {
          const transformedRecommendations: AIRecommendation[] = attractionsResponse.data.map((attraction: any, index: number) => ({
            id: attraction.id,
            name: attraction.name,
            image: attraction.images?.[0]?.imageUrl || "/placeholder.svg",
            rating: attraction.rating || 0,
            category: attraction.category || "General",
            price: attraction.price ? `IDR ${attraction.price.toLocaleString()}` : "Free",
            location: attraction.address || "Unknown",
            reason: generateRecommendationReason(attraction.category, index),
            confidence: Math.floor(Math.random() * 20) + 80, // 80-100% confidence
            timeToVisit: "2-3 hours", // Default
            bestTime: getBestVisitTime(attraction.category),
            tags: attraction.tags ? attraction.tags.split(',') : [attraction.category],
            aiInsights: generateAIInsights(attraction.name, attraction.category),
          }))
          setAiRecommendations(transformedRecommendations.slice(0, 6))
        }

        // Load popular attractions for trending
        const trendingResponse = await touristApi.getAttractions({ 
          limit: 10, 
          sortBy: 'rating', 
          sortOrder: 'desc' 
        })
        if (trendingResponse.success && trendingResponse.data) {
          const transformedTrending: TrendingAttraction[] = trendingResponse.data.map((attraction: any) => ({
            id: attraction.id,
            name: attraction.name,
            image: attraction.images?.[0]?.imageUrl || "/placeholder.svg",
            location: attraction.address || "Unknown",
            trendScore: Math.floor(Math.random() * 20) + 80, // 80-100 trend score
            visitors: `${Math.floor(Math.random() * 3000 + 500)} this week`,
            category: attraction.category || "General",
            rating: attraction.rating || 0,
            price: attraction.price ? `IDR ${attraction.price.toLocaleString()}` : "Free",
          }))
          setTrendingAttractions(transformedTrending.slice(0, 4))
        }

      } catch (err) {
        console.error("Error loading recommendations:", err)
        setError("Failed to load recommendations. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [])

  // Helper functions for generating recommendation content
  const generateRecommendationReason = (category: string, index: number): string => {
    const reasons = {
      'Historical': [
        "Perfect match for your interest in historical sites and cultural heritage",
        "Rich historical significance aligns with your preferences",
        "Exceptional historical value recommended for culture enthusiasts"
      ],
      'Cultural': [
        "Living culture experience matches your interests perfectly",
        "Authentic cultural immersion based on your profile",
        "Traditional cultural site recommended by our AI"
      ],
      'Nature': [
        "Natural beauty perfectly suited to your adventure preferences",
        "Stunning landscapes match your nature-loving profile",
        "Outdoor experience recommended for nature enthusiasts"
      ],
      'default': [
        "Highly rated attraction recommended based on your interests",
        "Popular destination that matches your travel style",
        "Unique experience tailored to your preferences"
      ]
    }
    
    const categoryReasons = reasons[category as keyof typeof reasons] || reasons.default
    return categoryReasons[index % categoryReasons.length]
  }

  const getBestVisitTime = (category: string): string => {
    const timeMap = {
      'Historical': 'Early morning',
      'Cultural': 'Morning or afternoon',
      'Nature': 'Early morning or late afternoon',
      'Religious': 'Morning',
      'default': 'Anytime'
    }
    return timeMap[category as keyof typeof timeMap] || timeMap.default
  }

  const generateAIInsights = (name: string, category: string): string[] => {
    const insights = [
      `One of the most visited ${category.toLowerCase()} attractions`,
      "Perfect for photography enthusiasts",
      "Recommended by 95% of visitors",
      "Best experienced with a local guide",
      "Great for both solo and group visits"
    ]
    return insights.slice(0, 3)
  }

  const hotDeals = [
    {
      id: 9,
      name: "Temple Combo Package",
      originalPrice: "IDR 100,000",
      discountPrice: "IDR 75,000",
      discount: "25%",
      validUntil: "Dec 31, 2024",
      description: "Multiple temple visits with special pricing",
      image: "/placeholder.svg?height=80&width=120",
    },
    {
      id: 10,
      name: "Cultural Heritage Tour",
      originalPrice: "IDR 200,000",
      discountPrice: "IDR 150,000",
      discount: "25%",
      validUntil: "Jan 15, 2025",
      description: "Full day guided cultural experience",
      image: "/placeholder.svg?height=80&width=120",
    },
  ]

  const interests = [
    { id: "historical", name: "Historical Sites", icon: "🏛️" },
    { id: "cultural", name: "Cultural Sites", icon: "🎭" },
    { id: "nature", name: "Nature & Parks", icon: "🌿" },
    { id: "adventure", name: "Adventure", icon: "⛰️" },
    { id: "religious", name: "Religious Sites", icon: "🕌" },
    { id: "food", name: "Food & Dining", icon: "🍜" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "entertainment", name: "Entertainment", icon: "🎪" },
  ]

  const handleInterestToggle = (interestId: string) => {
    setPreferences((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((id) => id !== interestId)
        : [...prev.interests, interestId],
    }))
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(itinerary)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setItinerary(items)
  }

  const addToItinerary = (attraction: any) => {
    const newItem: ItineraryItem = {
      id: Date.now().toString(),
      attractionId: attraction.id,
      name: attraction.name,
      image: attraction.image,
      duration: attraction.timeToVisit,
      price: attraction.price,
      category: attraction.category,
      timeSlot: "TBD",
    }
    setItinerary((prev) => [...prev, newItem])
  }

  const removeFromItinerary = (itemId: string) => {
    setItinerary((prev) => prev.filter((item) => item.id !== itemId))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Personalized Recommendations
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover attractions tailored to your preferences and create your perfect itinerary
          </p>
        </div>

        <Tabs defaultValue="recommendations" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-lg">
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>My Itinerary</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-8">
            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Generating Your Personalized Recommendations
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Our AI is analyzing your preferences to find the perfect attractions...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Unable to Load Recommendations
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {/* Content - only show when not loading and no error */}
            {!loading && !error && (
              <>
                {/* AI Recommendations */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI-Powered Recommendations
                </CardTitle>
                <CardDescription>Personalized suggestions based on your preferences and travel history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-800"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      AI Powered
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Personalized
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiRecommendations.map((attraction) => (
                    <Card
                      key={attraction.id}
                      className="group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:scale-[1.02]"
                      onClick={() => onAttractionSelect(attraction.id)}
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={attraction.image || "/placeholder.svg"}
                          alt={attraction.name}
                          className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Handle like
                            }}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              addToItinerary(attraction)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="bg-white/90 text-slate-900">
                            {attraction.category}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
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
                          {attraction.location}
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg mb-3">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-medium text-purple-600 dark:text-purple-400">AI Insight:</span>{" "}
                            {attraction.reason}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-1 bg-purple-600" style={{ width: `${attraction.confidence}%` }}></div>
                            </div>
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                              {attraction.confidence}% match
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {attraction.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            {attraction.timeToVisit}
                          </div>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">{attraction.price}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Now */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Trending Now
                </CardTitle>
                <CardDescription>Popular destinations this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingAttractions.map((attraction) => (
                    <Card
                      key={attraction.id}
                      className="group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:scale-[1.02]"
                      onClick={() => onAttractionSelect(attraction.id)}
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={attraction.image || "/placeholder.svg"}
                          alt={attraction.name}
                          className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Handle like
                            }}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">
                          {attraction.name}
                        </h3>
                        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {attraction.location}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{attraction.category}</Badge>
                          <p className="font-bold text-slate-900 dark:text-white">{attraction.price}</p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{attraction.visitors}</span>
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>{attraction.trendScore}% trend score</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hot Deals */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Hot Deals
                </CardTitle>
                <CardDescription>Limited time offers and discounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {hotDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      className="group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:scale-[1.01]"
                      onClick={() => onAttractionSelect(deal.id)}
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative sm:w-1/3">
                          <img
                            src={deal.image || "/placeholder.svg"}
                            alt={deal.name}
                            className="w-full h-32 sm:h-full object-cover"
                          />
                          <Badge className="absolute top-3 left-3 bg-red-600 text-white border-0">
                            {deal.discount} OFF
                          </Badge>
                        </div>
                        <div className="p-4 sm:w-2/3">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">
                            {deal.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{deal.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm line-through text-slate-500">{deal.originalPrice}</span>
                            <span className="font-bold text-red-600">{deal.discountPrice}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Valid until {deal.validUntil}
                            </span>
                            <Button size="sm">Book Now</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          {/* Itinerary Builder Tab */}
          <TabsContent value="itinerary" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Itinerary Builder */}
              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    My Itinerary
                  </CardTitle>
                  <CardDescription>Drag and drop to reorder your itinerary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800"
                        >
                          Day 1
                        </Badge>
                        <Input
                          type="date"
                          className="w-40 text-sm"
                          defaultValue={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>

                    {itinerary.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        <Calendar className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                          Your itinerary is empty
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          Add attractions from recommendations to build your perfect day
                        </p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Attractions
                        </Button>
                      </div>
                    ) : (
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="itinerary">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                              {itinerary.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-medium">
                                        {index + 1}
                                      </div>
                                      <img
                                        src={item.image || "/placeholder.svg"}
                                        alt={item.name}
                                        className="w-12 h-12 object-cover rounded-md"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-900 dark:text-white truncate">
                                          {item.name}
                                        </h4>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                          <span>{item.duration}</span>
                                          <span>{item.price}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {item.category}
                                          </Badge>
                                        </div>
                                      </div>
                                      <Select defaultValue={item.timeSlot}>
                                        <SelectTrigger className="w-32 text-xs">
                                          <SelectValue placeholder="Time slot" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="09:00 - 12:00">09:00 - 12:00</SelectItem>
                                          <SelectItem value="12:00 - 14:00">12:00 - 14:00</SelectItem>
                                          <SelectItem value="14:00 - 17:00">14:00 - 17:00</SelectItem>
                                          <SelectItem value="17:00 - 19:00">17:00 - 19:00</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFromItinerary(item.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}

                    {itinerary.length > 0 && (
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              Total Duration: {itinerary.length > 0 ? "5-6 hours" : "0 hours"}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Estimated Cost: {itinerary.length > 0 ? "IDR 100,000" : "IDR 0"}
                            </p>
                          </div>
                          <Button>
                            <Calendar className="h-4 w-4 mr-2" />
                            Save Itinerary
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Itinerary Tips */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Smart Tips
                  </CardTitle>
                  <CardDescription>AI-powered suggestions for your itinerary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {itinerary.length > 0 ? (
                    <>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2">
                          Optimization Suggestions
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span>Visit Borobudur Temple early morning for the best experience and fewer crowds</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span>Consider adding lunch at Plataran Borobudur between temple visits</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span>Purchase the combo ticket for both temples to save 25%</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Weather Forecast</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                          Sunny with occasional clouds, 28°C
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Recommendation: Bring sunscreen and a hat for temple visits
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Transportation Options</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700 dark:text-slate-300">Private Driver</span>
                            <span className="font-medium text-slate-900 dark:text-white">IDR 500,000/day</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700 dark:text-slate-300">Shared Tour</span>
                            <span className="font-medium text-slate-900 dark:text-white">IDR 250,000/person</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700 dark:text-slate-300">Public Transport</span>
                            <span className="font-medium text-slate-900 dark:text-white">IDR 50,000</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Compass className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        Add attractions to your itinerary
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Smart tips will appear once you start building your itinerary
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-900 dark:text-white" />
                  Travel Preferences
                </CardTitle>
                <CardDescription>Customize your preferences to get better recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Interests */}
                <div className="space-y-3">
                  <Label className="text-base">Interests</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {interests.map((interest) => (
                      <div
                        key={interest.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          preferences.interests.includes(interest.id)
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                        onClick={() => handleInterestToggle(interest.id)}
                      >
                        <div className="text-xl">{interest.icon}</div>
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              preferences.interests.includes(interest.id)
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {interest.name}
                          </p>
                        </div>
                        <Checkbox
                          checked={preferences.interests.includes(interest.id)}
                          onCheckedChange={() => handleInterestToggle(interest.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Range */}
                <div className="space-y-3">
                  <Label className="text-base">Budget Range (per day)</Label>
                  <div className="px-2">
                    <Slider
                      value={preferences.budget}
                      onValueChange={(value) => setPreferences({ ...preferences, budget: value })}
                      max={100}
                      step={5}
                    />
                    <div className="flex justify-between mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span>Budget: IDR {preferences.budget[0] * 10000}</span>
                      <span>Luxury: IDR 1,000,000+</span>
                    </div>
                  </div>
                </div>

                {/* Trip Duration */}
                <div className="space-y-3">
                  <Label className="text-base">Trip Duration (days)</Label>
                  <div className="px-2">
                    <Slider
                      value={preferences.duration}
                      onValueChange={(value) => setPreferences({ ...preferences, duration: value })}
                      max={14}
                      step={1}
                    />
                    <div className="flex justify-between mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span>
                        {preferences.duration[0]} {preferences.duration[0] === 1 ? "day" : "days"}
                      </span>
                      <span>14+ days</span>
                    </div>
                  </div>
                </div>

                {/* Group Size */}
                <div className="space-y-3">
                  <Label className="text-base">Group Size</Label>
                  <Select
                    value={preferences.groupSize}
                    onValueChange={(value) => setPreferences({ ...preferences, groupSize: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo Traveler</SelectItem>
                      <SelectItem value="couple">Couple</SelectItem>
                      <SelectItem value="family">Family with Kids</SelectItem>
                      <SelectItem value="friends">Group of Friends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Travel Style */}
                <div className="space-y-3">
                  <Label className="text-base">Travel Style</Label>
                  <Select
                    value={preferences.travelStyle}
                    onValueChange={(value) => setPreferences({ ...preferences, travelStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select travel style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relaxed">Relaxed & Easy</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="active">Active & Adventurous</SelectItem>
                      <SelectItem value="cultural">Cultural & Historical</SelectItem>
                      <SelectItem value="luxury">Luxury & Comfort</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Recommendations
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
