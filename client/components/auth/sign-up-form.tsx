"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { Logo } from "@/components/ui/logo"
import {
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Facebook,
  Chrome,
} from "lucide-react"

interface SignUpFormProps {
  onBack: () => void
  onSignIn: () => void
}

export function SignUpForm({ onBack, onSignIn }: SignUpFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"owner" | "tourist">("tourist")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { register, roles } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      return
    }
    
    // Basic validation
    if (!name.trim()) {
      setError("Name is required")
      return
    }
    
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters long")
      return
    }
    
    if (!email.trim()) {
      setError("Email is required")
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address")
      return
    }
    
    if (!password.trim()) {
      setError("Password is required")
      return
    }
    
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Convert role to uppercase format expected by backend
      const roleForBackend = role.toUpperCase() as "OWNER" | "TOURIST"
      const success = await register(name, email, password, roleForBackend)
      
      if (success) {
        setSuccess(true)
        setError("")
        // Redirect will be handled by the auth context
      } else {
        setError("Registration failed. Please try again.")
      }
    } catch (error: any) {
      console.error("Registration failed:", error)
      setError("Registration failed. Please check your information and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`)
    // Implement social login logic here
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-2xl"></div>

          {/* Animated elements */}
          <div className="absolute top-1/4 right-1/3 w-16 h-16 bg-cyan-400 rounded-full blur-xl animate-pulse"></div>
          <div
            className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-pink-300 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "1.5s" }}
          ></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Logo size="lg" className="brightness-0 invert" />
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">Join thousands of tourism professionals</h2>
            <p className="text-purple-100 text-lg leading-relaxed">
              Start your journey with powerful analytics, AI-driven insights, and comprehensive tourism data management.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4 mt-8">
            {[
              { icon: Users, text: "Join 500+ cities worldwide" },
              { icon: TrendingUp, text: "Increase revenue by 30% on average" },
              { icon: Shield, text: "Enterprise-grade security" },
              { icon: Zap, text: "Real-time analytics & insights" },
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-white/90">
                <benefit.icon className="w-5 h-5" />
                <span className="text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-purple-100 text-sm">
            "TourEase transformed how we understand our visitors. The insights are incredible!"
          </p>
          <p className="text-white font-medium text-sm mt-2">Tourism Director</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Logo size="md" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create your account</h2>
            <p className="text-slate-600 dark:text-slate-300">Join the tourism intelligence revolution</p>
          </div>

          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
            <CardHeader className="text-center pb-6">
              <div className="hidden lg:block">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
                  Join the tourism intelligence revolution
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}
                
                {/* Success Message */}
                {success && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-600 dark:text-green-400 text-sm">Registration successful! Redirecting...</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 dark:text-slate-200 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (error) setError("")
                    }}
                    required
                    className="h-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-purple-500 dark:focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError("")
                    }}
                    required
                    className="h-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-purple-500 dark:focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error) setError("")
                      }}
                      required
                      className="h-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-purple-500 dark:focus:border-purple-400 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Must be at least 6 characters with numbers and letters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-700 dark:text-slate-200 font-medium">
                    Account Type
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Choose your account type
                  </p>
                  <Select value={role} onValueChange={(value: "owner" | "tourist") => setRole(value)}>
                    <SelectTrigger className="h-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-purple-500 dark:focus:border-purple-400">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Attraction Owner</SelectItem>
                      <SelectItem value="tourist">Tourist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 rounded border-slate-300 dark:border-slate-600"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    I agree to the{" "}
                    <a href="#terms" className="text-purple-600 dark:text-purple-400 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#privacy" className="text-purple-600 dark:text-purple-400 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={loading || !acceptTerms}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative">
                <Separator className="bg-slate-200 dark:bg-slate-700" />
                <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 px-3 text-sm text-slate-500 dark:text-slate-400">
                  or continue with
                </span>
              </div>

              {/* Social Login Buttons - Moved to bottom */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => handleSocialLogin("google")}
                >
                  <Chrome className="w-5 h-5 mr-3 text-indigo-600" />
                  <span className="text-slate-700 dark:text-slate-200">Continue with Google</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={() => handleSocialLogin("facebook")}
                >
                  <Facebook className="w-5 h-5 mr-3 text-indigo-600" />
                  <span className="text-slate-700 dark:text-slate-200">Continue with Facebook</span>
                </Button>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Already have an account?{" "}
                  <button
                    onClick={onSignIn}
                    className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Protected by enterprise-grade security. Your data is encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
