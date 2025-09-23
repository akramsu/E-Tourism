"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Clock, Tag, Navigation, Edit3, ImageIcon, Building2, AlertCircle, Loader2 } from "lucide-react"
import { ownerApi } from "@/lib/api"
import Link from "next/link"

interface Attraction {
  id: number
  name: string
  description: string
  address: string
  category: string
  latitude: number
  longitude: number
  openingHours: string
  price: number
  images?: string[]
  rating?: number
  createdDate?: string
  userId?: number
}

const categories = [
  { value: "MUSEUM", label: "Museum" },
  { value: "HISTORICAL_SITE", label: "Historical Site" },
  { value: "CULTURAL_SITE", label: "Cultural Site" },
  { value: "PARK", label: "Park" },
  { value: "RELIGIOUS_SITE", label: "Religious Site" },
  { value: "ADVENTURE_PARK", label: "Adventure Park" },
  { value: "NATURE_RESERVE", label: "Nature Reserve" },
  { value: "BEACH", label: "Beach" },
  { value: "MOUNTAIN", label: "Mountain" },
  { value: "SHOPPING_CENTER", label: "Shopping Center" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "HOTEL", label: "Hotel" },
]

export function ManageAttraction() {
  const [attraction, setAttraction] = useState<Attraction | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Attraction>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch attraction data on component mount
  useEffect(() => {
    fetchAttraction()
  }, [])

  const fetchAttraction = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await ownerApi.getMyAttraction()
      
      if (response.success && response.data) {
        setAttraction(response.data)
        setEditForm(response.data)
      } else {
        setError("Failed to load attraction data")
      }
    } catch (err) {
      console.error("Error fetching attraction:", err)
      setError(err instanceof Error ? err.message : "Failed to load attraction")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (attraction) {
      setEditForm(attraction)
      setIsEditing(true)
      setError(null)
      setSuccess(null)
    }
  }

  const handleSave = async () => {
    if (!attraction || !editForm.name || !editForm.description || !editForm.address || !editForm.category) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      
      const updateData = {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        category: editForm.category,
        latitude: editForm.latitude || 0,
        longitude: editForm.longitude || 0,
        openingHours: editForm.openingHours || "",
        price: editForm.price || 0,
      }

      const response = await ownerApi.updateAttraction(attraction.id, updateData)
      
      if (response.success && response.data) {
        setAttraction(response.data)
        setEditForm(response.data)
        setIsEditing(false)
        setSuccess("Attraction updated successfully!")
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to update attraction")
      }
    } catch (err) {
      console.error("Error updating attraction:", err)
      setError(err instanceof Error ? err.message : "Failed to update attraction")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (attraction) {
      setEditForm(attraction)
    }
    setIsEditing(false)
    setError(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getCategoryLabel = (value: string) => {
    const category = categories.find(cat => cat.value === value)
    return category ? category.label : value
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading your attraction...</p>
        </div>
      </div>
    )
  }

  // No attraction found
  if (!attraction) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Attraction Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You haven't created an attraction yet. Create one to start managing your business.
        </p>
        <Link href="/owner/create-attraction">
          <Button>
            Create Attraction
          </Button>
        </Link>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attraction</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your attraction information</p>
        </div>
        <Button onClick={handleEdit} className="flex items-center gap-2" disabled={isSaving}>
          <Edit3 className="h-4 w-4" />
          Edit Attraction
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{attraction.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</Label>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{attraction.description}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Tag className="h-3 w-3" />
                    {getCategoryLabel(attraction.category)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</Label>
                <p className="text-gray-700 dark:text-gray-300">{attraction.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Latitude</Label>
                  <p className="text-gray-700 dark:text-gray-300 font-mono">{attraction.latitude}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Longitude</Label>
                  <p className="text-gray-700 dark:text-gray-300 font-mono">{attraction.longitude}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Gallery ({attraction.images?.length || 0} images)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attraction.images && attraction.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attraction.images.map((image: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${attraction.name} - Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      {index === 0 && <Badge className="absolute top-2 left-2 text-xs">Primary</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No images uploaded yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Upload images to showcase your attraction
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Operating Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Opening Hours</Label>
                <p className="text-gray-700 dark:text-gray-300 font-medium">{attraction.openingHours}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Price</Label>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatPrice(attraction.price)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Coordinates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Latitude:</span>
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{attraction.latitude}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Longitude:</span>
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{attraction.longitude}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Attraction Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Attraction Name</Label>
                <Input
                  id="name"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter attraction name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editForm.category || ""}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Describe your attraction"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Enter full address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={editForm.latitude || ""}
                  onChange={(e) => setEditForm({ ...editForm, latitude: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="-7.6079"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={editForm.longitude || ""}
                  onChange={(e) => setEditForm({ ...editForm, longitude: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="110.2038"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hours">Opening Hours</Label>
                <Input
                  id="hours"
                  value={editForm.openingHours || ""}
                  onChange={(e) => setEditForm({ ...editForm, openingHours: e.target.value })}
                  placeholder="09:00 - 17:00"
                />
              </div>
              <div>
                <Label htmlFor="price">Ticket Price (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  value={editForm.price || ""}
                  onChange={(e) => setEditForm({ ...editForm, price: Number.parseInt(e.target.value) || 0 })}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageAttraction
