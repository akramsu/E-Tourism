"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ownerApi } from "@/lib/api"
import {
  MapPin,
  Clock,
  DollarSign,
  Camera,
  Upload,
  X,
  Plus,
  Building2,
  Globe,
  Star,
  Users,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface AttractionFormData {
  name: string
  description: string
  address: string
  category: string
  latitude: string
  longitude: string
  openingHours: string
  price: string
  images: File[]
}

interface CreateAttractionProps {
  onAttractionCreated?: () => void
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

export function CreateAttraction({ onAttractionCreated }: CreateAttractionProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<AttractionFormData>({
    name: "",
    description: "",
    address: "",
    category: "",
    latitude: "",
    longitude: "",
    openingHours: "",
    price: "",
    images: [],
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleInputChange = (field: keyof AttractionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (formData.images.length + files.length > 10) {
      alert("Maximum 10 images allowed")
      return
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }))
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!isStepValid()) {
      setError("Please complete all required fields")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Validate numeric fields
      const latitude = parseFloat(formData.latitude)
      const longitude = parseFloat(formData.longitude)
      const price = parseFloat(formData.price)

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error("Please enter valid latitude and longitude coordinates")
      }

      if (isNaN(price) || price < 0) {
        throw new Error("Please enter a valid price")
      }

      // Create attraction
      const attractionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.address.trim(), // Use address as location
        address: formData.address.trim(),
        city: "Jakarta", // Default or extract from address
        state: "Jakarta", // Default or extract from address  
        zipCode: "12345", // Default or extract from address
        country: "Indonesia", // Default
        latitude,
        longitude,
        openingHours: JSON.parse(formData.openingHours.trim() || "{}"),
        ticketPrice: price,
        capacity: 100, // Default capacity
        phoneNumber: "", // Optional
        email: "", // Optional
        website: "", // Optional
        amenities: [],
        accessibility: [],
        ageRestriction: "All ages",
        duration: 2, // Default 2 hours
        difficulty: "Easy",
        tags: []
      }

      console.log("Creating attraction with data:", attractionData)
      const response = await ownerApi.createAttraction(attractionData)
      
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to create attraction")
      }

      const attractionId = response.data.id
      console.log("Attraction created with ID:", attractionId)

      // Upload images if any
      if (formData.images.length > 0) {
        console.log(`Uploading ${formData.images.length} images...`)
        await ownerApi.uploadAttractionImages(attractionId, formData.images)
        console.log("Images uploaded successfully")
      }

      setSuccess(true)
      
      // Call the callback to update user state and navigate
      if (onAttractionCreated) {
        setTimeout(() => {
          onAttractionCreated()
        }, 2000) // Allow user to see success message
      }

    } catch (error: any) {
      console.error("Error creating attraction:", error)
      setError(error.message || "Failed to create attraction. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.description.trim() && formData.category
      case 2:
        return formData.address.trim() && formData.latitude && formData.longitude
      case 3:
        return formData.openingHours.trim() && formData.price
      case 4:
        return formData.images.length >= 1 // At least 1 image required, 5 recommended
      default:
        return false
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome to TourEase!</h1>
            <p className="text-muted-foreground">Let's set up your attraction to start receiving visitors</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Star className="h-4 w-4" />
          Step {currentStep} of {totalSteps}
        </Badge>
        
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Attraction created successfully! Redirecting to your dashboard...</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Basic Info</span>
              <span>Location</span>
              <span>Details</span>
              <span>Images</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Steps */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 1 && <Building2 className="h-5 w-5" />}
                {currentStep === 2 && <MapPin className="h-5 w-5" />}
                {currentStep === 3 && <Clock className="h-5 w-5" />}
                {currentStep === 4 && <Camera className="h-5 w-5" />}
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "Location Details"}
                {currentStep === 3 && "Operating Details"}
                {currentStep === 4 && "Images & Media"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Tell us about your attraction"}
                {currentStep === 2 && "Where is your attraction located?"}
                {currentStep === 3 && "When is your attraction open and what does it cost?"}
                {currentStep === 4 && "Upload high-quality images to showcase your attraction"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Attraction Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter the name of your attraction"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select attraction category" />
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

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your attraction, its history, features, and what makes it special..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">{formData.description.length}/1000 characters</p>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter the complete address including street, city, postal code..."
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude *</Label>
                      <Input
                        id="latitude"
                        placeholder="-7.7956"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange("latitude", e.target.value)}
                        className="h-12"
                        type="number"
                        step="any"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude *</Label>
                      <Input
                        id="longitude"
                        placeholder="110.3695"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange("longitude", e.target.value)}
                        className="h-12"
                        type="number"
                        step="any"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Location Tips</span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      You can find coordinates using Google Maps. Right-click on your location and select the
                      coordinates to copy them.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Operating Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="openingHours">Opening Hours *</Label>
                    <Input
                      id="openingHours"
                      placeholder="e.g., Mon-Sun: 09:00-17:00"
                      value={formData.openingHours}
                      onChange={(e) => handleInputChange("openingHours", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Ticket Price (IDR) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        placeholder="25000"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        className="h-12 pl-10"
                        type="number"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Enter 0 if the attraction is free to visit</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Visitor Capacity</span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Consider your maximum daily visitor capacity for better crowd management.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-purple-50 dark:bg-purple-950/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Seasonal Hours</span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        You can update opening hours later for different seasons.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Images */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Attraction Images *</Label>
                        <p className="text-sm text-muted-foreground">Upload at least 1 image (5+ recommended for better visibility)</p>
                      </div>
                      <Badge variant={formData.images.length >= 1 ? "default" : "secondary"}>
                        {formData.images.length}/10 images
                      </Badge>
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">Upload Images</p>
                        <p className="text-sm text-muted-foreground">Drag and drop or click to select images</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Supported formats: JPG, PNG, WebP (max 5MB each)
                        </p>
                      </label>
                    </div>

                    {/* Image Preview Grid */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={URL.createObjectURL(image) || "/placeholder.svg"}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {index === 0 && <Badge className="absolute bottom-2 left-2 text-xs">Primary</Badge>}
                          </div>
                        ))}
                        {formData.images.length < 10 && (
                          <label
                            htmlFor="image-upload"
                            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                          >
                            <Plus className="h-8 w-8 text-muted-foreground" />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                {formData.images.length > 0 ? (
                  <img
                    src={URL.createObjectURL(formData.images[0]) || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Camera className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{formData.name || "Attraction Name"}</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.category ? categories.find(cat => cat.value === formData.category)?.label : "Category"}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{formData.address || "Address"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.openingHours || "Opening Hours"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>IDR {formData.price || "0"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Setup Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <p>Use high-quality, well-lit photos that showcase your attraction's best features.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p>Write a compelling description that highlights unique experiences.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <p>Accurate location data helps visitors find you easily.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <p>Keep pricing and hours updated to avoid visitor disappointment.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              Previous
            </Button>
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i + 1 <= currentStep ? "bg-primary" : "bg-muted-foreground/25"}`}
                />
              ))}
            </div>
            {currentStep < totalSteps ? (
              <Button onClick={nextStep} disabled={!isStepValid()}>
                Next Step
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!isStepValid() || loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {loading ? "Creating Attraction..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
