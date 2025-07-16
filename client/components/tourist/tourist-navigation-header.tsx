"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/ui/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import {
  Search,
  MapPin,
  Calendar,
  Heart,
  User,
  Settings,
  LogOut,
  Bell,
  Compass,
  Home,
  Star,
  History,
  MessageSquare,
  CreditCard,
  Shield,
  HelpCircle,
  Menu,
  X,
} from "lucide-react"

interface TouristNavigationHeaderProps {
  currentPage: string
  onPageChange: (page: string) => void
  onSearch?: (query: string) => void
}

interface MenuItemBase {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  section: string
}

interface SeparatorItem {
  separator: true
}

type MenuItem = MenuItemBase | SeparatorItem

export default function TouristNavigationHeader({ currentPage, onPageChange, onSearch }: TouristNavigationHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(0) // Will be populated from API
  const { user, logout } = useAuth()
  const searchRef = useRef<HTMLInputElement>(null)

  // Fetch notification count (mock for now, can be replaced with real API call)
  useEffect(() => {
    // This could be replaced with an actual API call to get unread notifications
    setNotifications(0) // Start with 0, will be updated when notifications API is integrated
  }, [])

  const navigationItems = [
    { id: "Dashboard", label: "Home", icon: Home, path: "Dashboard" },
    { id: "Search Results", label: "Explore", icon: Compass, path: "Search Results" },
    { id: "Recommendations", label: "For You", icon: Star, path: "Recommendations" },
    { id: "Events & Activities", label: "Events", icon: Calendar, path: "Events & Activities" },
  ]

  const profileMenuItems: MenuItem[] = [
    { id: "User Profile", label: "My Profile", icon: User, section: "account" },
    { id: "History", label: "Visit History", icon: History, section: "account" },
    { id: "Wishlist", label: "Wishlist", icon: Heart, section: "account" },
    { id: "Reviews", label: "My Reviews", icon: MessageSquare, section: "account" },
    { separator: true },
    { id: "Settings", label: "Settings", icon: Settings, section: "preferences" },
    { id: "Billing", label: "Billing", icon: CreditCard, section: "preferences" },
    { id: "Privacy", label: "Privacy", icon: Shield, section: "preferences" },
    { separator: true },
    { id: "Help", label: "Help Center", icon: HelpCircle, section: "support" },
  ]

  const handleSearch = () => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim())
      onPageChange("Search Results")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleProfileMenuClick = (itemId: string) => {
    if (itemId === "User Profile") {
      onPageChange("User Profile")
    } else {
      // Handle other profile menu items
      console.log("Navigate to:", itemId)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !event.target) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" className="flex-shrink-0" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.path ? "default" : "ghost"}
                  onClick={() => onPageChange(item.path)}
                  className={`gap-2 ${
                    currentPage === item.path
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full group">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-300 ${
                  isSearchFocused ? "opacity-20" : ""
                }`}
              ></div>
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                <Input
                  ref={searchRef}
                  placeholder="Search attractions, events, places..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="pl-10 pr-12 h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                />
                <Button
                  size="sm"
                  onClick={handleSearch}
                  className="absolute right-1 h-8 px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* Wishlist Quick Access */}
            <Button variant="ghost" size="sm" onClick={() => onPageChange("User Profile")}>
              <Heart className="h-5 w-5" />
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all">
                    <AvatarImage src={user?.profilePicture || "/placeholder.svg"} alt={user?.username || "User"} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {user?.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username || "Tourist User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="w-fit mt-1">
                      Tourist
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {profileMenuItems.map((item, index) => {
                  if ('separator' in item) {
                    return <DropdownMenuSeparator key={index} />
                  }
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleProfileMenuClick(item.id)}
                      className="gap-2 cursor-pointer"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  )
                })}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search attractions, events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-12 h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
            <Button
              size="sm"
              onClick={handleSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-white dark:bg-slate-900 py-4">
            <nav className="flex flex-col gap-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.path ? "default" : "ghost"}
                  onClick={() => {
                    onPageChange(item.path)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`justify-start gap-3 ${
                    currentPage === item.path
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
