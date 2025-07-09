"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Upload } from "lucide-react"
import { Logo } from "@/components/ui/logo"

interface CompleteProfileProps {
  onComplete: () => void
}

export function CompleteProfile({ onComplete }: CompleteProfileProps) {
  const { user, updateUserProfile, error } = useAuth()
  const [formData, setFormData] = useState({
    phoneNumber: "",
    birthDate: "",
    postcode: "",
    gender: "",
    profileImage: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('Image file selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeKB: Math.round(file.size / 1024)
      })

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setLocalError('Image file is too large. Please choose an image smaller than 5MB.')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setLocalError('Please select a valid image file.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        
        console.log('Image converted to base64:', {
          originalSize: file.size,
          base64Size: result.length,
          base64SizeKB: Math.round(result.length / 1024),
          format: result.substring(0, 30)
        })
        
        // Additional check for base64 size (optimize for database limits)
        if (result.length > 2500000) { // ~1.8MB in base64 - more conservative limit
          // Instead of rejecting, we'll force compression
          console.log('Large image detected, will compress aggressively...')
        }
        
        // Compress image if needed
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Calculate new dimensions (more aggressive compression for large images)
          let { width, height } = img
          let maxSize = 1200
          
          // Use smaller dimensions for very large original images
          if (result.length > 2000000) { // If original is > ~1.5MB
            maxSize = 800 // Use smaller max size
          }
          if (result.length > 3000000) { // If original is > ~2.2MB
            maxSize = 600 // Use even smaller max size
          }
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width
              width = maxSize
            } else {
              width = (width * maxSize) / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress with very aggressive optimization for database limits
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Start with lower quality for larger images
          let quality = result.length > 1500000 ? 0.4 : 0.7
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          
          // Ensure we stay well under database limits (~1MB final size)
          const maxFinalSize = 1000000 // ~1MB - very conservative
          while (compressedDataUrl.length > maxFinalSize && quality > 0.1) {
            quality -= 0.05
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          }
          
          // If still too large, refuse the upload
          if (compressedDataUrl.length > maxFinalSize) {
            setLocalError('Image is too complex to compress sufficiently. Please choose a simpler image or reduce the resolution before uploading.')
            return
          }
          
          console.log('Image compressed:', {
            originalSize: result.length,
            compressedSize: compressedDataUrl.length,
            finalQuality: Math.round(quality * 100) + '%',
            compressionRatio: Math.round((1 - compressedDataUrl.length / result.length) * 100) + '%',
            finalSizeMB: Math.round(compressedDataUrl.length / 1024 / 1024 * 100) / 100
          })
          
          setFormData((prev) => ({ ...prev, profileImage: compressedDataUrl }))
          setLocalError(null) // Clear any previous errors
        }
        
        img.onerror = () => {
          setLocalError('Failed to process the image. Please try a different image.')
        }
        
        img.src = result
      }
      reader.onerror = () => {
        setLocalError('Failed to read the image file. Please try again.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setLocalError(null)

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        setLocalError('Authentication token not found. Please log in again.')
        setIsSubmitting(false)
        return
      }

      console.log('Current user:', user)
      console.log('Authentication token available:', !!token)

      // Prepare profile data - only include profileImage if it's base64 data
      const profileData: any = {
        phoneNumber: formData.phoneNumber,
        birthDate: formData.birthDate,
        postcode: formData.postcode,
        gender: formData.gender,
      }

      // Only include profileImage if user uploaded an actual image (starts with data:)
      if (formData.profileImage && formData.profileImage.startsWith('data:')) {
        profileData.profileImage = formData.profileImage
        console.log('Including profile image in submission:', {
          hasImage: true,
          imageSize: formData.profileImage.length,
          imageSizeKB: Math.round(formData.profileImage.length / 1024),
          imageFormat: formData.profileImage.substring(0, 30)
        })
      }

      console.log('Submitting profile data:', { 
        ...Object.fromEntries(
          Object.entries(profileData).map(([key, value]) => [
            key, 
            key === 'profileImage' && typeof value === 'string' ? 
              `base64 data (${Math.round(value.length / 1024)}KB)` : 
              value
          ])
        )
      })

      // Update user profile
      const success = await updateUserProfile(profileData)

      if (success) {
        console.log('Profile update successful, calling onComplete')
        onComplete()
      } else {
        // Handle error - show the actual error message from auth context
        const errorMessage = error || 'Profile update failed. Please try again.'
        setLocalError(errorMessage)
        console.error('Profile update failed:', errorMessage)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setLocalError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.phoneNumber && formData.birthDate && formData.postcode && formData.gender

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo size="lg" className="justify-center mb-4" />
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>Help us personalize your TourEase experience</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {(localError || error) && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{localError || error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {formData.profileImage && formData.profileImage.startsWith('data:') ? (
                    <AvatarImage src={formData.profileImage} alt="Profile" />
                  ) : null}
                  <AvatarFallback>
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">Upload your profile picture</p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                required
              />
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">Date of Birth</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                required
              />
            </div>

            {/* Postcode */}
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                type="text"
                placeholder="12345"
                value={formData.postcode}
                onChange={(e) => handleInputChange("postcode", e.target.value)}
                required
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? "Completing..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompleteProfile