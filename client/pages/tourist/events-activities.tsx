"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { touristApi } from "@/lib/api"
import {
  CalendarIcon,
  MapPin,
  Clock,
  Users,
  Star,
  Heart,
  Share,
  Search,
  Ticket,
  Music,
  Utensils,
  TreePine,
  Palette,
  Gamepad2,
  Zap,
  Award,
  TrendingUp,
  Eye,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react"

interface EventsActivitiesProps {
  onEventSelect: (eventId: string) => void
}

interface Event {
  id: string
  title: string
  category: string
  date: string
  time: string
  location: string
  venue: string
  price: string
  priceValue: number
  image: string
  description: string
  organizer: string
  capacity: number
  attendees: number
  rating: number
  reviews: number
  tags: string[]
  featured: boolean
  liked: boolean
  latitude: number
  longitude: number
  duration: string
  ageRestriction: string
  ticketsAvailable: boolean
}

export default function EventsActivities({ onEventSelect }: EventsActivitiesProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "featured">("featured")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [events, setEvents] = useState<Event[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])

  // Load events data from attractions (since events are attraction-based activities)
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get attractions and convert them to events/activities
        const attractionsResponse = await touristApi.getFeaturedAttractions(20)
        
        if (attractionsResponse.success && attractionsResponse.data) {
          const transformedEvents: Event[] = attractionsResponse.data.map((attraction: any, index: number) => {
            const categories = ["Arts & Culture", "Music", "Food & Drink", "Nature", "Sports", "Educational"]
            const randomCategory = categories[index % categories.length]
            
            // Generate random future dates for events
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1)
            
            return {
              id: attraction.id.toString(),
              title: generateEventTitle(attraction.name, randomCategory),
              category: randomCategory,
              date: futureDate.toISOString().split('T')[0],
              time: generateRandomTime(),
              location: attraction.address || "Location TBD",
              venue: attraction.name,
              price: attraction.price ? `IDR ${attraction.price.toLocaleString()}` : "Free",
              priceValue: attraction.price || 0,
              image: attraction.images?.[0]?.imageUrl || "/placeholder.svg",
              description: generateEventDescription(attraction.name, attraction.description, randomCategory),
              organizer: "Tourism Authority",
              capacity: Math.floor(Math.random() * 2000) + 500,
              attendees: Math.floor(Math.random() * 1500) + 100,
              rating: attraction.rating || Math.random() * 2 + 3,
              reviews: Math.floor(Math.random() * 500) + 50,
              tags: [randomCategory, "Featured", "Popular"],
              featured: index < 6, // First 6 are featured
              liked: Math.random() > 0.7,
              latitude: attraction.latitude || 0,
              longitude: attraction.longitude || 0,
              duration: generateDuration(randomCategory),
              ageRestriction: "All ages",
              ticketsAvailable: true,
            }
          })
          
          setEvents(transformedEvents)
          setFeaturedEvents(transformedEvents.filter(event => event.featured))
        }
        
      } catch (err) {
        console.error("Error loading events:", err)
        setError("Failed to load events and activities. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  // Helper functions for generating event content
  const generateEventTitle = (attractionName: string, category: string): string => {
    const titleTemplates = {
      "Arts & Culture": [`${attractionName} Cultural Festival`, `Art Exhibition at ${attractionName}`, `Cultural Heritage Tour`],
      "Music": [`Concert at ${attractionName}`, `Traditional Music Festival`, `Sunrise Concert`],
      "Food & Drink": [`Food Festival`, `Culinary Tour`, `Local Taste Experience`],
      "Nature": [`Nature Walk`, `Eco Adventure`, `Wildlife Experience`],
      "Sports": [`Adventure Challenge`, `Outdoor Sports Event`, `Hiking Experience`],
      "Educational": [`Historical Tour`, `Learning Workshop`, `Heritage Talk`]
    }
    
    const templates = titleTemplates[category as keyof typeof titleTemplates] || [`Event at ${attractionName}`]
    return templates[Math.floor(Math.random() * templates.length)]
  }

  const generateRandomTime = (): string => {
    const hours = ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "19:00"]
    return hours[Math.floor(Math.random() * hours.length)]
  }

  const generateEventDescription = (name: string, description: string, category: string): string => {
    const descriptions = {
      "Arts & Culture": `Experience the rich cultural heritage through this special ${category.toLowerCase()} event at ${name}. ${description}`,
      "Music": `Join us for an unforgettable musical experience featuring local and international artists at ${name}.`,
      "Food & Drink": `Discover the authentic flavors and culinary traditions of the region in this special food event.`,
      "Nature": `Connect with nature and explore the beautiful landscapes in this outdoor adventure experience.`,
      "Sports": `Challenge yourself with exciting outdoor activities and sports in this adventure-packed event.`,
      "Educational": `Learn about the history and culture through guided tours and interactive workshops.`
    }
    
    return descriptions[category as keyof typeof descriptions] || description || `Special event at ${name}`
  }

  const generateDuration = (category: string): string => {
    const durations = {
      "Arts & Culture": "3 hours",
      "Music": "2 hours", 
      "Food & Drink": "4 hours",
      "Nature": "5 hours",
      "Sports": "6 hours",
      "Educational": "2 hours"
    }
    
    return durations[category as keyof typeof durations] || "3 hours"
  }

  const categories = [
    { id: "all", name: "All Events", icon: CalendarIcon },
    { id: "Arts & Culture", name: "Arts & Culture", icon: Palette },
    { id: "Music", name: "Music", icon: Music },
    { id: "Food & Drink", name: "Food & Drink", icon: Utensils },
    { id: "Workshop", name: "Workshops", icon: Users },
    { id: "Adventure", name: "Adventure", icon: TreePine },
    { id: "Sports", name: "Sports", icon: Gamepad2 },
  ]

  const filteredEvents = events.filter((event) => {
    if (selectedCategory !== "all" && event.category !== selectedCategory) return false
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Events & Activities
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover exciting events, workshops, and activities happening around you
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Loading Events and Activities
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Finding the best events for you...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Unable to Load Events
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
            {/* Search and Filters */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    <category.icon className="h-4 w-4" />
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-lg">
                <TabsTrigger value="featured" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Featured</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>All Events</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Calendar</span>
                </TabsTrigger>
              </TabsList>

              {/* Featured Events */}
              <TabsContent value="featured" className="space-y-8">
                {featuredEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredEvents.map((event) => (
                      <Card
                        key={event.id}
                        className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                        onClick={() => onEventSelect(event.id)}
                      >
                        <div className="relative h-48">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                              <Share className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="absolute bottom-4 left-4">
                            <Badge className="bg-blue-600 text-white">
                              {event.category}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{event.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{event.rating.toFixed(1)}</span>
                              <span className="text-sm text-slate-500">({event.reviews})</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900 dark:text-white">{event.price}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Featured Events</h3>
                    <p className="text-slate-600 dark:text-slate-400">Check back later for featured events and activities.</p>
                  </div>
                )}
              </TabsContent>

              {/* All Events List */}
              <TabsContent value="list" className="space-y-6">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => onEventSelect(event.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                                  {event.title}
                                </h3>
                                <Badge variant="secondary">{event.category}</Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900 dark:text-white">{event.price}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span className="text-sm">{event.rating.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">
                              {event.description}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{event.venue}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{event.attendees}/{event.capacity}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Events Found</h3>
                    <p className="text-slate-600 dark:text-slate-400">Try adjusting your search or category filters.</p>
                  </div>
                )}
              </TabsContent>

              {/* Calendar View */}
              <TabsContent value="calendar" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1 border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Select Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                      />
                    </CardContent>
                  </Card>
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Events on {selectedDate?.toLocaleDateString() || "Selected Date"}
                    </h3>
                    {upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event) => (
                        <Card
                          key={event.id}
                          className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={() => onEventSelect(event.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="bg-blue-600 text-white rounded-lg p-2 min-w-[60px]">
                                  <div className="text-xs">
                                    {new Date(event.date).toLocaleDateString('en', { month: 'short' })}
                                  </div>
                                  <div className="text-lg font-bold">
                                    {new Date(event.date).getDate()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-white">{event.title}</h4>
                                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span>{event.time} • {event.duration}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>{event.venue}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">{event.category}</Badge>
                                <p className="text-sm font-medium mt-1">{event.price}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 dark:text-slate-400">No events on this date</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
