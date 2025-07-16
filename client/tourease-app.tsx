"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { EnhancedHeroSection } from "@/components/landing/enhanced-hero-section"
import { EnhancedFeaturesSection } from "@/components/landing/enhanced-features-section"
import { ModernFooter } from "@/components/landing/modern-footer"
import { SignInForm } from "@/components/auth/sign-in-form"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { CompleteProfile } from "@/pages/user/complete-profile"
import { AppSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { CityOverview } from "@/pages/authority/city-overview"
import { PredictiveAnalytics } from "@/pages/authority/predictive-analytics"
import { AttractionComparison } from "@/pages/authority/attraction-comparison"
import { DemographicInsights } from "@/pages/authority/demographic-insights"
import { ReportsManagement } from "@/pages/authority/reports-management"
import { AlertConfiguration } from "@/pages/authority/alert-configuration"
import { SearchData } from "@/pages/authority/search-data"
import { AIChat } from "@/pages/authority/ai-chat"
import AuthorityProfile from "@/pages/authority/profile"
import { PerformanceOverview } from "@/pages/owner/performance-overview"
import { VisitorAnalysis } from "@/pages/owner/visitor-analysis"
import { ForecastsPlanning } from "@/pages/owner/forecasts-planning"
import { OwnerProfile } from "@/pages/owner/profile"
import { OwnerReports } from "@/pages/owner/reports"
import { CreateAttraction } from "@/pages/owner/create-attraction"
import { ManageAttraction } from "@/pages/owner/manage-attraction"

// Tourist Components
import TouristNavigationHeader from "@/components/tourist/tourist-navigation-header"
import TouristDashboard from "@/pages/tourist/dashboard"
import AttractionDetails from "@/pages/tourist/attraction-details"
import SearchResults from "@/pages/tourist/search-results"
import UserProfile from "@/pages/tourist/user-profile"
import Recommendations from "@/pages/tourist/recommendations"
import EventsActivities from "@/pages/tourist/events-activities"
import Booking from "@/pages/tourist/booking"

type Page = "landing" | "signin" | "signup" | "dashboard"

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("landing")
  const [dashboardPage, setDashboardPage] = useState("Dashboard")
  const [selectedAttractionId, setSelectedAttractionId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, needsProfileCompletion, needsAttractionCreation, markAttractionCreated } = useAuth()

  // Handle navigation after authentication
  useEffect(() => {
    if (user && currentPage !== "dashboard") {
      setCurrentPage("dashboard")
    }
  }, [user, currentPage])

  const handleProfileCompleted = () => {
    // After profile completion, proceed to normal flow
    if (user?.role.roleName === "OWNER") {
      setDashboardPage("Performance Overview")
    } else if (user?.role.roleName === "AUTHORITY") {
      setDashboardPage("City Overview")
    } else if (user?.role.roleName === "TOURIST") {
      setDashboardPage("Dashboard")
    }
  }

  // Auto-redirect logic
  if (user && currentPage !== "dashboard") {
    // If user needs to complete profile, handle that first
    if (needsProfileCompletion) {
      // Show profile completion page instead of regular dashboard
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
          <CompleteProfile onComplete={handleProfileCompleted} />
          <ThemeToggle />
        </div>
      )
    }
    
    setCurrentPage("dashboard")
    if (user.role.roleName === "AUTHORITY") {
      setDashboardPage("City Overview")
    } else if (user.role.roleName === "OWNER") {
      setDashboardPage("Performance Overview")
    } else if (user.role.roleName === "TOURIST") {
      setDashboardPage("Dashboard")
    }
  }

  const handleTouristPageChange = (page: string) => {
    setDashboardPage(page)
    setSelectedAttractionId(null)
  }

  const handleAttractionSelect = (attractionId: number) => {
    setSelectedAttractionId(attractionId)
    setDashboardPage("Attraction Details")
  }

  const handleBackFromDetails = () => {
    setSelectedAttractionId(null)
    setDashboardPage("Search Results")
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setDashboardPage("Search Results")
  }

  const handleProfileClick = () => {
    setDashboardPage("Profile")
  }

  const handleProfileComplete = () => {
    // Profile completion finished - user will automatically proceed to next step
    // The useAuth context will handle updating needsProfileCompletion state
  }

  const handleAttractionCreated = () => {
    // Mark attraction creation as complete
    markAttractionCreated()
    // Attraction created successfully - redirect to performance overview
    setDashboardPage("Performance Overview")
  }

  const handleBookNow = (attractionId: number) => {
    setSelectedAttractionId(attractionId)
    setDashboardPage("Booking")
  }

  const handleBackFromBooking = () => {
    setDashboardPage("Attraction Details")
  }

  const renderTouristContent = () => {
    switch (dashboardPage) {
      case "Dashboard":
        return <TouristDashboard onPageChange={handleTouristPageChange} onAttractionSelect={handleAttractionSelect} />
      case "Search Results":
        return <SearchResults onAttractionSelect={handleAttractionSelect} searchQuery={searchQuery} />
      case "Attraction Details":
        return selectedAttractionId ? (
          <AttractionDetails
            attractionId={selectedAttractionId}
            onBack={handleBackFromDetails}
            onAttractionSelect={handleAttractionSelect}
            onBookNow={handleBookNow}
          />
        ) : (
          <TouristDashboard onPageChange={handleTouristPageChange} onAttractionSelect={handleAttractionSelect} />
        )
      case "Booking":
        return selectedAttractionId ? (
          <Booking attractionId={selectedAttractionId} onBack={handleBackFromBooking} />
        ) : (
          <TouristDashboard onPageChange={handleTouristPageChange} onAttractionSelect={handleAttractionSelect} />
        )
      case "User Profile":
        return <UserProfile onAttractionSelect={handleAttractionSelect} />
      case "Recommendations":
        return <Recommendations onAttractionSelect={handleAttractionSelect} />
      case "Events & Activities":
        return <EventsActivities onEventSelect={(eventId) => console.log("Selected event:", eventId)} />
      default:
        return <TouristDashboard onPageChange={handleTouristPageChange} onAttractionSelect={handleAttractionSelect} />
    }
  }

  const renderDashboardContent = () => {
    if (user?.role.roleName === "AUTHORITY") {
      switch (dashboardPage) {
        case "City Overview":
          return <CityOverview />
        case "Predictive Analytics":
          return <PredictiveAnalytics />
        case "Attraction Comparison":
          return <AttractionComparison />
        case "Demographic Insights":
          return <DemographicInsights />
        case "Reports Management":
          return <ReportsManagement />
        case "Alert Configuration":
          return <AlertConfiguration />
        case "Search Data":
          return <SearchData />
        case "AI Chat":
          return <AIChat />
        case "Profile":
          return <AuthorityProfile />
        default:
          return <CityOverview />
      }
    } else if (user?.role.roleName === "OWNER") {
      // Owner dashboard - for now, always show normal dashboard
      switch (dashboardPage) {
        case "Performance Overview":
          return <PerformanceOverview />
        case "Create Attraction":
          return <CreateAttraction onAttractionCreated={handleAttractionCreated} />
        case "Manage Attraction":
          return <ManageAttraction />
        case "Visitor Analysis":
          return <VisitorAnalysis />
        case "Forecasts & Planning":
          return <ForecastsPlanning />
        case "Reports":
          return <OwnerReports />
        case "Profile":
          return <OwnerProfile />
        case "Settings":
          return <div className="p-4 sm:p-8 text-center text-muted-foreground">Attraction Settings - Coming Soon</div>
        default:
          return <PerformanceOverview />
      }
    }
  }

  const getPageTitle = () => {
    if (user?.role.roleName === "AUTHORITY") {
      return dashboardPage === "City Overview" ? "City Analytics Dashboard" : dashboardPage
    } else if (user?.role.roleName === "OWNER") {
      return dashboardPage === "Performance Overview" ? "Attraction Performance Dashboard" : dashboardPage
    }
    return "Tourist Dashboard"
  }

  const getPageSubtitle = () => {
    if (user?.role.roleName === "AUTHORITY") {
      return "City-wide tourism insights powered by real-time database analytics"
    } else if (user?.role.roleName === "OWNER") {
      return "Real-time attraction performance metrics from integrated database"
    }
    return "Discover amazing destinations across Indonesia"
  }

  if (currentPage === "landing") {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <EnhancedHeroSection onSignIn={() => setCurrentPage("signin")} onSignUp={() => setCurrentPage("signup")} />
          <EnhancedFeaturesSection />
        </div>
        <ModernFooter />
        <ThemeToggle />
      </div>
    )
  }

  if (currentPage === "signin") {
    return <SignInForm onBack={() => setCurrentPage("landing")} onSignUp={() => setCurrentPage("signup")} />
  }

  if (currentPage === "signup") {
    return <SignUpForm onBack={() => setCurrentPage("landing")} onSignIn={() => setCurrentPage("signin")} />
  }

  if (currentPage === "dashboard" && user) {
    // Handle profile completion for new users
    if (needsProfileCompletion) {
      return <CompleteProfile onComplete={handleProfileComplete} />
    }

    // Handle attraction creation for new owners
    if (needsAttractionCreation && user.role.roleName === "OWNER") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Welcome to TourEase! 🎉
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-2">
                  Let's get started by adding your first attraction
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You can always add more attractions later from your dashboard
                </p>
              </div>
              <CreateAttraction onAttractionCreated={handleAttractionCreated} />
            </div>
          </div>
          <ThemeToggle />
        </div>
      )
    }

    // Tourist Interface
    if (user.role.roleName === "TOURIST") {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <TouristNavigationHeader
            currentPage={dashboardPage}
            onPageChange={handleTouristPageChange}
            onSearch={handleSearch}
          />
          <div>{renderTouristContent()}</div>
          <ThemeToggle />
        </div>
      )
    }

    // Authority/Owner Interface
    return (
      <SidebarProvider>
        {/* Show sidebar for authority and owner users */}
        {user.role.roleName === "AUTHORITY" || user.role.roleName === "OWNER" ? (
          <AppSidebar currentPage={dashboardPage} onPageChange={setDashboardPage} />
        ) : null}
        <SidebarInset>
          <DashboardHeader title={getPageTitle()} subtitle={getPageSubtitle()} onProfileClick={handleProfileClick} />
          <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-2 sm:p-4 pt-0">
            <div className="min-h-[100vh] w-full">{renderDashboardContent()}</div>
          </div>
        </SidebarInset>
        <ThemeToggle />
      </SidebarProvider>
    )
  }

  return null
}

export default function TourEaseApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
