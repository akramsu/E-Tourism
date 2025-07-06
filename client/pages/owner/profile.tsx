"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { User, Mail, Phone, MapPin, Building, Calendar, Edit, Save, Camera, Star, AlertCircle, Loader2, Lock, Bell, Shield, Upload } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { userApi } from "@/lib/api"

interface UserProfile {
  id: number
  username: string
  email: string
  phoneNumber?: string
  birthDate?: string
  postcode?: string
  gender?: string
  profilePicture?: string
  businessName?: string
  businessType?: string
  bio?: string
  createdDate: string
  role: {
    roleName: string
  }
}

interface UserStats {
  totalVisitors: number
  averageRating: number
  monthlyRevenue: number
  growthRate: number
  attractionCount: number
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function OwnerProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const verificationFileRef = useRef<HTMLInputElement>(null)

  const [verificationFiles, setVerificationFiles] = useState({
    businessLicense: null as File | null,
    businessRegistration: null as File | null,
    additionalDocuments: [] as File[]
  })

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    businessName: "",
    businessType: "",
    bio: "",
    postcode: "",
    gender: "",
  })

  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [profileResponse, statsResponse, notificationResponse] = await Promise.all([
        userApi.getProfile(),
        userApi.getUserStats().catch(() => ({ success: false, data: null })), // Stats might not be available for all users
        userApi.getNotificationSettings().catch(() => ({ success: false, data: null })) // Notification settings might not be available
      ])

      if (profileResponse.success && profileResponse.data) {
        const profileData = profileResponse.data
        setProfile(profileData)
        setFormData({
          username: profileData.username || "",
          email: profileData.email || "",
          phoneNumber: profileData.phoneNumber || "",
          businessName: profileData.businessName || "",
          businessType: profileData.businessType || "",
          bio: profileData.bio || "",
          postcode: profileData.postcode || "",
          gender: profileData.gender || "",
        })
      } else {
        setError("Failed to load profile data")
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }

      if (notificationResponse.success && notificationResponse.data) {
        setNotificationSettings(notificationResponse.data)
      }

    } catch (err) {
      console.error("Error fetching profile data:", err)
      setError(err instanceof Error ? err.message : "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await userApi.updateProfile({
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        businessName: formData.businessName,
        businessType: formData.businessType,
        bio: formData.bio,
        postcode: formData.postcode,
        gender: formData.gender,
      })

      if (response.success) {
        setProfile(response.data)
        setIsEditing(false)
        setSuccess("Profile updated successfully!")
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      const response = await userApi.uploadProfilePicture(file)

      if (response.success) {
        // Refresh profile data to get updated image URL
        await fetchProfileData()
        setSuccess("Profile picture updated successfully!")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to upload profile picture")
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      setError(err instanceof Error ? err.message : "Failed to upload image")
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setError(null)
      const response = await userApi.changePassword(passwordData)

      if (response.success) {
        setShowPasswordDialog(false)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setSuccess("Password changed successfully!")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to change password")
      }
    } catch (err) {
      console.error("Error changing password:", err)
      setError(err instanceof Error ? err.message : "Failed to change password")
    }
  }

  const handleNotificationSettingsUpdate = async (updatedSettings: NotificationSettings) => {
    try {
      setError(null)
      const response = await userApi.updateNotificationSettings(updatedSettings)

      if (response.success) {
        setNotificationSettings(updatedSettings)
        setSuccess("Notification settings updated successfully!")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to update notification settings")
      }
    } catch (err) {
      console.error("Error updating notification settings:", err)
      setError(err instanceof Error ? err.message : "Failed to update notification settings")
    }
  }

  const handleBusinessVerification = async () => {
    if (!verificationFiles.businessLicense && !verificationFiles.businessRegistration) {
      setError("Please upload at least one verification document")
      return
    }

    try {
      setError(null)
      const verificationData: any = {}
      
      if (verificationFiles.businessLicense) {
        verificationData.businessLicense = verificationFiles.businessLicense
      }
      if (verificationFiles.businessRegistration) {
        verificationData.businessRegistration = verificationFiles.businessRegistration
      }
      if (verificationFiles.additionalDocuments.length > 0) {
        verificationData.additionalDocuments = verificationFiles.additionalDocuments
      }

      const response = await userApi.requestBusinessVerification(verificationData)

      if (response.success) {
        setShowVerificationDialog(false)
        setVerificationFiles({
          businessLicense: null,
          businessRegistration: null,
          additionalDocuments: []
        })
        setSuccess("Business verification request submitted successfully!")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to submit business verification request")
      }
    } catch (err) {
      console.error("Error submitting business verification:", err)
      setError(err instanceof Error ? err.message : "Failed to submit business verification")
    }
  }

  const handleVerificationFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'businessLicense' | 'businessRegistration' | 'additional') => {
    const files = event.target.files
    if (!files) return

    if (fileType === 'additional') {
      setVerificationFiles(prev => ({
        ...prev,
        additionalDocuments: [...prev.additionalDocuments, ...Array.from(files)]
      }))
    } else {
      setVerificationFiles(prev => ({
        ...prev,
        [fileType]: files[0]
      }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!profile) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error || "Failed to load profile"}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={fetchProfileData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your business profile and account information</p>
        </div>
        <Button 
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))} 
          className="gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEditing ? (
            <Save className="h-4 w-4" />
          ) : (
            <Edit className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture and Basic Info */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.profilePicture || "/placeholder.svg"} alt={profile.username} />
                  <AvatarFallback className="text-lg">
                    {profile.username
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">{profile.username}</h3>
                <p className="text-sm text-muted-foreground">{formData.businessName || "Business Owner"}</p>
                <Badge variant="secondary" className="mt-2">
                  {profile.role.roleName}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{formData.businessType || "Business"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{formData.postcode || "Location not set"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {formatDate(profile.createdDate)}</span>
            </div>
            {stats && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{stats.averageRating.toFixed(1)} Rating</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Update your business details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => handleInputChange("businessType", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Location/Postcode</Label>
                <Input
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => handleInputChange("postcode", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Business Description</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing}
                rows={4}
                placeholder="Describe your business..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Stats and Settings */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Performance</CardTitle>
            <CardDescription>Your attraction's key metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Visitors (This Month)</span>
                  <Badge variant="secondary">{stats.totalVisitors.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Rating</span>
                  <Badge variant="secondary">{stats.averageRating.toFixed(1)}/5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Revenue (This Month)</span>
                  <Badge variant="secondary">{formatCurrency(stats.monthlyRevenue)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Growth Rate</span>
                  <Badge variant="secondary" className={stats.growthRate >= 0 ? "text-green-600" : "text-red-600"}>
                    {stats.growthRate > 0 ? "+" : ""}{stats.growthRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Attractions</span>
                  <Badge variant="secondary">{stats.attractionCount}</Badge>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No performance data available</p>
                <p className="text-xs text-gray-400">Create an attraction to see your metrics</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handlePasswordChange}>
                      Change Password
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notification Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {notificationSettings ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <Switch
                          id="emailNotifications"
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingsUpdate({
                              ...notificationSettings,
                              emailNotifications: checked
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushNotifications">Push Notifications</Label>
                        <Switch
                          id="pushNotifications"
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingsUpdate({
                              ...notificationSettings,
                              pushNotifications: checked
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <Switch
                          id="smsNotifications"
                          checked={notificationSettings.smsNotifications}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingsUpdate({
                              ...notificationSettings,
                              smsNotifications: checked
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketingEmails">Marketing Emails</Label>
                        <Switch
                          id="marketingEmails"
                          checked={notificationSettings.marketingEmails}
                          onCheckedChange={(checked) => 
                            handleNotificationSettingsUpdate({
                              ...notificationSettings,
                              marketingEmails: checked
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Loading notification settings...</p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Shield className="h-4 w-4" />
                  Business Verification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Business Verification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Upload your business documents to verify your business account. This helps build trust with customers.
                  </p>
                  
                  <div className="space-y-2">
                    <Label>Business License</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleVerificationFileChange(e, 'businessLicense')}
                        className="hidden"
                        id="businessLicense"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('businessLicense')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload License
                      </Button>
                      {verificationFiles.businessLicense && (
                        <span className="text-xs text-green-600">
                          {verificationFiles.businessLicense.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Business Registration</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleVerificationFileChange(e, 'businessRegistration')}
                        className="hidden"
                        id="businessRegistration"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('businessRegistration')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Registration
                      </Button>
                      {verificationFiles.businessRegistration && (
                        <span className="text-xs text-green-600">
                          {verificationFiles.businessRegistration.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Documents (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleVerificationFileChange(e, 'additional')}
                        className="hidden"
                        id="additionalDocs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('additionalDocs')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Additional
                      </Button>
                      {verificationFiles.additionalDocuments.length > 0 && (
                        <span className="text-xs text-green-600">
                          {verificationFiles.additionalDocuments.length} file(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowVerificationDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBusinessVerification}>
                      Submit for Verification
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
