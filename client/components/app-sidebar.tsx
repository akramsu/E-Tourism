"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Building2,
  Calendar,
  FileText,
  Home,
  MapPin,
  Settings,
  TrendingUp,
  Users,
  Bell,
  Search,
  Filter,
  User,
  ChevronUp,
  AlertTriangle,
  Activity,
  Loader2,
  Plus,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { ownerApi, authorityApi, alertsApi } from "@/lib/api"
import { Logo } from "@/components/ui/logo"

interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType<any>
  isActive?: boolean
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

interface SidebarStats {
  unreadNotifications: number
  pendingReports: number
  activeAlerts: number
  recentActivity: number
  attractionStatus?: 'active' | 'inactive' | 'pending'
  totalAttractions?: number
}

interface AppSidebarProps {
  currentPage?: string
  onPageChange?: (page: string) => void
}

export function AppSidebar({ currentPage, onPageChange, ...props }: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const [sidebarStats, setSidebarStats] = useState<SidebarStats>({
    unreadNotifications: 0,
    pendingReports: 0,
    activeAlerts: 0,
    recentActivity: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch live sidebar statistics
  useEffect(() => {
    const fetchSidebarStats = async () => {
      if (!user?.role?.roleName) return
      
      try {
        setIsLoading(true)
        const userRole = user.role.roleName.toLowerCase()
        
        let stats: SidebarStats = {
          unreadNotifications: 0,
          activeAlerts: 0,
          pendingReports: 0,
          recentActivity: 0,
        }

        // Get notifications and alerts (with fallback if API doesn't exist)
        try {
          const [notificationsResponse, alertsResponse] = await Promise.all([
            alertsApi.getAlerts({ resolved: false, limit: 50 }).catch(() => ({ data: [] })),
            alertsApi.getAlerts({ limit: 100 }).catch(() => ({ data: [] }))
          ])
          
          stats.unreadNotifications = notificationsResponse.data?.filter((alert: any) => !alert.alertResolved).length || 0
          stats.activeAlerts = alertsResponse.data?.filter((alert: any) => !alert.alertResolved).length || 0
        } catch (error) {
          console.log('Alerts API not available, using fallback values')
          // Fallback values for alerts
          stats.unreadNotifications = 0
          stats.activeAlerts = 0
        }

        if (userRole === 'authority') {
          // Get authority-specific stats
          const [reportsResponse, cityMetricsResponse, attractionsResponse] = await Promise.all([
            authorityApi.getReports({ limit: 10 }).catch(() => ({ data: [] })),
            authorityApi.getCityMetrics({ period: 'week' }).catch(() => ({ data: null })),
            authorityApi.getAllAttractions({ limit: 100 }).catch(() => ({ data: [] }))
          ])
          
          stats.pendingReports = reportsResponse.data?.filter((report: any) => report.status === 'pending').length || 0
          stats.recentActivity = cityMetricsResponse.data?.recentActivityCount || 0
          stats.totalAttractions = attractionsResponse.data?.length || 0
        } else if (userRole === 'owner') {
          // Get owner-specific stats
          const [attractionResponse, reportsResponse] = await Promise.all([
            ownerApi.getMyAttraction().catch(() => ({ data: null })),
            ownerApi.getReports(0, { limit: 10, status: 'pending' }).catch(() => ({ data: [] }))
          ])
          
          stats.attractionStatus = attractionResponse.data?.status || 'inactive'
          stats.pendingReports = reportsResponse.data?.length || 0
          stats.recentActivity = attractionResponse.data?.recentVisits || 0
        }
        
        setSidebarStats(stats)
      } catch (error) {
        console.error('Error fetching sidebar stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSidebarStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchSidebarStats, 30000)
    return () => clearInterval(interval)
  }, [user?.role?.roleName])

  // Generate menu items with live badges based on user role
  const getMenuItemsWithBadges = (): MenuItem[] => {
    const userRole = user?.role?.roleName?.toLowerCase()
    
    if (userRole === 'authority') {
      const baseItems = [
        { title: "City Overview", url: "#", icon: Home },
        { title: "City Analytics", url: "#", icon: MapPin },
        { title: "Attraction Comparison", url: "#", icon: BarChart3 },
        { title: "Predictive Analytics", url: "#", icon: TrendingUp },
        { title: "Demographic Insights", url: "#", icon: Users },
        { title: "Reports Management", url: "#", icon: FileText },
        { title: "Alert Configuration", url: "#", icon: Bell },
      ]
      
      return baseItems.map(item => {
        let badge: string | undefined
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary"
        const isActive = currentPage === item.title

        switch (item.title) {
          case "City Overview":
            if (sidebarStats.activeAlerts > 0) {
              badge = sidebarStats.activeAlerts.toString()
              badgeVariant = "destructive"
            }
            break
          case "City Analytics":
            if (sidebarStats.totalAttractions && sidebarStats.totalAttractions > 0) {
              badge = "Live"
              badgeVariant = "default"
            }
            break
          case "Predictive Analytics":
            if (sidebarStats.recentActivity > 5) {
              badge = sidebarStats.recentActivity.toString()
              badgeVariant = "default"
            }
            break
          case "Reports Management":
            if (sidebarStats.pendingReports > 0) {
              badge = sidebarStats.pendingReports.toString()
              badgeVariant = "default"
            }
            break
          case "Alert Configuration":
            if (sidebarStats.unreadNotifications > 0) {
              badge = sidebarStats.unreadNotifications.toString()
              badgeVariant = "destructive"
            }
            break
          default:
            break
        }

        return { ...item, badge, badgeVariant, isActive }
      })
    } else {
      // Owner menu items
      const baseItems = [
        { title: "Performance Overview", url: "#", icon: Home },
        { title: "Create Attraction", url: "#", icon: Plus },
        { title: "Manage Attraction", url: "#", icon: Building2 },
        { title: "Visitor Analysis", url: "#", icon: Users },
        { title: "Revenue Analytics", url: "#", icon: BarChart3 },
        { title: "Forecasts & Planning", url: "#", icon: Calendar },
        { title: "Reports", url: "#", icon: FileText },
        { title: "Settings", url: "#", icon: Settings },
      ]
      
      return baseItems.map(item => {
        let badge: string | undefined
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary"
        const isActive = currentPage === item.title

        switch (item.title) {
          case "Performance Overview":
            if (sidebarStats.attractionStatus === 'pending') {
              badge = "!"
              badgeVariant = "destructive"
            } else if (sidebarStats.recentActivity > 0) {
              badge = "•"
              badgeVariant = "default"
            }
            break
          case "Manage Attraction":
            if (sidebarStats.attractionStatus === 'pending') {
              badge = "Action"
              badgeVariant = "destructive"
            } else if (sidebarStats.attractionStatus === 'active') {
              badge = "Live"
              badgeVariant = "default"
            }
            break
          case "Visitor Analysis":
            if (sidebarStats.recentActivity > 10) {
              badge = "New"
              badgeVariant = "default"
            }
            break
          case "Revenue Analytics":
            if (sidebarStats.recentActivity > 5) {
              badge = "Updated"
              badgeVariant = "default"
            }
            break
          case "Reports":
            if (sidebarStats.pendingReports > 0) {
              badge = sidebarStats.pendingReports.toString()
              badgeVariant = "default"
            }
            break
          default:
            break
        }

        return { ...item, badge, badgeVariant, isActive }
      })
    }
  }

  // Generate quick actions with live data
  const getQuickActions = (): MenuItem[] => {
    const userRole = user?.role?.roleName?.toLowerCase()
    
    if (userRole === 'authority') {
      return [
        {
          title: "Search Data",
          url: "#",
          icon: Search
        },
        {
          title: "Apply Filters", 
          url: "#",
          icon: Filter
        },
        {
          title: "Live Alerts",
          url: "#",
          icon: sidebarStats.activeAlerts > 0 ? AlertTriangle : Bell,
          badge: sidebarStats.unreadNotifications > 0 ? sidebarStats.unreadNotifications.toString() : undefined,
          badgeVariant: sidebarStats.activeAlerts > 0 ? "destructive" : "default"
        }
      ]
    }
    
    return []
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarUrl = (user: any) => {
    // Use the user's uploaded profile picture if available
    if (user?.profilePicture && user.profilePicture.startsWith('data:image/')) {
      return user.profilePicture
    }
    
    // Fallback to generated avatar if no profile picture
    const seed = user?.username?.toLowerCase().replace(/\s+/g, "") || "user"
    const role = user?.role?.roleName || "TOURIST"
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${role === "AUTHORITY" ? "3b82f6" : "10b981"}`
  }

  const hasCustomAvatar = (user: any) => {
    return user?.profilePicture && user.profilePicture.startsWith('data:image/')
  }

  const menuItems = getMenuItemsWithBadges()
  const quickActions = getQuickActions()
  const userRole = user?.role?.roleName?.toLowerCase()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Logo className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">TourEase</span>
            <span className="truncate text-xs text-muted-foreground">
              {userRole === "authority" ? "Tourism Authority" : "Attraction Management"}
            </span>
          </div>
        </div>
        {/* User Status Indicator */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <div className={`h-2 w-2 rounded-full ${
              user?.role?.roleName === 'AUTHORITY' ? 'bg-blue-500' : 
              user?.role?.roleName === 'OWNER' ? 'bg-green-500' : 'bg-gray-500'
            }`} />
            <span className="text-xs font-medium">
              {user?.username || 'Loading...'}
            </span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {userRole === "authority" ? "Tourism Authority" : "Attraction Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={item.isActive}
                    onClick={() => onPageChange?.(item.title)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.badgeVariant || "secondary"} 
                        className="ml-auto text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {isLoading && item.title === "City Overview" && (
                      <Activity className="h-3 w-3 animate-pulse ml-auto text-muted-foreground" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {userRole === "authority" && quickActions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickActions.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badgeVariant || "default"} 
                            className="ml-auto text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {userRole === "owner" && sidebarStats.attractionStatus && (
          <SidebarGroup>
            <SidebarGroupLabel>Attraction Status</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        sidebarStats.attractionStatus === 'active' ? 'bg-green-500' :
                        sidebarStats.attractionStatus === 'pending' ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`} />
                      <span className="text-sm capitalize">{sidebarStats.attractionStatus}</span>
                      {sidebarStats.attractionStatus === 'pending' && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          Action Needed
                        </Badge>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {sidebarStats.recentActivity > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm">Recent Activity</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {sidebarStats.recentActivity}
                        </Badge>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage 
                      src={getAvatarUrl(user)} 
                      alt="User Avatar"
                      className={hasCustomAvatar(user) ? "object-cover" : ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.username ? getInitials(user.username) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.username || "Loading..."}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || `${userRole}@tourease.com`}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="p-4 text-center text-xs text-muted-foreground">© 2024 TourEase Analytics</div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
