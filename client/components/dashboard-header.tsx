"use client"

import { Bell, Download, RefreshCw, User } from "lucide-react"
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

export function DashboardHeader() {
  const { user, logout } = useAuth()

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
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Tourism Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time insights and performance metrics</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">3</Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={getAvatarUrl(user)} 
                    alt="User Avatar"
                    className={hasCustomAvatar(user) ? "object-cover" : ""}
                  />
                  <AvatarFallback className="text-xs">
                    {user?.username ? getInitials(user.username) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user?.username || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
