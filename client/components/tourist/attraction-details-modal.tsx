"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MapPin,
  Star,
  Clock,
  Camera,
  Heart,
  Navigation,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  Loader2,
  AlertCircle,
  Share,
  ExternalLink,
  ImageIcon,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, touristApi } from "@/lib/api"

// Types based on Prisma schema
interface AttractionImage {
  id: number
  imageUrl: string
}

interface AttractionDetails {
  id: number
  name: string
  description?: string
  address: string
  category: string
  latitude?: number
  longitude?: number
  openingHours?: string
  rating?: number
  price?: number
  createdDate: string
  user: {
    id: number
    username: string
    email: string
  }
  images: AttractionImage[]
  _count: {
    visits: number
  }
}

interface Visit {
  attractionId: number
  visitDate: string
  amount?: number
  duration?: number
  groupId?: string
  visitorFeedback?: string
  rating?: number
}

interface AttractionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  attractionId: number | null
  onVisitRecorded?: () => void
}

export function AttractionDetailsModal({ isOpen, onClose, attractionId, onVisitRecorded }: AttractionDetailsModalProps) {
  const [attraction, setAttraction] = useState<AttractionDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecordingVisit, setIsRecordingVisit] = useState(false)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitData, setVisitData] = useState<Visit>({
    attractionId: 0,
    visitDate: new Date().toISOString().split('T')[0],
    amount: undefined,
    duration: undefined,
    groupId: '',
    visitorFeedback: '',
    rating: 5,
  })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && attractionId) {
      fetchAttractionDetails()
    }
  }, [isOpen, attractionId])

  useEffect(() => {
    if (attractionId) {
      setVisitData(prev => ({ ...prev, attractionId }))
    }
  }, [attractionId])

  const fetchAttractionDetails = async () => {
    if (!attractionId) return

    try {
      setLoading(true)
      setError(null)

      const response = await touristApi.getAttraction(attractionId)
      
      if (response.success && response.data) {
        setAttraction(response.data)
        setCurrentImageIndex(0)
      } else {
        setError('Failed to load attraction details')
      }
    } catch (err) {
      console.error('Failed to fetch attraction details:', err)
      setError('Failed to load attraction details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRecordVisit = async () => {
    try {
      setIsRecordingVisit(true)

      const response = await touristApi.recordVisit({
        ...visitData,
        visitDate: new Date(visitData.visitDate).toISOString(),
        amount: visitData.amount ? parseFloat(visitData.amount.toString()) : undefined,
        duration: visitData.duration ? parseInt(visitData.duration.toString()) : undefined,
      })

      if (response.success) {
        setShowVisitForm(false)
        setVisitData({
          attractionId: attractionId || 0,
          visitDate: new Date().toISOString().split('T')[0],
          amount: undefined,
          duration: undefined,
          groupId: '',
          visitorFeedback: '',
          rating: 5,
        })
        
        // Refresh attraction details to update visit count
        await fetchAttractionDetails()
        
        if (onVisitRecorded) {
          onVisitRecorded()
        }
        
        // Show success message or toast here
        console.log('Visit recorded successfully!')
      }
    } catch (err) {
      console.error('Failed to record visit:', err)
      setError('Failed to record visit. Please try again.')
    } finally {
      setIsRecordingVisit(false)
    }
  }

  const nextImage = () => {
    if (attraction?.images && attraction.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % attraction.images.length)
    }
  }

  const prevImage = () => {
    if (attraction?.images && attraction.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + attraction.images.length) % attraction.images.length)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ))
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading attraction details...
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchAttractionDetails}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : attraction ? (
            <div className="space-y-0">
              {/* Image Gallery */}
              <div className="relative h-64 bg-muted">
                {attraction.images && attraction.images.length > 0 ? (
                  <>
                    <img
                      src={attraction.images[currentImageIndex]?.imageUrl || "/placeholder.svg"}
                      alt={attraction.name}
                      className="w-full h-full object-cover"
                    />
                    {attraction.images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
                          onClick={prevImage}
                        >
                          ←
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
                          onClick={nextImage}
                        >
                          →
                        </Button>
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                          {currentImageIndex + 1} / {attraction.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>No images available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">{attraction.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-4 text-base">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {attraction.address}
                    </div>
                    <Badge variant="secondary">{attraction.category}</Badge>
                  </DialogDescription>
                </DialogHeader>

                {/* Stats Row */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {attraction.rating && (
                    <div className="flex items-center gap-1">
                      {renderStars(attraction.rating)}
                      <span className="ml-1">{attraction.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {attraction._count.visits} visits
                  </div>
                  {attraction.price && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${attraction.price}
                    </div>
                  )}
                </div>

                {/* Description */}
                {attraction.description && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground leading-relaxed">{attraction.description}</p>
                  </div>
                )}

                {/* Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  {attraction.openingHours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Hours: {attraction.openingHours}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Added: {new Date(attraction.createdDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Managed by: {attraction.user.username}</span>
                  </div>
                  {attraction.latitude && attraction.longitude && (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {attraction.latitude.toFixed(4)}, {attraction.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={() => setShowVisitForm(true)} className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Record Visit
                  </Button>
                  <Button variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline">
                    <Share className="h-4 w-4" />
                  </Button>
                  {attraction.latitude && attraction.longitude && (
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Visit Recording Form */}
                {showVisitForm && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">Record Your Visit</CardTitle>
                      <CardDescription>Share your experience at {attraction.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="visitDate">Visit Date</Label>
                          <Input
                            id="visitDate"
                            type="date"
                            value={visitData.visitDate}
                            onChange={(e) => setVisitData(prev => ({ ...prev, visitDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Input
                            id="duration"
                            type="number"
                            placeholder="120"
                            value={visitData.duration || ''}
                            onChange={(e) => setVisitData(prev => ({ ...prev, duration: e.target.value ? parseInt(e.target.value) : undefined }))}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="amount">Amount Spent ($)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="25.00"
                            value={visitData.amount || ''}
                            onChange={(e) => setVisitData(prev => ({ ...prev, amount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rating">Rating</Label>
                          <Input
                            id="rating"
                            type="number"
                            min="1"
                            max="5"
                            value={visitData.rating || 5}
                            onChange={(e) => setVisitData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="groupId">Group ID (optional)</Label>
                        <Input
                          id="groupId"
                          placeholder="family-trip-2024"
                          value={visitData.groupId || ''}
                          onChange={(e) => setVisitData(prev => ({ ...prev, groupId: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="feedback">Your Feedback</Label>
                        <Textarea
                          id="feedback"
                          placeholder="Share your experience..."
                          value={visitData.visitorFeedback || ''}
                          onChange={(e) => setVisitData(prev => ({ ...prev, visitorFeedback: e.target.value }))}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleRecordVisit} 
                          disabled={isRecordingVisit}
                          className="flex-1"
                        >
                          {isRecordingVisit ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Recording...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Record Visit
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowVisitForm(false)}
                          disabled={isRecordingVisit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
