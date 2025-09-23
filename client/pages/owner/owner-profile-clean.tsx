"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Mail, 
  Phone, 
  Edit, 
  Save, 
  Camera, 
  Loader2,
  Building,
  AlertCircle,
  CheckCircle2,
  Calendar
} from "lucide-react"
import { ownerApi } from "@/lib/api"

interface ProfileData {
  id: number
  username: string
  email: string
  fullName: string
  phoneNumber: string
  profilePicture: string | null
  role: string
  createdAt: string
  updatedAt: string
}

export function OwnerProfile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: ""
  })

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await ownerApi.getProfile()
      
      if (response.success && response.data) {
        setProfileData(response.data)
        setFormData({
          fullName: response.data.fullName || "",
          email: response.data.email || "",
          phoneNumber: response.data.phoneNumber || ""
        })
      } else {
        setError("Failed to load profile data")
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError("Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      const response = await ownerApi.updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      })

      if (response.success) {
        setProfileData(response.data)
        setIsEditing(false)
        setSuccessMessage("Profile updated successfully!")
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(response.message || "Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setSuccessMessage(null)
    
    // Reset form data to original values
    if (profileData) {
      setFormData({
        fullName: profileData.fullName || "",
        email: profileData.email || "",
        phoneNumber: profileData.phoneNumber || ""
      })
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !profileData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={fetchProfileData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Owner Profile</h1>
            <p className="text-muted-foreground">Manage your attraction owner account settings</p>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Your avatar image</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage 
                    src={profileData?.profilePicture || "/placeholder.svg"} 
                    alt="Profile" 
                  />
                  <AvatarFallback className="text-2xl">
                    <Building className="w-16 h-16" />
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label
                    htmlFor="profile-upload"
                    className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        // Handle image upload here
                        console.log('Image upload:', e.target.files?.[0])
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">{profileData?.username}</h3>
                <p className="text-muted-foreground">Attraction Owner</p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={profileData?.username || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* Role (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="role">Account Role</Label>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="role"
                      value={profileData?.role || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <Label htmlFor="memberSince">Member Since</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="memberSince"
                      value={profileData ? formatDate(profileData.createdAt) : ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account statistics and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold">Profile Completeness</h3>
                <p className="text-2xl font-bold text-primary mt-2">
                  {Math.round(
                    ((formData.fullName ? 1 : 0) + 
                     (formData.email ? 1 : 0) + 
                     (formData.phoneNumber ? 1 : 0) + 
                     (profileData?.username ? 1 : 0)) / 4 * 100
                  )}%
                </p>
                <p className="text-sm text-muted-foreground">Complete all fields</p>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold">Account Status</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
                <p className="text-sm text-muted-foreground">Your account is active</p>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold">Last Updated</h3>
                <p className="text-2xl font-bold text-primary mt-2">
                  {profileData ? formatDate(profileData.updatedAt) : "Never"}
                </p>
                <p className="text-sm text-muted-foreground">Profile information</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
