"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  MapPin,
  Star,
  Clock,
  Heart,
  Share,
  Phone,
  Globe,
  Ticket,
  Navigation,
  ArrowLeft,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  MessageCircle,
  Flag,
  Wifi,
  Car,
  Coffee,
  Shield,
  TreePine,
  Accessibility,
  Send,
  Camera,
  Smile,
} from "lucide-react"

interface AttractionDetailsProps {
  attractionId: number
  onBack: () => void
  onAttractionSelect: (attractionId: number) => void
  onBookNow?: (attractionId: number) => void
}

export default function AttractionDetails({
  attractionId,
  onBack,
  onAttractionSelect,
  onBookNow,
}: AttractionDetailsProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)

  // Review form state
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  // Mock data - in real app, this would come from database based on attractionId
  const attraction = {
    id: attractionId,
    name: "Borobudur Temple",
    category: "Historical Site",
    rating: 4.8,
    reviews: 15420,
    price: "IDR 50,000",
    priceUSD: "$3.50",
    location: "Magelang, Central Java",
    coordinates: "7.6079° S, 110.2038° E",
    description:
      "Borobudur is a 9th-century Mahayana Buddhist temple in Magelang Regency, not far from the town of Muntilan, in Central Java, Indonesia. It is the world's largest Buddhist temple and UNESCO World Heritage Site.",
    fullDescription:
      "Borobudur was built in the 9th century during the reign of the Sailendra Dynasty. The temple was built as a single large stupa and, when viewed from above, takes the form of a giant tantric Buddhist mandala, simultaneously representing the Buddhist cosmology and the nature of mind. The temple consists of nine stacked platforms, six square and three circular, topped by a central dome.",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    openingHours: "06:00 - 18:00",
    website: "borobudurpark.com",
    phone: "+62 293 788266",
    estimatedDuration: "2-3 hours",
    bestTimeToVisit: "Early morning (sunrise) or late afternoon",
    tags: ["UNESCO World Heritage", "Buddhist", "Historical", "Architecture", "Cultural"],
    amenities: [
      { icon: Wifi, name: "Free WiFi" },
      { icon: Car, name: "Parking Available" },
      { icon: Coffee, name: "Cafe & Restaurant" },
      { icon: Shield, name: "Security" },
      { icon: TreePine, name: "Garden" },
      { icon: Accessibility, name: "Wheelchair Accessible" },
    ],
    ticketTypes: [
      { name: "Regular Admission", price: "IDR 50,000", description: "Access to temple grounds" },
      { name: "Sunrise Tour", price: "IDR 450,000", description: "Early morning access with guide" },
      { name: "Combo Ticket", price: "IDR 75,000", description: "Borobudur + Prambanan temples" },
    ],
    timeSlots: ["06:00", "07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00"],
  }

  const reviews = [
    {
      id: 1,
      user: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 5,
      date: "2 days ago",
      text: "Absolutely breathtaking! The sunrise tour was worth every penny. The architecture is incredible and the views are stunning. A must-visit when in Java!",
      helpful: 24,
      photos: ["/placeholder.svg?height=100&width=100", "/placeholder.svg?height=100&width=100"],
    },
    {
      id: 2,
      user: "Michael Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 4,
      date: "1 week ago",
      text: "Amazing historical site with rich Buddhist heritage. The temple complex is massive and well-preserved. Get there early to avoid crowds!",
      helpful: 18,
      photos: [],
    },
    {
      id: 3,
      user: "Lisa Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 5,
      date: "2 weeks ago",
      text: "One of the most spiritual and peaceful places I've ever visited. The sunset views from the top are absolutely magical. Highly recommended!",
      helpful: 31,
      photos: ["/placeholder.svg?height=100&width=100"],
    },
  ]

  const relatedAttractions = [
    {
      id: 2,
      name: "Prambanan Temple",
      image: "/placeholder.svg?height=150&width=200",
      rating: 4.7,
      price: "IDR 50,000",
      distance: "15 km away",
    },
    {
      id: 3,
      name: "Taman Sari Water Castle",
      image: "/placeholder.svg?height=150&width=200",
      rating: 4.5,
      price: "IDR 15,000",
      distance: "25 km away",
    },
    {
      id: 4,
      name: "Sultan's Palace",
      image: "/placeholder.svg?height=150&width=200",
      rating: 4.4,
      price: "IDR 20,000",
      distance: "30 km away",
    },
  ]

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % attraction.images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + attraction.images.length) % attraction.images.length)
  }

  const handleReviewSubmit = async () => {
    if (reviewRating === 0 || !reviewText.trim()) return

    setIsSubmittingReview(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Reset form
    setReviewRating(0)
    setReviewText("")
    setIsSubmittingReview(false)

    // Show success message (in real app, you'd update the reviews list)
    alert("Review submitted successfully!")
  }

  const handleBookNow = () => {
    if (onBookNow) {
      onBookNow(attractionId)
    } else {
      // Fallback - show alert for now
      alert("Booking functionality will be available soon!")
    }
  }

  const renderStars = (rating: number, interactive = false, size = "h-4 w-4") => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} cursor-pointer transition-all duration-200 ${
          i < (interactive ? hoveredStar || reviewRating : rating)
            ? "text-yellow-500 fill-current"
            : "text-slate-300 dark:text-slate-600"
        } ${interactive ? "hover:scale-110" : ""}`}
        onClick={interactive ? () => setReviewRating(i + 1) : undefined}
        onMouseEnter={interactive ? () => setHoveredStar(i + 1) : undefined}
        onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Back Button */}
      <div className="sticky top-16 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b px-4 py-3">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Button>
      </div>

      {/* Hero Image Gallery */}
      <section className="relative">
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img
            src={attraction.images[selectedImageIndex] || "/placeholder.svg"}
            alt={attraction.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />

          {/* Gallery Navigation */}
          <div className="absolute inset-0 flex items-center justify-between p-4">
            <Button variant="secondary" size="sm" onClick={prevImage} className="bg-white/90 hover:bg-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={nextImage} className="bg-white/90 hover:bg-white">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Share className="h-4 w-4" />
            </Button>
            <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Photo Gallery</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {attraction.images.map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg"}
                      alt={`${attraction.name} ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setSelectedImageIndex(index)
                        setShowImageModal(false)
                      }}
                    />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-black/70 text-white">
              {selectedImageIndex + 1} / {attraction.images.length}
            </Badge>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="hidden sm:flex gap-2 p-4 bg-white dark:bg-slate-800 border-b overflow-x-auto">
          {attraction.images.map((image, index) => (
            <img
              key={index}
              src={image || "/placeholder.svg"}
              alt={`Thumbnail ${index + 1}`}
              className={`w-16 h-16 object-cover rounded-lg cursor-pointer transition-all ${
                index === selectedImageIndex ? "ring-2 ring-blue-600" : "opacity-60 hover:opacity-100"
              }`}
              onClick={() => setSelectedImageIndex(index)}
            />
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {attraction.name}
                    </h1>
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="font-medium">{attraction.rating}</span>
                        <span>({attraction.reviews} reviews)</span>
                      </div>
                      <Badge variant="secondary">{attraction.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{attraction.price}</p>
                    <p className="text-slate-500 dark:text-slate-400">{attraction.priceUSD}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 mb-6">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{attraction.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{attraction.estimatedDuration}</span>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300 mb-6">{attraction.description}</p>

                <div className="flex flex-wrap gap-2">
                  {attraction.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Details */}
            <Card className="border-0 shadow-lg">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">About This Place</h3>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{attraction.fullDescription}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Opening Hours</h4>
                        <p className="text-slate-600 dark:text-slate-400">{attraction.openingHours}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Best Time to Visit</h4>
                        <p className="text-slate-600 dark:text-slate-400">{attraction.bestTimeToVisit}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Contact</h4>
                        <div className="space-y-1 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{attraction.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{attraction.website}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Coordinates</h4>
                        <p className="text-slate-600 dark:text-slate-400">{attraction.coordinates}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="amenities" className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {attraction.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <amenity.icon className="h-5 w-5 text-blue-600" />
                        <span className="text-slate-700 dark:text-slate-300">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="location" className="p-6">
                  <div className="space-y-4">
                    <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <div className="text-center text-slate-500 dark:text-slate-400">
                        <MapPin className="h-12 w-12 mx-auto mb-2" />
                        <p>Interactive map coming soon</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Navigation className="h-4 w-4" />
                      <span>{attraction.location}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Add Review Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Share Your Experience
                </CardTitle>
                <CardDescription>Help other travelers by sharing your review and rating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                  <div className="space-y-4">
                    {/* Rating Section */}
                    <div>
                      <Label className="text-base font-medium text-slate-900 dark:text-white">
                        Rate your experience
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">{renderStars(reviewRating, true, "h-8 w-8")}</div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                          {reviewRating === 0
                            ? "Click to rate"
                            : reviewRating === 1
                              ? "Poor"
                              : reviewRating === 2
                                ? "Fair"
                                : reviewRating === 3
                                  ? "Good"
                                  : reviewRating === 4
                                    ? "Very Good"
                                    : "Excellent"}
                        </span>
                      </div>
                    </div>

                    {/* Review Text */}
                    <div>
                      <Label htmlFor="review-text" className="text-base font-medium text-slate-900 dark:text-white">
                        Write your review
                      </Label>
                      <Textarea
                        id="review-text"
                        placeholder="Share your thoughts about this attraction... What did you like most? Any tips for other visitors?"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="mt-2 min-h-[120px] resize-none"
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {reviewText.length}/500 characters
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Camera className="h-3 w-3" />
                          <span>Photos coming soon</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Shield className="h-4 w-4" />
                        <span>Your review will be public</span>
                      </div>
                      <Button
                        onClick={handleReviewSubmit}
                        disabled={reviewRating === 0 || !reviewText.trim() || isSubmittingReview}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                      >
                        {isSubmittingReview ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Post Review
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <Smile className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Be Honest</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Share your genuine experience</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <MessageCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Be Helpful</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Include useful tips for others</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <Shield className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Be Respectful</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Keep it constructive and kind</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
                <CardDescription>
                  {attraction.reviews} reviews • Average rating {attraction.rating}/5
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-slate-200 dark:border-slate-700 last:border-0 pb-6 last:pb-0"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.user} />
                        <AvatarFallback>
                          {review.user
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{review.user}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">{renderStars(review.rating)}</div>
                              <span className="text-sm text-slate-500 dark:text-slate-400">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mb-3">{review.text}</p>
                        {review.photos.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {review.photos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo || "/placeholder.svg"}
                                alt={`Review photo ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <button className="flex items-center gap-1 hover:text-blue-600">
                            <ThumbsUp className="h-4 w-4" />
                            Helpful ({review.helpful})
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-600">
                            <MessageCircle className="h-4 w-4" />
                            Reply
                          </button>
                          <button className="flex items-center gap-1 hover:text-red-600">
                            <Flag className="h-4 w-4" />
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full">
                  View All Reviews
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Booking Card */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Book Your Visit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Ticket Types */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Ticket Type
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        {attraction.ticketTypes.map((ticket, index) => (
                          <SelectItem key={index} value={ticket.name}>
                            <div className="flex flex-col">
                              <span>
                                {ticket.name} - {ticket.price}
                              </span>
                              <span className="text-xs text-slate-500">{ticket.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Select Date
                    </label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Preferred Time
                    </label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {attraction.timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Number of Visitors */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Number of Visitors
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visitors" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? "visitor" : "visitors"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Total</span>
                      <span className="text-xl font-bold">{attraction.price}</span>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={handleBookNow}
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Related Attractions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>You Might Also Like</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedAttractions.map((related) => (
                    <div
                      key={related.id}
                      className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      onClick={() => onAttractionSelect(related.id)}
                    >
                      <img
                        src={related.image || "/placeholder.svg"}
                        alt={related.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white truncate">{related.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span>{related.rating}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{related.distance}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{related.price}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
