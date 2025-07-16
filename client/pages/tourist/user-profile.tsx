"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { userApi, touristApi } from "@/lib/api"
import {
  User,
  MapPin,
  Star,
  Calendar,
  Heart,
  MessageSquare,
  Settings,
  Camera,
  Edit,
  Save,
  X,
  Award,
  TrendingUp,
  Clock,
  Eye,
  Share,
  Download,
  Shield,
  Trophy,
  CheckCircle,
  Lock,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface UserProfileProps {
  onAttractionSelect: (attractionId: number) => void
}

export default function UserProfile({ onAttractionSelect }: UserProfileProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  // Data states
  const [visitHistory, setVisitHistory] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})

  // Real user profile data from database
  const [profileData, setProfileData] = useState({
    userId: user?.id || 0,
    username: user?.username || "",
    email: user?.email || "",
    phoneNumber: "",
    birthDate: "",
    postcode: "",
    gender: "",
    profilePicture: "/placeholder.svg?height=120&width=120",
    bio: "",
    location: "",
    joinDate: "",
    preferences: {
      notifications: true,
      emailUpdates: true,
      publicProfile: true,
      shareLocation: false,
    },
  })

  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load user profile
        const profileResponse = await userApi.getProfile()
        if (profileResponse.success && profileResponse.data) {
          const profile = profileResponse.data
          setProfileData(prev => ({
            ...prev,
            userId: profile.id,
            username: profile.username || profile.name,
            email: profile.email,
            phoneNumber: profile.phoneNumber || "",
            birthDate: profile.birthDate || "",
            postcode: profile.postcode || "",
            gender: profile.gender || "",
            profilePicture: profile.profilePicture || "/placeholder.svg?height=120&width=120",
            bio: profile.bio || "",
            location: profile.location || "",
            joinDate: profile.createdDate || "",
          }))
        }

        // Load user statistics
        try {
          const statsResponse = await userApi.getUserStats()
          if (statsResponse.success && statsResponse.data) {
            setStats(statsResponse.data)
          }
        } catch (statsError) {
          console.warn("Could not load user stats:", statsError)
        }

        // Load visit history (if available)
        try {
          const visitsResponse = await touristApi.getUserVisits({ limit: 100 })
          if (visitsResponse.success && visitsResponse.data) {
            const transformedVisits = visitsResponse.data.map((visit: any) => ({
              visitId: visit.id,
              attractionId: visit.attractionId,
              attractionName: visit.attraction?.name || "Unknown Attraction",
              visitDate: visit.visitDate,
              duration: visit.duration || 0,
              amount: visit.amount || 0,
              rating: visit.rating || 0,
              review: visit.visitorFeedback || "",
              images: visit.images || [],
            }))
            setVisitHistory(transformedVisits)
          }
        } catch (visitsError) {
          console.warn("Could not load visit history:", visitsError)
          // Set some mock data for demonstration
          setVisitHistory([])
        }

        // Load wishlist (favorites)
        try {
          const wishlistResponse = await userApi.getFavorites()
          if (wishlistResponse.success && wishlistResponse.data) {
            const transformedWishlist = wishlistResponse.data.map((fav: any) => ({
              attractionId: fav.attraction.id,
              name: fav.attraction.name,
              location: fav.attraction.address || "Unknown Location",
              image: fav.attraction.images?.[0]?.imageUrl || "/placeholder.svg",
              price: fav.attraction.price ? `IDR ${fav.attraction.price.toLocaleString()}` : "Free",
              rating: fav.attraction.rating || 0,
              addedDate: fav.createdDate,
            }))
            setWishlist(transformedWishlist)
          }
        } catch (wishlistError) {
          console.warn("Could not load wishlist:", wishlistError)
          setWishlist([])
        }

        // Generate achievements based on user activity
        const generatedAchievements = generateAchievements(stats, visitHistory.length)
        setAchievements(generatedAchievements)

      } catch (err) {
        console.error("Error loading profile data:", err)
        setError("Failed to load profile data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadProfileData()
    } else {
      setLoading(false)
    }
  }, [user])

  // Generate achievements based on user activity
  const generateAchievements = (userStats: any, visitCount: number) => {
    return [
      {
        id: 1,
        title: "Explorer",
        description: "Visited 5 different attractions",
        icon: MapPin,
        earned: visitCount >= 5,
        earnedDate: visitCount >= 5 ? new Date().toISOString() : null,
        progress: Math.min(visitCount, 5),
        total: 5,
      },
      {
        id: 2,
        title: "Reviewer",
        description: "Left 10 helpful reviews",
        icon: Star,
        earned: (userStats?.totalReviews || 0) >= 10,
        earnedDate: (userStats?.totalReviews || 0) >= 10 ? new Date().toISOString() : null,
        progress: Math.min(userStats?.totalReviews || 0, 10),
        total: 10,
      },
      {
        id: 3,
        title: "Cultural Enthusiast",
        description: "Visited 3 cultural sites",
        icon: Trophy,
        earned: (userStats?.culturalVisits || 0) >= 3,
        earnedDate: (userStats?.culturalVisits || 0) >= 3 ? new Date().toISOString() : null,
        progress: Math.min(userStats?.culturalVisits || 0, 3),
        total: 3,
      },
      {
        id: 4,
        title: "Adventure Seeker",
        description: "Completed 5 outdoor activities",
        icon: Award,
        earned: (userStats?.adventureActivities || 0) >= 5,
        earnedDate: (userStats?.adventureActivities || 0) >= 5 ? new Date().toISOString() : null,
        progress: Math.min(userStats?.adventureActivities || 0, 5),
        total: 5,
      },
    ]
  }

  // Handle profile updates
  const handleSaveProfile = async () => {
    try {
      setUpdating(true)
      
      // Update profile via API
      const updateResponse = await userApi.updateProfile(profileData)
      if (updateResponse.success) {
        setIsEditing(false)
        // Show success message
      } else {
        throw new Error(updateResponse.message || "Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset any changes
  }

  const DashboardTab = () => {
    if (loading) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-4 text-center">
                  <div className="animate-pulse">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="animate-pulse h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error Loading Profile</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )
    }

    return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalVisits}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Places Visited</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Avg Rating</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.reviewsWritten}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Reviews</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-4 text-center">
            <Camera className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.photosShared}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Photos</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {visitHistory.slice(0, 3).map((visit) => (
              <div
                key={visit.visitId}
                className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                onClick={() => onAttractionSelect(visit.attractionId)}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-white">{visit.attractionName}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Visited on {new Date(visit.visitDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{visit.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.earned
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      achievement.earned
                        ? "bg-green-600 text-white"
                        : "bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <achievement.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white">{achievement.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{achievement.description}</p>
                  </div>
                  {achievement.earned && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
                {!achievement.earned && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {Math.round((achievement.progress / achievement.total) * 100)}%
                      </span>
                    </div>
                    <Progress value={(achievement.progress / achievement.total) * 100} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    )
  }

  const HistoryTab = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="animate-pulse h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="animate-pulse h-10 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error Loading History</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Visit History</h2>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="space-y-4">
        {visitHistory.map((visit) => (
          <Card key={visit.visitId} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3
                    className="font-bold text-slate-900 dark:text-white text-lg cursor-pointer hover:text-blue-600"
                    onClick={() => onAttractionSelect(visit.attractionId)}
                  >
                    {visit.attractionName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(visit.visitDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.floor(visit.duration / 60)}h {visit.duration % 60}m
                    </span>
                    <span>IDR {visit.amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < visit.rating ? "fill-current" : ""}`} />
                  ))}
                </div>
              </div>

              {visit.review && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-slate-700 dark:text-slate-300">{visit.review}</p>
                </div>
              )}

              {visit.images.length > 0 && (
                <div className="mt-4">
                  <div className="flex gap-2">
                    {visit.images.map((image: string, index: number) => (
                      <img
                        key={index}
                        src={image || "/placeholder.svg"}
                        alt={`Visit photo ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => onAttractionSelect(visit.attractionId)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    )
  }

  const WishlistTab = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="animate-pulse h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="animate-pulse h-6 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <div className="animate-pulse">
                  <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-t"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error Loading Wishlist</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Wishlist</h2>
        <Badge variant="secondary">{wishlist.length} items</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((item) => (
          <Card
            key={item.attractionId}
            className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 hover:scale-[1.02]"
            onClick={() => onAttractionSelect(item.attractionId)}
          >
            <div className="relative overflow-hidden">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3">
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">{item.name}</h3>
              <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {item.location}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.rating}</span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">{item.price}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Added {new Date(item.addedDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {wishlist.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
          <Heart className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Your wishlist is empty</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Start adding attractions you'd like to visit</p>
          <Button onClick={() => window.history.back()}>Explore Attractions</Button>
        </div>
      )}
    </div>
    )
  }

  const ReviewsTab = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="animate-pulse h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="animate-pulse h-6 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex justify-between">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    </div>
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error Loading Reviews</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Reviews</h2>
        <Badge variant="secondary">{stats.reviewsWritten} reviews</Badge>
      </div>

      <div className="space-y-4">
        {visitHistory
          .filter((visit) => visit.review)
          .map((visit) => (
            <Card key={visit.visitId} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3
                      className="font-bold text-slate-900 dark:text-white text-lg cursor-pointer hover:text-blue-600"
                      onClick={() => onAttractionSelect(visit.attractionId)}
                    >
                      {visit.attractionName}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Reviewed on {new Date(visit.visitDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < visit.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4">{visit.review}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Review
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
    )
  }

  const SettingsTab = () => {
    if (loading) {
      return (
        <div className="space-y-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="animate-pulse h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Error Loading Settings</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )
    }

    return (
    <div className="space-y-8">
      {/* Profile Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              className="gap-2"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.profilePicture || "/placeholder.svg"} alt={profileData.username} />
                <AvatarFallback className="text-2xl">{profileData.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profileData.username}</h3>
              <p className="text-slate-600 dark:text-slate-400">{profileData.email}</p>
              <Badge variant="secondary" className="mt-1">
                Tourist
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phoneNumber}
                onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={profileData.birthDate}
                onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={profileData.gender}
                onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={profileData.postcode}
                onChange={(e) => setProfileData({ ...profileData, postcode: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Notifications */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Privacy & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Receive notifications about new events and recommendations
                </p>
              </div>
              <Switch
                id="notifications"
                checked={profileData.preferences.notifications}
                onCheckedChange={(checked) =>
                  setProfileData({
                    ...profileData,
                    preferences: { ...profileData.preferences, notifications: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailUpdates">Email Updates</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Receive email updates about your bookings and new features
                </p>
              </div>
              <Switch
                id="emailUpdates"
                checked={profileData.preferences.emailUpdates}
                onCheckedChange={(checked) =>
                  setProfileData({
                    ...profileData,
                    preferences: { ...profileData.preferences, emailUpdates: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="publicProfile">Public Profile</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Allow others to see your profile and reviews
                </p>
              </div>
              <Switch
                id="publicProfile"
                checked={profileData.preferences.publicProfile}
                onCheckedChange={(checked) =>
                  setProfileData({
                    ...profileData,
                    preferences: { ...profileData.preferences, publicProfile: checked },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="shareLocation">Share Location</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Share your location for better recommendations
                </p>
              </div>
              <Switch
                id="shareLocation"
                checked={profileData.preferences.shareLocation}
                onCheckedChange={(checked) =>
                  setProfileData({
                    ...profileData,
                    preferences: { ...profileData.preferences, shareLocation: checked },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="h-4 w-4" />
            Download My Data
          </Button>
          <Button variant="destructive" className="w-full justify-start gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
    )
  }

  // Global loading state for initial data
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header Skeleton */}
          <div className="text-center mb-8">
            <div className="animate-pulse">
              <div className="h-32 w-32 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto mb-2"></div>
              <div className="flex items-center justify-center gap-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
              </div>
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="animate-pulse">
            <div className="grid grid-cols-5 gap-2 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Global error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Failed to Load Profile</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} size="lg">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-blue-500/20">
            <AvatarImage src={profileData.profilePicture || "/placeholder.svg"} alt={profileData.username} />
            <AvatarFallback className="text-4xl">{profileData.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{profileData.username}</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-2">{profileData.bio}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profileData.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Member since {stats.memberSince}
            </span>
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="dashboard" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
          <TabsContent value="wishlist">
            <WishlistTab />
          </TabsContent>
          <TabsContent value="reviews">
            <ReviewsTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
