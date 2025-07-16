"use client"

import { useState, useEffect } from "react"
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
  Loader2,
  AlertCircle,
} from "lucide-react"
import { touristApi } from "@/lib/api"
import { format } from "date-fns"

interface AttractionDetailsProps {
  attractionId: number
  onBack: () => void
  onAttractionSelect: (attractionId: number) => void
  onBookNow?: (attractionId: number) => void
}

interface Attraction {
  id: number
  name: string
  category: string
  rating: number
  reviews: number
  price: number
  priceFormatted: string
  location: string
  address: string
  coordinates?: string
  description: string
  fullDescription?: string
  images: { id: number; imageUrl: string }[]
  openingHours?: string
  website?: string
  phone?: string
  estimatedDuration: string
  bestTimeToVisit: string
  tags: string[]
  amenities: { icon: any; name: string }[]
  ticketTypes: { name: string; price: string; description: string }[]
  timeSlots: string[]
  latitude?: number
  longitude?: number
  userId: number
  createdDate: string
}

interface Review {
  id: number
  user: string
  avatar: string
  rating: number
  date: string
  text: string
  helpful: number
  photos: string[]
  visitDate: string
  duration?: number
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

  // Data loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attraction, setAttraction] = useState<Attraction | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [relatedAttractions, setRelatedAttractions] = useState<any[]>([])

  // Load attraction data
  useEffect(() => {
    const loadAttractionData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load attraction details
        const attractionResponse = await touristApi.getAttraction(attractionId)
        
        if (attractionResponse.success && attractionResponse.data) {
          const attractionData = attractionResponse.data
          
          // Process attraction data
          const processedAttraction: Attraction = {
            id: attractionData.id,
            name: attractionData.name,
            category: attractionData.category,
            rating: attractionData.rating || 0,
            reviews: attractionData._count?.visits || 0,
            price: attractionData.price || 0,
            priceFormatted: attractionData.price 
              ? `IDR ${attractionData.price.toLocaleString()}` 
              : "Free",
            location: attractionData.address,
            address: attractionData.address,
            coordinates: attractionData.latitude && attractionData.longitude 
              ? `${attractionData.latitude}° S, ${attractionData.longitude}° E`
              : undefined,
            description: attractionData.description || "",
            fullDescription: attractionData.description || "",
            images: attractionData.images || [],
            openingHours: attractionData.openingHours || "Please contact for hours",
            website: undefined, // Not in current schema
            phone: undefined, // Not in current schema
            estimatedDuration: "2-3 hours", // Default estimate
            bestTimeToVisit: "Morning or late afternoon",
            tags: [attractionData.category], // Use category as tag
            amenities: [
              { icon: Wifi, name: "Free WiFi" },
              { icon: Car, name: "Parking Available" },
              { icon: Coffee, name: "Cafe & Restaurant" },
              { icon: Shield, name: "Security" },
              { icon: TreePine, name: "Garden" },
              { icon: Accessibility, name: "Wheelchair Accessible" },
            ], // Default amenities
            ticketTypes: [
              { 
                name: "Regular Admission", 
                price: attractionData.price 
                  ? `IDR ${attractionData.price.toLocaleString()}` 
                  : "Free", 
                description: "Standard access to attraction" 
              }
            ],
            timeSlots: ["06:00", "07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00"],
            latitude: attractionData.latitude,
            longitude: attractionData.longitude,
            userId: attractionData.userId,
            createdDate: attractionData.createdDate,
          }

          setAttraction(processedAttraction)

          // Process reviews from visits
          if (attractionData.visits) {
            const processedReviews = attractionData.visits
              .filter((visit: any) => visit.visitorFeedback && visit.rating)
              .map((visit: any) => ({
                id: visit.id,
                user: visit.visitor?.username || "Anonymous User",
                avatar: visit.visitor?.profilePicture || "/placeholder.svg?height=40&width=40",
                rating: visit.rating,
                date: format(new Date(visit.visitDate), "MMM dd, yyyy"),
                text: visit.visitorFeedback,
                helpful: Math.floor(Math.random() * 50), // Mock helpful count
                photos: [], // Photos not implemented yet
                visitDate: visit.visitDate,
                duration: visit.duration,
              }))
            setReviews(processedReviews)
          }

          // Load related attractions (same category)
          try {
            const relatedResponse = await touristApi.getAttractions({
              category: attractionData?.category,
              limit: 3,
            })
            
            if (relatedResponse.success && relatedResponse.data) {
              const related = relatedResponse.data
                .filter((attr: any) => attr.id !== attractionId)
                .slice(0, 3)
                .map((attr: any) => ({
                  id: attr.id,
                  name: attr.name,
                  image: attr.images?.[0]?.imageUrl || "/placeholder.svg?height=150&width=200",
                  rating: attr.rating || 0,
                  price: attr.price ? `IDR ${attr.price.toLocaleString()}` : "Free",
                  distance: "Distance calculation needed", // Would need geolocation
                  category: attr.category
                }))
              setRelatedAttractions(related)
            }
          } catch (relatedError) {
            console.warn("Could not load related attractions:", relatedError)
          }
        } else {
          throw new Error("Failed to load attraction details")
        }

      } catch (err) {
        console.error("Error loading attraction data:", err)
        setError("Failed to load attraction details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (attractionId) {
      loadAttractionData()
    }
  }, [attractionId])

  // Handle image navigation
  const nextImage = () => {
    if (attraction?.images.length) {
      setSelectedImageIndex((prev) => (prev + 1) % attraction.images.length)
    }
  }

  const prevImage = () => {
    if (attraction?.images.length) {
      setSelectedImageIndex((prev) => (prev - 1 + attraction.images.length) % attraction.images.length)
    }
  }

  const handleReviewSubmit = async () => {
    if (reviewRating === 0 || !reviewText.trim() || !attraction) return

    setIsSubmittingReview(true)
    try {
      // Submit the review via API
      await touristApi.submitReview({
        attractionId: attraction.id,
        rating: reviewRating,
        visitorFeedback: reviewText,
        visitDate: selectedDate ? (typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        duration: 120, // Default 2 hours
        amount: attraction.price || 0
      })

      // Add new review to the list optimistically
      const newReview: Review = {
        id: Date.now(),
        user: "You",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: reviewRating,
        date: "Just now",
        text: reviewText,
        helpful: 0,
        photos: [],
        visitDate: selectedDate?.toISOString() || new Date().toISOString(),
      }
      setReviews(prev => [newReview, ...prev])

      // Reset form
      setReviewRating(0)
      setReviewText("")
      alert("Review submitted successfully!")

    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review. Please try again.")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleBookNow = () => {
    if (onBookNow && attraction) {
      onBookNow(attraction.id)
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600 dark:text-slate-400">Loading attraction details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !attraction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {error ? "Error Loading Attraction" : "Attraction Not Found"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {error || "The attraction you're looking for could not be found."}
          </p>
          <div className="space-x-3">
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
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
            src={
              attraction.images.length > 0 
                ? attraction.images[selectedImageIndex]?.imageUrl || "/placeholder.svg"
                : "/placeholder.svg?height=400&width=600"
            }
            alt={attraction.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />

          {/* Gallery Navigation - only show if multiple images */}
          {attraction.images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button variant="secondary" size="sm" onClick={prevImage} className="bg-white/90 hover:bg-white">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={nextImage} className="bg-white/90 hover:bg-white">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Share className="h-4 w-4" />
            </Button>
            {attraction.images.length > 0 && (
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
                        key={image.id}
                        src={image.imageUrl || "/placeholder.svg"}
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
            )}
          </div>

          {/* Image Counter - only show if multiple images */}
          {attraction.images.length > 1 && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-black/70 text-white">
                {selectedImageIndex + 1} / {attraction.images.length}
              </Badge>
            </div>
          )}
        </div>

        {/* Thumbnail Strip - only show if multiple images */}
        {attraction.images.length > 1 && (
          <div className="hidden sm:flex gap-2 p-4 bg-white dark:bg-slate-800 border-b overflow-x-auto">
            {attraction.images.map((image, index) => (
              <img
                key={image.id}
                src={image.imageUrl || "/placeholder.svg"}
                alt={`Thumbnail ${index + 1}`}
                className={`w-16 h-16 object-cover rounded-lg cursor-pointer transition-all ${
                  index === selectedImageIndex ? "ring-2 ring-blue-600" : "opacity-60 hover:opacity-100"
                }`}
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        )}
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
                        <span className="font-medium">{attraction.rating.toFixed(1)}</span>
                        <span>({attraction.reviews} reviews)</span>
                      </div>
                      <Badge variant="secondary">{attraction.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{attraction.priceFormatted}</p>
                    {attraction.price > 0 && (
                      <p className="text-slate-500 dark:text-slate-400">
                        ~${(attraction.price / 15000).toFixed(2)} USD
                      </p>
                    )}
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
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {attraction.fullDescription || attraction.description}
                      </p>
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
                      {(attraction.phone || attraction.website) && (
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Contact</h4>
                          <div className="space-y-1 text-slate-600 dark:text-slate-400">
                            {attraction.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{attraction.phone}</span>
                              </div>
                            )}
                            {attraction.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <span>{attraction.website}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {attraction.coordinates && (
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Coordinates</h4>
                          <p className="text-slate-600 dark:text-slate-400">{attraction.coordinates}</p>
                        </div>
                      )}
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
                        {attraction.coordinates && (
                          <p className="text-sm mt-2">{attraction.coordinates}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Navigation className="h-4 w-4" />
                      <span>{attraction.address}</span>
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
                  {attraction.reviews} reviews • Average rating {attraction.rating.toFixed(1)}/5
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.length > 0 ? (
                  <>
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

                    {reviews.length > 3 && (
                      <Button variant="outline" className="w-full">
                        View All Reviews
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Reviews Yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Be the first to share your experience at {attraction.name}!
                    </p>
                  </div>
                )}
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
                      <span className="text-xl font-bold">{attraction.priceFormatted}</span>
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
