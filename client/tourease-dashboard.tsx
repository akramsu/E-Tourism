"use client"

import { Users, DollarSign, Clock, Star, TrendingUp, MapPin } from "lucide-react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { DashboardHeader } from "./components/dashboard-header"
import { MetricCard } from "./components/metric-card"
import { VisitorTrendsChart } from "./components/visitor-trends-chart"
import { RevenueChart } from "./components/revenue-chart"
import { DemographicsChart } from "./components/demographics-chart"
import { ThemeToggle } from "./components/theme-toggle"

const metrics = [
  {
    title: "Total Visitors",
    value: "28,945",
    change: "+12.5% from last month",
    trend: "up" as const,
    icon: Users,
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-600",
  },
  {
    title: "Revenue Generated",
    value: "$94,320",
    change: "+8.2% from last month",
    trend: "up" as const,
    icon: DollarSign,
    gradient: "bg-gradient-to-br from-purple-500 to-pink-600",
  },
  {
    title: "Avg Visit Duration",
    value: "2.4 hrs",
    change: "+15 min from last month",
    trend: "up" as const,
    icon: Clock,
    gradient: "bg-gradient-to-br from-green-500 to-emerald-600",
  },
  {
    title: "Satisfaction Score",
    value: "4.8/5",
    change: "+0.2 from last month",
    trend: "up" as const,
    icon: Star,
    gradient: "bg-gradient-to-br from-orange-500 to-red-600",
  },
  {
    title: "Peak Hours",
    value: "10AM-2PM",
    change: "Consistent pattern",
    trend: "up" as const,
    icon: TrendingUp,
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
  },
  {
    title: "Top Attraction",
    value: "City Museum",
    change: "35% of total visits",
    trend: "up" as const,
    icon: MapPin,
    gradient: "bg-gradient-to-br from-teal-500 to-blue-600",
  },
]

export default function TourEaseDashboard() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] w-full">
            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
              {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              <VisitorTrendsChart />
              <DemographicsChart />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <RevenueChart />
              <div className="col-span-2 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-2">Recent Alerts</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">High capacity at Central Park (95%)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Revenue target exceeded for Museums</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">New visitor trend detected</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Online Visitors</span>
                        <span className="text-sm font-medium">1,234</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Attractions</span>
                        <span className="text-sm font-medium">47/52</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Weather Impact</span>
                        <span className="text-sm font-medium text-green-600">Positive</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">System Status</span>
                        <span className="text-sm font-medium text-green-600">All Systems Operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <ThemeToggle />
    </SidebarProvider>
  )
}
