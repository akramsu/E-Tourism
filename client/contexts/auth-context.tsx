"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type UserRole = "AUTHORITY" | "OWNER" | "TOURIST"

interface Role {
  id: number
  roleName: UserRole
}

interface User {
  id: number
  username: string
  email: string
  phoneNumber?: string
  birthDate?: string
  postcode?: string
  gender?: string
  profilePicture?: string
  roleId: number
  createdDate: string
  role: Role
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  updateUserProfile: (profileData: {
    username?: string
    phoneNumber?: string
    birthDate?: string
    postcode?: string
    gender?: string
    profileImage?: string
  }) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  refreshUser: () => Promise<void>
  roles: Role[]
  loading: boolean
  error: string | null
  needsProfileCompletion: boolean
  isNewUser: boolean
  needsAttractionCreation: boolean
  markAttractionCreated: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [needsAttractionCreation, setNeedsAttractionCreation] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (err) {
        console.error('Failed to parse stored user data:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    // Load roles
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      console.log('Fetching roles from:', `${API_BASE_URL}/api/auth/roles`)
      const response = await fetch(`${API_BASE_URL}/api/auth/roles`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Roles fetched successfully:', data)
      
      if (data.success) {
        setRoles(data.data)
      } else {
        console.error('Failed to fetch roles - API returned error:', data.message)
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err)
      console.error('API Base URL:', API_BASE_URL)
      
      // Set a user-friendly error message
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend is running.')
      }
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        setIsNewUser(false) // Clear new user flag for existing users
        return true
      } else {
        setError(data.message || 'Login failed')
        return false
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during login')
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (username: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      // Map role to roleId
      const roleIdMap: Record<UserRole, number> = {
        'AUTHORITY': 1,
        'OWNER': 2,
        'TOURIST': 3
      }
      
      const roleId = roleIdMap[role]
      
      console.log('Registering user:', { username, email, roleId })
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          roleId
        }),
      })
      
      const data = await response.json()
      
      console.log('Registration response:', data)
      
      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        setIsNewUser(true) // Mark as new user for profile completion
        
        // If the user is an attraction owner, mark that they need to create their attraction
        if (role === 'OWNER') {
          setNeedsAttractionCreation(true)
        }
        
        return true
      } else {
        setError(data.message || 'Registration failed')
        return false
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An error occurred during registration')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (profileData: {
    username?: string
    phoneNumber?: string
    birthDate?: string
    postcode?: string
    gender?: string
    profileImage?: string
  }): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    if (!user) {
      setError('User not authenticated')
      setLoading(false)
      return false
    }
    
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('Authentication token not found. Please log in again.')
        setLoading(false)
        return false
      }

      console.log('Making profile update request to:', `${API_BASE_URL}/api/auth/profile`)
      console.log('Profile data being sent:', { ...profileData, profileImage: profileData.profileImage ? `base64 data (${Math.round(profileData.profileImage.length / 1024)}KB)` : 'no image' })

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        // Handle different HTTP error codes
        if (response.status === 401) {
          setError('Authentication expired. Please log in again.')
          // Optionally clear token and redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
          return false
        } else if (response.status === 413) {
          setError('Profile image is too large. Please choose a smaller image.')
          return false
        } else if (response.status === 503) {
          setError('Database connection timeout. Please try again with a smaller image.')
          return false
        } else if (response.status >= 500) {
          setError('Server error. Please try again in a moment.')
          return false
        }
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        setIsNewUser(false) // Clear new user flag after profile completion
        console.log('Profile updated successfully')
        return true
      } else {
        const errorMessage = data.message || `Profile update failed: ${response.status} ${response.statusText}`
        console.error('Profile update failed:', errorMessage)
        setError(errorMessage)
        return false
      }
    } catch (err) {
      console.error('Profile update error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating profile'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    if (!user) {
      setError('User not authenticated')
      setLoading(false)
      return false
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        return true
      } else {
        setError(data.message || 'Password change failed')
        return false
      }
    } catch (err) {
      console.error('Password change error:', err)
      setError('An error occurred while changing password')
      return false
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success && data.data) {
        localStorage.setItem('user', JSON.stringify(data.data))
        setUser(data.data)
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err)
    }
  }

  const markAttractionCreated = () => {
    setNeedsAttractionCreation(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setError(null)
    // Force redirect to landing page
    window.location.href = "/"
  }

  // Calculate if user needs profile completion (only for new users)
  const needsProfileCompletion = isNewUser && user && (!user.phoneNumber || !user.birthDate || !user.postcode || !user.gender)

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        isAuthenticated: !!user, 
        updateUserProfile,
        changePassword,
        refreshUser,
        roles,
        loading,
        error,
        needsProfileCompletion: !!needsProfileCompletion,
        isNewUser,
        needsAttractionCreation,
        markAttractionCreated
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
