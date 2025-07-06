"use client"

import { Button } from "@/components/ui/button"
import { BarChart3, MapPin, TrendingUp, Users } from "lucide-react"

interface HeroSectionProps {
  onSignIn: () => void
  onSignUp: () => void
}

export function HeroSection({ onSignIn, onSignUp }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-900 dark:via-purple-900 dark:to-cyan-900">
      {/* Background Icons */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 text-white/10 dark:text-white/5">
          <BarChart3 size={120} />
        </div>
        <div className="absolute top-40 right-32 text-white/10 dark:text-white/5">
          <MapPin size={80} />
        </div>
        <div className="absolute bottom-32 left-32 text-white/10 dark:text-white/5">
          <TrendingUp size={100} />
        </div>
        <div className="absolute bottom-20 right-20 text-white/10 dark:text-white/5">
          <Users size={90} />
        </div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Transform Tourism Management with{" "}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Data-Driven Insights
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
          Centralized analytics platform for tourism authorities and attraction owners to optimize visitor experiences
          and maximize revenue
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={onSignIn}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            Sign In
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSignUp}
            className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  )
}
