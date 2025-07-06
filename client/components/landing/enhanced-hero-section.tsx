"use client"

import { Button } from "@/components/ui/button"
import { BarChart3, MapPin, TrendingUp, Users, Brain, Zap, ArrowRight, Play, Star, Sparkles } from "lucide-react"
import { AnimatedBackground } from "@/components/ui/animated-background"

interface EnhancedHeroSectionProps {
  onSignIn: () => void
  onSignUp: () => void
}

export function EnhancedHeroSection({ onSignIn, onSignUp }: EnhancedHeroSectionProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 dark:from-slate-900 dark:via-purple-900/50 dark:to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Enhanced Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-blue-400/30 to-purple-400/30 dark:from-blue-500/40 dark:to-purple-500/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-400/30 to-pink-400/30 dark:from-purple-500/40 dark:to-pink-500/40 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 dark:from-cyan-500/30 dark:to-blue-500/30 rounded-full blur-3xl" />

      {/* Floating Icons with better contrast */}
      <div className="absolute top-20 left-4 sm:left-20 text-blue-300/40 dark:text-blue-400/30 animate-float">
        <BarChart3 size={40} className="sm:w-20 sm:h-20" />
      </div>
      <div className="absolute top-40 right-8 sm:right-32 text-purple-300/40 dark:text-purple-400/30 animate-float delay-1000">
        <MapPin size={30} className="sm:w-15 sm:h-15" />
      </div>
      <div className="absolute bottom-32 left-8 sm:left-32 text-emerald-300/40 dark:text-emerald-400/30 animate-float delay-2000">
        <TrendingUp size={35} className="sm:w-17 sm:h-17" />
      </div>
      <div className="absolute bottom-20 right-4 sm:right-20 text-cyan-300/40 dark:text-cyan-400/30 animate-float delay-500">
        <Users size={32} className="sm:w-16 sm:h-16" />
      </div>

      {/* Sparkle Effects */}
      <div className="absolute top-1/3 left-1/3 text-yellow-400/60 animate-pulse">
        <Sparkles size={20} />
      </div>
      <div className="absolute top-2/3 right-1/3 text-yellow-400/60 animate-pulse delay-1000">
        <Sparkles size={16} />
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Enhanced Badge with Rating */}
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-xl mb-6 sm:mb-8">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
            ))}
          </div>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-slate-800 dark:text-slate-200 text-sm font-semibold">
            Rated #1 Tourism Analytics Platform
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8 leading-tight">
          Transform Tourism
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Management
          </span>
          <br />
          <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-700 dark:text-slate-300">
            with AI Intelligence
          </span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto font-medium">
          Unlock the power of comprehensive analytics to optimize visitor experiences, maximize revenue, and make
          data-driven decisions for tourism authorities and attraction owners
        </p>

        {/* Enhanced Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          {[
            {
              icon: Brain,
              text: "AI Insights",
              color: "from-purple-500 to-purple-600",
              bg: "bg-purple-50 dark:bg-purple-900/20",
            },
            {
              icon: BarChart3,
              text: "Real-time Analytics",
              color: "from-blue-500 to-blue-600",
              bg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              icon: TrendingUp,
              text: "Predictive Modeling",
              color: "from-emerald-500 to-emerald-600",
              bg: "bg-emerald-50 dark:bg-emerald-900/20",
            },
            {
              icon: Users,
              text: "Visitor Intelligence",
              color: "from-amber-500 to-amber-600",
              bg: "bg-amber-50 dark:bg-amber-900/20",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 px-6 py-3 ${feature.bg} backdrop-blur-xl rounded-full border border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
            >
              <div
                className={`p-1.5 rounded-full bg-gradient-to-r ${feature.color} group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-slate-700 dark:text-slate-200 text-sm sm:text-base font-semibold">
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <Button
            size="lg"
            onClick={onSignIn}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 border-0 group"
          >
            Start Analyzing
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSignUp}
            className="border-2 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-500 dark:hover:border-slate-400 text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-semibold shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-xl group bg-white/80 dark:bg-slate-800/80"
          >
            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Schedule Demo
          </Button>
        </div>

        {/* Enhanced Statistics */}
        <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 sm:mt-20 max-w-4xl mx-auto">
          {[
            {
              value: "50K+",
              label: "Data Points Analyzed",
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              value: "99.9%",
              label: "Prediction Accuracy",
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-900/20",
            },
            {
              value: "24/7",
              label: "Real-time Monitoring",
              color: "text-purple-600 dark:text-purple-400",
              bg: "bg-purple-50 dark:bg-purple-900/20",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`text-center group p-6 rounded-2xl ${stat.bg} backdrop-blur-sm border border-white/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300`}
            >
              <div
                className={`text-2xl sm:text-4xl md:text-5xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform`}
              >
                {stat.value}
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Trusted by leading organizations:
          </div>
          <div className="flex items-center gap-6">
            {["Tourism Board", "City Council", "Attractions Inc", "Visit Bureau"].map((org, index) => (
              <div key={index} className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                {org}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/80 to-transparent dark:from-slate-900/80 dark:to-transparent" />
    </div>
  )
}
