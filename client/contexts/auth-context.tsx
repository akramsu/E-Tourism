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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)

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
      const response = await fetch(`${API_BASE_URL}/api/auth/roles`)
      const data = await response.json()
      
      if (data.success) {
        setRoles(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err)
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
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })
      
      const data = await response.json()
      
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        setIsNewUser(false) // Clear new user flag after profile completion
        return true
      } else {
        setError(data.message || 'Profile update failed')
        return false
      }
    } catch (err) {
      console.error('Profile update error:', err)
      setError('An error occurred while updating profile')
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
        isNewUser
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
