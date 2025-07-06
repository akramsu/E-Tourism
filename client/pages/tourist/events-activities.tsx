"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  // Mock events data based on database schema
  const events: Event[] = [
    {
      id: "1",
      title: "Yogyakarta Arts Festival 2024",
      category: "Arts & Culture",
      date: "2024-12-20",
      time: "19:00",
      location: "Yogyakarta",
      venue: "Taman Budaya Yogyakarta",
      price: "IDR 150,000",
      priceValue: 150000,
      image: "/placeholder.svg?height=300&width=400",
      description:
        "Annual arts festival featuring traditional and contemporary performances from local and international artists",
      organizer: "Yogyakarta Cultural Department",
      capacity: 2000,
      attendees: 1650,
      rating: 4.8,
      reviews: 324,
      tags: ["Traditional", "Contemporary", "Performance", "Cultural"],
      featured: true,
      liked: false,
      latitude: -7.7956,
      longitude: 110.3695,
      duration: "3 hours",
      ageRestriction: "All ages",
      ticketsAvailable: true,
    },
    {
      id: "2",
      title: "Borobudur Sunrise Concert",
      category: "Music",
      date: "2024-12-25",
      time: "05:30",
      location: "Magelang",
      venue: "Borobudur Temple Complex",
      price: "IDR 500,000",
      priceValue: 500000,
      image: "/placeholder.svg?height=300&width=400",
      description: "Exclusive sunrise concert at the iconic Borobudur Temple with world-class musicians",
      organizer: "Borobudur Heritage Foundation",
      capacity: 500,
      attendees: 480,
      rating: 4.9,
      reviews: 156,
      tags: ["Sunrise", "Classical", "Heritage", "Exclusive"],
      featured: true,
      liked: true,
      latitude: -7.6079,
      longitude: 110.2038,
      duration: "2 hours",
      ageRestriction: "All ages",
      ticketsAvailable: true,
    },
    {
      id: "3",
      title: "Malioboro Food Festival",
      category: "Food & Drink",
      date: "2024-12-22",
      time: "17:00",
      location: "Yogyakarta",
      venue: "Malioboro Street",
      price: "Free",
      priceValue: 0,
      image: "/placeholder.svg?height=300&width=400",
      description: "Street food festival showcasing the best of Yogyakarta's culinary heritage",
      organizer: "Yogyakarta Tourism Board",
      capacity: 5000,
      attendees: 3200,
      rating: 4.6,
      reviews: 892,
      tags: ["Street Food", "Local Cuisine", "Cultural", "Family Friendly"],
      featured: false,
      liked: false,
      latitude: -7.7956,
      longitude: 110.3695,
      duration: "5 hours",
      ageRestriction: "All ages",
      ticketsAvailable: true,
    },
    {
      id: "4",
      title: "Traditional Batik Workshop",
      category: "Workshop",
      date: "2024-12-21",
      time: "09:00",
      location: "Yogyakarta",
      venue: "Batik Museum",
      price: "IDR 200,000",
      priceValue: 200000,
      image: "/placeholder.svg?height=300&width=400",
      description: "Learn the ancient art of batik making from master craftsmen",
      organizer: "Batik Heritage Center",
      capacity: 30,
      attendees: 25,
      rating: 4.7,
      reviews: 89,
      tags: ["Traditional", "Hands-on", "Cultural", "Educational"],
      featured: false,
      liked: true,
      latitude: -7.8014,
      longitude: 110.3644,
      duration: "4 hours",
      ageRestriction: "12+",
      ticketsAvailable: true,
    },
    {
      id: "5",
      title: "Mount Merapi Photography Tour",
      category: "Adventure",
      date: "2024-12-23",
      time: "04:00",
      location: "Sleman",
      venue: "Mount Merapi National Park",
      price: "IDR 350,000",
      priceValue: 350000,
      image: "/placeholder.svg?height=300&width=400",
      description: "Guided photography tour to capture the stunning sunrise views from Mount Merapi",
      organizer: "Merapi Adventure Tours",
      capacity: 15,
      attendees: 12,
      rating: 4.8,
      reviews: 67,
      tags: ["Photography", "Sunrise", "Adventure", "Nature"],
      featured: true,
      liked: false,
      latitude: -7.5407,
      longitude: 110.4461,
      duration: "6 hours",
      ageRestriction: "16+",
      ticketsAvailable: true,
    },
    {
      id: "6",
      title: "Gamelan Music Performance",
      category: "Music",
      date: "2024-12-24",
      time: "20:00",
      location: "Yogyakarta",
      venue: "Sultan's Palace",
      price: "IDR 100,000",
      priceValue: 100000,
      image: "/placeholder.svg?height=300&width=400",
      description: "Traditional Javanese gamelan performance in the historic Sultan's Palace",
      organizer: "Kraton Yogyakarta",
      capacity: 200,
      attendees: 180,
      rating: 4.9,
      reviews: 145,
      tags: ["Traditional", "Gamelan", "Royal", "Cultural"],
      featured: false,
      liked: false,
      latitude: -7.8053,
      longitude: 110.3642,
      duration: "2 hours",
      ageRestriction: "All ages",
      ticketsAvailable: true,
    },
  ]

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

  const featuredEvents = events.filter((event) => event.featured)
  const upcomingEvents = events.slice(0, 4)

  const EventCard = ({ event, size = "default" }: { event: Event; size?: "default" | "large" | "small" }) => (
    <Card
      className={`group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:scale-[1.02] ${
        size === "large" ? "col-span-2" : size === "small" ? "h-fit" : ""
      }`}
      onClick={() => onEventSelect(event.id)}
    >
      <div className={`relative overflow-hidden ${size === "large" ? "h-64" : size === "small" ? "h-32" : "h-48"}`}>
        <img
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {event.featured && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <Award className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm">
            <Heart className={`h-4 w-4 ${event.liked ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm">
            <Share className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <Badge variant="secondary" className="bg-white/90 text-slate-900 backdrop-blur-sm mb-2">
            {event.category}
          </Badge>
          {size !== "small" && <h3 className="font-bold text-white text-lg leading-tight">{event.title}</h3>}
        </div>
      </div>

      <CardContent className={`p-4 ${size === "small" ? "p-3" : ""}`}>
        {size === "small" && (
          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-2">{event.title}</h3>
        )}

        <div className="space-y-2 mb-3">
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {new Date(event.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            <Clock className="h-4 w-4 ml-4 mr-1" />
            {event.time}
          </div>
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            {event.venue}
          </div>
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
            <Users className="h-4 w-4 mr-2" />
            {event.attendees}/{event.capacity} attending
          </div>
        </div>

        {size !== "small" && (
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 line-clamp-2">{event.description}</p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {event.tags.slice(0, size === "small" ? 2 : 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{event.rating}</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">({event.reviews})</span>
          </div>
          <p className="font-bold text-lg text-slate-900 dark:text-white">{event.price}</p>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={(e) => {
              e.stopPropagation()
              onEventSelect(event.id)
            }}
          >
            <Ticket className="h-4 w-4 mr-2" />
            {event.ticketsAvailable ? "Book Now" : "Sold Out"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onEventSelect(event.id)
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const CalendarView = () => {
    const eventsForSelectedDate = events.filter(
      (event) => selectedDate && new Date(event.date).toDateString() === selectedDate.toDateString(),
    )

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Event Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasEvent: events.map((event) => new Date(event.date)),
              }}
              modifiersStyles={{
                hasEvent: { backgroundColor: "rgb(59 130 246)", color: "white", borderRadius: "50%" },
              }}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Events on {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {eventsForSelectedDate.length > 0 ? (
            <div className="space-y-4">
              {eventsForSelectedDate.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              <CalendarIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No events on this date</h3>
              <p className="text-slate-600 dark:text-slate-400">Select another date to see available events</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Events & Activities</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover amazing events, workshops, and activities happening around you
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search events and activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
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

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "list" | "featured")}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="featured" className="gap-2">
              <Zap className="h-4 w-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              All Events
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          {/* Featured Events */}
          <TabsContent value="featured" className="space-y-8">
            {/* Hero Featured Event */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Featured This Week</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <EventCard event={featuredEvents[0]} size="large" />
                <div className="space-y-4">
                  {featuredEvents.slice(1, 3).map((event) => (
                    <EventCard key={event.id} event={event} size="small" />
                  ))}
                </div>
              </div>
            </section>

            {/* Trending Events */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  Trending Events
                </h2>
                <Button variant="outline" onClick={() => setViewMode("list")}>
                  View All Events
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>

            {/* Categories */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Browse by Category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.slice(1).map((category) => (
                  <Card
                    key={category.id}
                    className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:scale-105"
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setViewMode("list")
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{category.name}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          {/* All Events List */}
          <TabsContent value="list">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No events found</h3>
                <p className="text-slate-600 dark:text-slate-400">Try adjusting your search or category filter</p>
              </div>
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
