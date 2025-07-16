"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { touristApi, userApi } from "@/lib/api"
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Shield,
  CheckCircle,
  Star,
  Ticket,
  Phone,
  Loader2,
  Percent,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface BookingProps {
  attractionId: number
  onBack: () => void
}

export default function Booking({ attractionId, onBack }: BookingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [visitors, setVisitors] = useState(1)
  const [ticketType, setTicketType] = useState("")
  const [contactInfo, setContactInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Real attraction data from API
  const [attraction, setAttraction] = useState<any>(null)

  // Load attraction data
  useEffect(() => {
    const loadAttraction = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await touristApi.getAttraction(attractionId)
        if (response.success && response.data) {
          const attractionData = response.data
          
          // Transform API data to booking format
          const bookingAttraction = {
            id: attractionData.id,
            name: attractionData.name,
            image: attractionData.images?.[0]?.imageUrl || "/placeholder.svg",
            location: attractionData.address || "Location TBD",
            rating: attractionData.rating || 4.5,
            reviews: attractionData.totalVisits || 0,
            ticketTypes: [
              { 
                id: "regular", 
                name: "Regular Admission", 
                price: attractionData.price || 50000, 
                description: "Standard entry to the attraction" 
              },
              { 
                id: "guided", 
                name: "Guided Tour", 
                price: (attractionData.price || 50000) * 1.5, 
                description: "Guided tour with local expert" 
              },
              { 
                id: "premium", 
                name: "Premium Experience", 
                price: (attractionData.price || 50000) * 2, 
                description: "Premium access with special amenities" 
              },
            ],
            timeSlots: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
            availableDates: Array.from({ length: 30 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() + i + 1)
              return date
            }),
            description: attractionData.description,
            category: attractionData.category,
          }
          
          setAttraction(bookingAttraction)
        } else {
          throw new Error("Failed to load attraction details")
        }
      } catch (err) {
        console.error("Error loading attraction:", err)
        setError("Failed to load attraction details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (attractionId) {
      loadAttraction()
    }
  }, [attractionId])

  const steps = [
    { number: 1, title: "Select Date & Time", description: "Choose your visit date and time" },
    { number: 2, title: "Ticket Details", description: "Select tickets and visitors" },
    { number: 3, title: "Contact Info", description: "Provide your contact details" },
    { number: 4, title: "Payment", description: "Complete your booking" },
  ]

  const selectedTicket = attraction?.ticketTypes.find((t: any) => t.id === ticketType)
  const totalPrice = selectedTicket ? selectedTicket.price * visitors : 0
  const serviceFee = totalPrice * 0.05
  const discount = totalPrice > 200000 ? totalPrice * 0.1 : 0
  const finalTotal = totalPrice + serviceFee - discount

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedTicket) return
    
    setIsProcessing(true)
    try {
      // Create visit record in database
      const visitData = {
        attractionId: attraction.id,
        visitDate: selectedDate.toISOString().split('T')[0],
        visitTime: selectedTime,
        visitors: visitors,
        ticketType: ticketType,
        totalPrice: finalTotal,
        contactInfo: contactInfo,
        paymentMethod: paymentMethod,
        status: 'confirmed'
      }
      
      const response = await touristApi.recordVisit(visitData)
      
      if (response.success) {
        setBookingComplete(true)
      } else {
        throw new Error(response.message || "Booking failed")
      }
    } catch (err) {
      console.error("Booking error:", err)
      setError("Failed to complete booking. Please try again.")
      setIsProcessing(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Loading Attraction Details</h2>
            <p className="text-slate-600 dark:text-slate-400">Please wait while we prepare your booking...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !attraction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Unable to Load Booking</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error || "Failed to load attraction details for booking."}
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
              <Button onClick={onBack} variant="outline" className="w-full">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedDate && selectedTime
      case 2:
        return ticketType && visitors > 0
      case 3:
        return contactInfo.firstName && contactInfo.lastName && contactInfo.email && contactInfo.phone
      case 4:
        return paymentMethod
      default:
        return false
    }
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Booking Confirmed!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your booking for {attraction.name} has been successfully confirmed.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Booking ID:</span>
                  <span className="font-medium">#BK{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Date:</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Visitors:</span>
                  <span className="font-medium">{visitors}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total Paid:</span>
                  <span>IDR {finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <Button onClick={onBack} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              Back to Attraction
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Attraction
            </Button>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex">
                Step {currentStep} of 4
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <Card className="border-0 shadow-lg mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                          currentStep >= step.number
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
                        )}
                      >
                        {currentStep > step.number ? <CheckCircle className="h-5 w-5" /> : step.number}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            "w-12 sm:w-20 h-1 mx-2 transition-all",
                            currentStep > step.number ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700",
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{steps[currentStep - 1].title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{steps[currentStep - 1].description}</p>
                </div>
                <Progress value={(currentStep / 4) * 100} className="mt-4" />
              </CardContent>
            </Card>

            {/* Step Content */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                {/* Step 1: Date & Time */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Select Your Visit Date
                      </h3>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) =>
                          date < new Date() ||
                          !attraction.availableDates.some((d: Date) => d.toDateString() === date.toDateString())
                        }
                        className="rounded-md border"
                      />
                    </div>

                    {selectedDate && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                          Available Time Slots
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {attraction.timeSlots.map((time: string) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              onClick={() => setSelectedTime(time)}
                              className="h-12"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Ticket Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Ticket Type</h3>
                      <div className="space-y-3">
                        {attraction.ticketTypes.map((ticket: any) => (
                          <div
                            key={ticket.id}
                            className={cn(
                              "p-4 rounded-lg border-2 cursor-pointer transition-all",
                              ticketType === ticket.id
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300",
                            )}
                            onClick={() => setTicketType(ticket.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">{ticket.name}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                  IDR {ticket.price.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">per person</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {ticketType && (
                      <div>
                        <Label htmlFor="visitors" className="text-base font-medium">
                          Number of Visitors
                        </Label>
                        <Select value={visitors.toString()} onValueChange={(v) => setVisitors(Number.parseInt(v))}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
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
                    )}
                  </div>
                )}

                {/* Step 3: Contact Info */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={contactInfo.firstName}
                          onChange={(e) => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={contactInfo.lastName}
                          onChange={(e) => setContactInfo({ ...contactInfo, lastName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactInfo.email}
                          onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={contactInfo.phone}
                          onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                      <Textarea
                        id="specialRequests"
                        value={contactInfo.specialRequests}
                        onChange={(e) => setContactInfo({ ...contactInfo, specialRequests: e.target.value })}
                        placeholder="Any special requirements or requests..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payment Method</h3>
                    <div className="space-y-3">
                      {[
                        { id: "credit", name: "Credit/Debit Card", icon: CreditCard },
                        { id: "bank", name: "Bank Transfer", icon: Shield },
                        { id: "ewallet", name: "E-Wallet (GoPay, OVO, DANA)", icon: Phone },
                      ].map((method) => (
                        <div
                          key={method.id}
                          className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3",
                            paymentMethod === method.id
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300",
                          )}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <method.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium text-slate-900 dark:text-white">{method.name}</span>
                        </div>
                      ))}
                    </div>

                    {paymentMethod && (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                          <Shield className="h-4 w-4" />
                          <span className="text-sm font-medium">Secure Payment</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Your payment information is encrypted and secure. You will be redirected to complete the
                          payment after confirming your booking.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="gap-2">
                    Previous
                  </Button>
                  {currentStep < 4 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleBooking}
                      disabled={!canProceed() || isProcessing}
                      className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Attraction Summary */}
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={attraction.image || "/placeholder.svg"}
                      alt={attraction.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{attraction.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3" />
                        <span>{attraction.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{attraction.rating}</span>
                        <span className="text-slate-500">({attraction.reviews})</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Booking Details */}
                  <div className="space-y-3 text-sm">
                    {selectedDate && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Date</span>
                        </div>
                        <span className="font-medium">{format(selectedDate, "MMM dd, yyyy")}</span>
                      </div>
                    )}

                    {selectedTime && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span>Time</span>
                        </div>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                    )}

                    {ticketType && selectedTicket && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Ticket className="h-4 w-4" />
                          <span>Ticket</span>
                        </div>
                        <span className="font-medium">{selectedTicket.name}</span>
                      </div>
                    )}

                    {visitors > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Users className="h-4 w-4" />
                          <span>Visitors</span>
                        </div>
                        <span className="font-medium">{visitors}</span>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  {selectedTicket && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">
                            {selectedTicket.name} × {visitors}
                          </span>
                          <span>IDR {totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Service fee</span>
                          <span>IDR {serviceFee.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <div className="flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              <span>Discount (10%)</span>
                            </div>
                            <span>-IDR {discount.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold text-base">
                          <span>Total</span>
                          <span>IDR {finalTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm">Secure Booking</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Your booking is protected by our secure payment system and cancellation policy.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
