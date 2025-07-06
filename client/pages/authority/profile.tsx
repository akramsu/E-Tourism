"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { authorityApi } from "@/lib/api"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar, 
  Edit, 
  Save, 
  Camera, 
  Loader2,
  AlertCircle,
  Shield,
  Settings,
  Activity,
  Bell,
  Lock,
  RefreshCw,
  Eye,
  Download
} from "lucide-react"

// TypeScript interfaces for live data
interface AuthorityProfile {
  id: number
  username: string
  email: string
  phoneNumber?: string
  birthDate?: string
  postcode?: string
  gender?: string
  profilePicture?: string
  position?: string
  department?: string
  bio?: string
  createdDate: string
  role: {
    roleName: string
  }
  preferences?: {
    emailNotifications: boolean
    smsNotifications: boolean
    theme: 'light' | 'dark' | 'auto'
    reportFrequency: 'daily' | 'weekly' | 'monthly'
    exportFormat: 'excel' | 'pdf' | 'csv'
    language: string
    timezone: string
  }
}

interface ProfileStats {
  totalAttractions: number
  totalVisitors: number
  totalRevenue: number
  reportsGenerated: number
  lastLoginDate: string
  accountAge: number
}

interface ActivityLog {
  id: number
  action: string
  description: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

export default function AuthorityProfile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")
  
  const [profile, setProfile] = useState<AuthorityProfile | null>(null)
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null)
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    position: "",
    department: "",
    bio: "",
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      theme: 'auto' as 'light' | 'dark' | 'auto',
      reportFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
      exportFormat: 'excel' as 'excel' | 'pdf' | 'csv',
      language: 'en',
      timezone: 'UTC'
    }
  })

  useEffect(() => {
    if (user && user.role.roleName === 'AUTHORITY') {
      fetchProfileData()
    }
  }, [user])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [profileResponse, statsResponse, activityResponse] = await Promise.all([
        authorityApi.getProfile(),
        authorityApi.getProfileStats(),
        authorityApi.getActivityLog({ limit: 10 })
      ])

      if (profileResponse.success && profileResponse.data) {
        const profileData = profileResponse.data
        setProfile(profileData)
        
        // Update form data with live data
        setFormData({
          username: profileData.username || "",
          email: profileData.email || "",
          phoneNumber: profileData.phoneNumber || "",
          position: profileData.position || "",
          department: profileData.department || "",
          bio: profileData.bio || "",
          preferences: {
            emailNotifications: profileData.preferences?.emailNotifications ?? true,
            smsNotifications: profileData.preferences?.smsNotifications ?? false,
            theme: profileData.preferences?.theme || 'auto',
            reportFrequency: profileData.preferences?.reportFrequency || 'weekly',
            exportFormat: profileData.preferences?.exportFormat || 'excel',
            language: profileData.preferences?.language || 'en',
            timezone: profileData.preferences?.timezone || 'UTC'
          }
        })
      } else {
        setError("Failed to load profile data")
      }

      if (statsResponse.success && statsResponse.data) {
        setProfileStats(statsResponse.data)
      }

      if (activityResponse.success && activityResponse.data) {
        setActivityLog(activityResponse.data)
      }

    } catch (err) {
      console.error("Error fetching profile data:", err)
      setError(err instanceof Error ? err.message : "Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const updateData = {
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        position: formData.position,
        department: formData.department,
        bio: formData.bio,
        preferences: formData.preferences
      }

      const response = await authorityApi.updateProfile(updateData)
      
      if (response.success) {
        setIsEditing(false)
        await fetchProfileData() // Refresh data
      } else {
        setError(response.message || "Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('preferences.')) {
      const prefField = field.replace('preferences.', '')
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)

      const response = await authorityApi.uploadProfilePicture(file)
      
      if (response.success) {
        await fetchProfileData() // Refresh to get new image
      } else {
        setError("Failed to upload profile picture")
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      setError("Failed to upload profile picture")
    } finally {
      setUploading(false)
    }
  }

  const handleRefresh = () => {
    fetchProfileData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button onClick={handleRefresh} variant="outline" size="sm" className="ml-2">
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account information and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="default">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))} 
            className="gap-2"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Save className="h-4 w-4" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Picture and Basic Info */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage 
                        src={profile?.profilePicture || "/placeholder.svg"} 
                        alt={formData.username} 
                      />
                      <AvatarFallback className="text-lg">
                        {formData.username
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="profile-upload"
                        />
                        <label htmlFor="profile-upload">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                            disabled={uploading}
                            asChild
                          >
                            <span>
                              {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">{formData.username}</h3>
                    <p className="text-sm text-muted-foreground">{formData.position}</p>
                    <Badge variant="secondary" className="mt-2">
                      <Shield className="h-3 w-3 mr-1" />
                      Tourism Authority
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.department || "Tourism Development"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined {profile?.createdDate ? new Date(profile.createdDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                {profileStats && (
                  <div className="pt-4 border-t space-y-2">
                    <h4 className="font-medium text-sm">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="font-bold text-blue-600">{profileStats.totalAttractions}</div>
                        <div className="text-muted-foreground">Attractions</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="font-bold text-green-600">{profileStats.reportsGenerated}</div>
                        <div className="text-muted-foreground">Reports</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
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
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange("position", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about your experience and role..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Shield className="h-4 w-4" />
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Eye className="h-4 w-4" />
                Active Sessions
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Activity className="h-4 w-4" />
                Login History
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={formData.preferences.emailNotifications}
                    onCheckedChange={(checked) => handleInputChange("preferences.emailNotifications", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                  </div>
                  <Switch
                    checked={formData.preferences.smsNotifications}
                    onCheckedChange={(checked) => handleInputChange("preferences.smsNotifications", checked)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportFrequency">Report Frequency</Label>
                  <Select 
                    value={formData.preferences.reportFrequency} 
                    onValueChange={(value) => handleInputChange("preferences.reportFrequency", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interface Preferences</CardTitle>
                <CardDescription>Customize your dashboard experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select 
                    value={formData.preferences.theme} 
                    onValueChange={(value) => handleInputChange("preferences.theme", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exportFormat">Default Export Format</Label>
                  <Select 
                    value={formData.preferences.exportFormat} 
                    onValueChange={(value) => handleInputChange("preferences.exportFormat", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLog.length > 0 ? (
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent activity to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Named export for compatibility
export type { AuthorityProfile }
