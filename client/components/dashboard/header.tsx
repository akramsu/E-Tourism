"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { userApi } from "@/lib/api"

interface Notification {
  id: number
  alertType: string
  alertMessage: string
  triggeredAt: string
  alertResolved: boolean
}

interface DashboardHeaderProps {
  title: string
  subtitle: string
  onProfileClick?: () => void
}

export function DashboardHeader({ title, subtitle, onProfileClick }: DashboardHeaderProps) {
  const { user, logout, refreshUser } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  // Fetch notifications and refresh user data on component mount
  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchUnreadCount()
      // Refresh user data to ensure we have the latest info from database
      refreshUser()
    }
  }, [user, refreshUser])

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const response = await userApi.getNotifications({ limit: 5, unreadOnly: false })
      if (response.success && response.data) {
        setNotifications(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await userApi.getUnreadNotificationCount()
      if (response.success && response.data) {
        setUnreadCount(response.data.count)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.alertResolved) {
      try {
        await userApi.markNotificationRead(notification.id)
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, alertResolved: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
  }

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarUrl = (name: string, role: string) => {
    // Generate a consistent avatar based on name and role
    const seed = name.toLowerCase().replace(/\s+/g, "")
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${role === "AUTHORITY" ? "3b82f6" : "10b981"}`
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />

      <div className="flex flex-1 items-center justify-between min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg font-semibold truncate">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 hover:bg-red-500">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-auto p-1"
                    onClick={async () => {
                      try {
                        await userApi.markAllNotificationsRead()
                        setNotifications(prev => prev.map(n => ({ ...n, alertResolved: true })))
                        setUnreadCount(0)
                      } catch (error) {
                        console.error('Failed to mark all as read:', error)
                      }
                    }}
                  >
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingNotifications ? (
                <DropdownMenuItem disabled>
                  <div className="flex items-center justify-center w-full py-4">
                    Loading notifications...
                  </div>
                </DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem disabled>
                  <div className="flex items-center justify-center w-full py-4 text-muted-foreground">
                    No notifications
                  </div>
                </DropdownMenuItem>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    className={`flex flex-col items-start p-3 cursor-pointer ${!notification.alertResolved ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <div className={`font-medium ${!notification.alertResolved ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                          {notification.alertType}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {notification.alertMessage}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatNotificationTime(notification.triggeredAt)}
                        </div>
                      </div>
                      {!notification.alertResolved && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9 ring-2 ring-primary/10 hover:ring-primary/20 transition-all">
                  <AvatarImage
                    src={user?.profilePicture || getAvatarUrl(user?.username || "User", user?.role.roleName || "TOURIST")}
                    alt={user?.username || "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-semibold">
                    {getInitials(user?.username || "User")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role.roleName} Account</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
