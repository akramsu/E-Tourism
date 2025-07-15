"use client"
import { useState, useEffect } from "react"
import {
  BarChart3,
  Building2,
  Calendar,
  FileText,
  Home,
  Settings,
  TrendingUp,
  Users,
  Bell,
  Search,
  Filter,
  AlertTriangle,
  Activity,
  Sparkles,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Logo } from "@/components/ui/logo"
import { ownerApi, authorityApi, alertsApi } from "@/lib/api"

interface MenuItem {
  title: string
  page: string
  icon: React.ComponentType<any>
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

interface SidebarStats {
  unreadNotifications: number
  pendingReports: number
  activeAlerts: number
  recentActivity: number
  attractionStatus?: 'active' | 'inactive' | 'pending'
}

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  onProfileClick?: () => void
}

export function AppSidebar({ currentPage, onPageChange, onProfileClick }: AppSidebarProps) {
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
        
        // Get notifications and alerts with fallback
        let stats: SidebarStats = {
          unreadNotifications: 0,
          activeAlerts: 0,
          pendingReports: 0,
          recentActivity: 0,
        }

        try {
          const [notificationsResponse, alertsResponse] = await Promise.all([
            alertsApi.getAlerts({ resolved: false, limit: 50 }),
            alertsApi.getAlerts({ limit: 100 })
          ])
          
          stats.unreadNotifications = notificationsResponse.data?.filter((alert: any) => !alert.alertResolved).length || 0
          stats.activeAlerts = alertsResponse.data?.filter((alert: any) => !alert.alertResolved).length || 0
        } catch (alertError) {
          console.warn('Alerts API not available, using default values:', alertError)
          // Keep default values (0) for alerts
        }

        if (userRole === 'authority') {
          // Get authority-specific stats
          const [reportsResponse, cityMetricsResponse] = await Promise.all([
            authorityApi.getReports({ limit: 10 }),
            authorityApi.getCityMetrics({ period: 'week' })
          ])
          
          stats.pendingReports = reportsResponse.data?.filter((report: any) => report.status === 'pending').length || 0
          stats.recentActivity = cityMetricsResponse.data?.recentActivityCount || 0
        } else if (userRole === 'owner') {
          // Get owner-specific stats
          const [attractionResponse, reportsResponse] = await Promise.all([
            ownerApi.getMyAttraction(),
            ownerApi.getReports(0, { limit: 10, status: 'pending' })
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

  // Generate menu items with live badges
  const getMenuItemsWithBadges = (): MenuItem[] => {
    const baseItems = user?.role.roleName === "AUTHORITY" ? 
      [
        { title: "City Overview", page: "City Overview", icon: Home },
        { title: "Attraction Comparison", page: "Attraction Comparison", icon: BarChart3 },
        { title: "Demographic Insights", page: "Demographic Insights", icon: Users },
        { title: "Predictive Analytics", page: "Predictive Analytics", icon: TrendingUp },
        { title: "Reports Management", page: "Reports Management", icon: FileText },
        { title: "Search Database", page: "Search Data", icon: Search },
      ] : 
      [
        { title: "Performance Overview", page: "Performance Overview", icon: Home },
        { title: "Visitor Analysis", page: "Visitor Analysis", icon: Users },
        { title: "Revenue Analytics", page: "Revenue Analytics", icon: BarChart3 },
        { title: "Forecasts & Planning", page: "Forecasts & Planning", icon: TrendingUp },
        { title: "Attraction Management", page: "Attraction Management", icon: Building2 },
      ]

    // Add badges based on live data
    return baseItems.map(item => {
      let badge: string | undefined
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary"

      switch (item.page) {
        case "City Overview":
          if (sidebarStats.activeAlerts > 0) {
            badge = sidebarStats.activeAlerts.toString()
            badgeVariant = "destructive"
          }
          break
        case "Performance Overview":
          if (sidebarStats.attractionStatus === 'pending') {
            badge = "!"
            badgeVariant = "destructive"
          } else if (sidebarStats.recentActivity > 0) {
            badge = "•"
            badgeVariant = "default"
          }
          break
        case "Reports Management":
          if (sidebarStats.pendingReports > 0) {
            badge = sidebarStats.pendingReports.toString()
            badgeVariant = "default"
          }
          break
        case "Visitor Analysis":
        case "Demographic Insights":
          if (sidebarStats.recentActivity > 5) {
            badge = "•"
            badgeVariant = "default"
          }
          break
        default:
          break
      }

      return { ...item, badge, badgeVariant }
    })
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

  // Quick actions with live data
  const getQuickActions = (): MenuItem[] => {
    const actions: MenuItem[] = [
      {
        title: "AI Chat Assistant",
        page: "AI Chat",
        icon: Sparkles
      }
    ]

    // Add alerts action with badge
    actions.push({
      title: "Alerts & Notifications",
      page: "Alert Configuration", 
      icon: sidebarStats.activeAlerts > 0 ? AlertTriangle : Bell,
      badge: sidebarStats.unreadNotifications > 0 ? sidebarStats.unreadNotifications.toString() : undefined,
      badgeVariant: sidebarStats.activeAlerts > 0 ? "destructive" : "default"
    })

    return actions
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        {/* Logo Section - Centered */}
        <div className="px-4 py-4 border-b border-sidebar-border flex justify-center">
          <Logo size="md" showText={false} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPage === item.page}
                    className="cursor-pointer"
                    onClick={() => onPageChange(item.page)}
                  >
                    <div className="flex items-center gap-3">
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
                      {isLoading && item.page === "City Overview" && (
                        <Activity className="h-3 w-3 animate-pulse ml-auto text-muted-foreground" />
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role.roleName === "AUTHORITY" && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getQuickActions().map((action) => (
                  <SidebarMenuItem key={action.title}>
                    <SidebarMenuButton 
                      asChild
                      className="cursor-pointer"
                      onClick={() => onPageChange(action.page)}
                    >
                      <div className="flex items-center gap-3">
                        <action.icon className="h-4 w-4" />
                        <span>{action.title}</span>
                        {action.badge && (
                          <Badge 
                            variant={action.badgeVariant || "default"} 
                            className="ml-auto text-xs"
                          >
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user?.role.roleName === "OWNER" && sidebarStats.attractionStatus && (
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
                  <Avatar className="h-8 w-8 rounded-full ring-2 ring-primary/10 hover:ring-primary/20 transition-all">
                    <AvatarImage
                      src={getAvatarUrl(user)}
                      alt={user?.username || "User"}
                      className={hasCustomAvatar(user) ? "object-cover" : ""}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(user?.username || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="text-sm font-medium truncate">{user?.username}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user?.role.roleName.toLowerCase()}</div>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={getAvatarUrl(user)}
                        alt={user?.username || "User"}
                        className={hasCustomAvatar(user) ? "object-cover" : ""}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(user?.username || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <div className="text-sm font-medium truncate">{user?.username}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user?.role.roleName.toLowerCase()}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onProfileClick}>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
