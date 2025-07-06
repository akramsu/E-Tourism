"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Building2, Store, Brain, TrendingUp, Users, BarChart3 } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Building2,
      title: "For Tourism Authorities",
      description: "City-wide analytics, predictive insights, attraction benchmarking",
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-600",
    },
    {
      icon: Store,
      title: "For Attraction Owners",
      description: "Performance tracking, visitor profiling, revenue optimization",
      gradient: "bg-gradient-to-br from-purple-500 to-pink-600",
    },
    {
      icon: Brain,
      title: "AI-Powered",
      description: "LLM integration for natural language queries and automated insights",
      gradient: "bg-gradient-to-br from-green-500 to-emerald-600",
    },
  ]

  const benefits = [
    {
      icon: TrendingUp,
      title: "Reduce data collection time by 70%",
      description: "Automated data aggregation from multiple sources",
    },
    {
      icon: BarChart3,
      title: "Increase forecast accuracy",
      description: "AI-powered predictive analytics for visitor trends",
    },
    {
      icon: Users,
      title: "Centralized tourism intelligence hub",
      description: "All your tourism data in one comprehensive platform",
    },
  ]

  return (
    <div className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Powerful Features for Every User
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're managing city-wide tourism or a single attraction, TourEase provides the insights you need
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`absolute inset-0 ${feature.gradient} opacity-90`} />
              <CardContent className="relative p-8 text-white text-center">
                <div className="bg-white/20 p-4 rounded-full w-16 h-16 mx-auto mb-6 backdrop-blur-sm">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-white/90">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-8 text-center hover:shadow-lg transition-all duration-300">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-6">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
