"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Store,
  Brain,
  TrendingUp,
  Users,
  BarChart3,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

export function EnhancedFeaturesSection() {
  const mainFeatures = [
    {
      icon: Building2,
      title: "Tourism Authorities",
      description: "Comprehensive city-wide analytics, predictive insights, and attraction benchmarking",
      features: ["Multi-attraction analytics", "Predictive modeling", "Capacity optimization"],
      gradient: "from-blue-500 via-blue-600 to-cyan-500",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Store,
      title: "Attraction Owners",
      description: "Deep performance tracking, visitor profiling, and revenue optimization tools",
      features: ["Real-time performance", "Visitor demographics", "Revenue insights"],
      gradient: "from-purple-500 via-purple-600 to-pink-500",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning for natural language queries and automated insights",
      features: ["Natural language AI", "Automated reports", "Smart predictions"],
      gradient: "from-emerald-500 via-emerald-600 to-teal-500",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ]

  const benefits = [
    {
      icon: TrendingUp,
      title: "70% Faster Data Processing",
      description: "Automated data aggregation and real-time analytics processing",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      icon: BarChart3,
      title: "95% Forecast Accuracy",
      description: "AI-powered predictive analytics for visitor trends and revenue",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      icon: Users,
      title: "Unified Intelligence Hub",
      description: "All your tourism data centralized in one comprehensive platform",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with real-time threat detection and compliance",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    {
      icon: Globe,
      title: "Global Scalability",
      description: "Cloud infrastructure that scales from local attractions to entire cities",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      borderColor: "border-cyan-200 dark:border-cyan-800",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Sub-second query responses with edge computing and optimized databases",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
  ]

  return (
    <div className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mb-6 border border-blue-200 dark:border-blue-800">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">Powerful Features</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-8 text-slate-900 dark:text-white">
            Built for Every Tourism
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Professional
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            From individual attractions to entire cities, our platform adapts to your needs with cutting-edge technology
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {mainFeatures.map((feature, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group bg-white dark:bg-slate-800"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 dark:opacity-10`} />
              <CardContent className="relative p-8 h-full flex flex-col">
                <div
                  className={`${feature.iconBg} p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 flex-grow leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3 mb-6">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="group/btn border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className={`p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${benefit.bgColor} ${benefit.borderColor} border-2`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-lg mb-6">
                <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{benefit.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{benefit.description}</p>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm" />
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Tourism Data?</h3>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of tourism professionals already using TourEase to make data-driven decisions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-12 py-6 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-12 py-6 rounded-2xl font-semibold transition-all duration-300"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
