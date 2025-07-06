"use client"

import type React from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { MapPin, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TouristHeaderProps {
  title: string
  showUserInfo?: boolean
  notificationCount?: number
}

export const TouristHeader: React.FC<TouristHeaderProps> = ({ 
  title, 
  showUserInfo = true,
  notificationCount = 0 
}) => {
  const { user } = useAuth()

  return (
    <header className="bg-white dark:bg-gray-800 py-4 px-6 shadow-md border-b">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left side - Title and branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">TourEase</span>
          </div>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h1>
        </div>

        {/* Right side - User info and controls */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          {notificationCount > 0 && (
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white">
                {notificationCount}
              </Badge>
            </Button>
          )}

          {/* User info */}
          {showUserInfo && user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800 dark:text-white">
                  {user.name || 'Tourist User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
              </div>
              <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
                <AvatarImage 
                  src={user.profilePicture || "/placeholder.svg"} 
                  alt={user.name || "User"} 
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="text-xs">
                Tourist
              </Badge>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
