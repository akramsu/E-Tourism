"use client"

import { useState, useEffect } from "react"
import { touristApi } from "@/lib/api"

// Types based on Prisma schema
export interface Attraction {
  id: number
  name: string
  description?: string
  address: string
  category: string
  latitude?: number
  longitude?: number
  openingHours?: string
  rating?: number
  price?: number
  createdDate: string
  user: {
    id: number
    username: string
    email: string
  }
  images: {
    id: number
    imageUrl: string
  }[]
  _count: {
    visits: number
  }
}

export interface Visit {
  id: number
  attractionId: number
  visitDate: string
  amount?: number
  duration?: number
  groupId?: string
  visitorFeedback?: string
  rating?: number
  createdDate: string
  attraction: {
    id: number
    name: string
    category: string
    address: string
  }
}

interface AttractionsFilter {
  page?: number
  limit?: number
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sortBy?: string
  sortOrder?: string
}

export function useAttractions(filters: AttractionsFilter = {}) {
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchAttractions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await touristApi.getAttractions(filters)
      
      if (response.success && response.data) {
        setAttractions(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        setAttractions([])
      }
    } catch (err) {
      console.error('Failed to fetch attractions:', err)
      setError('Failed to load attractions. Please try again.')
      setAttractions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttractions()
  }, [
    filters.page,
    filters.limit,
    filters.category,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.sortBy,
    filters.sortOrder
  ])

  return {
    attractions,
    loading,
    error,
    pagination,
    refetch: fetchAttractions
  }
}

export function useFeaturedAttractions(limit = 6) {
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeaturedAttractions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await touristApi.getFeaturedAttractions(limit)
      
      if (response.success && response.data) {
        setAttractions(response.data)
      } else {
        setAttractions([])
      }
    } catch (err) {
      console.error('Failed to fetch featured attractions:', err)
      setError('Failed to load featured attractions.')
      setAttractions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeaturedAttractions()
  }, [limit])

  return {
    featuredAttractions: attractions,
    loading,
    error,
    refetch: fetchFeaturedAttractions
  }
}

export function useUserVisits() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchVisits = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await touristApi.getUserVisits()
      
      if (response.success && response.data) {
        setVisits(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        setVisits([])
      }
    } catch (err) {
      console.error('Failed to fetch visits:', err)
      setError('Failed to load visit history.')
      setVisits([])
    } finally {
      setLoading(false)
    }
  }

  const recordVisit = async (visitData: {
    attractionId: number
    visitDate: string
    amount?: number
    duration?: number
    groupId?: string
    visitorFeedback?: string
    rating?: number
  }) => {
    try {
      const response = await touristApi.recordVisit(visitData)
      
      if (response.success) {
        // Refresh visits list
        await fetchVisits()
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to record visit:', err)
      setError('Failed to record visit.')
      return false
    }
  }

  useEffect(() => {
    fetchVisits()
  }, [])

  return {
    visits,
    loading,
    error,
    pagination,
    refetch: fetchVisits,
    recordVisit
  }
}

export function useAttractionStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await touristApi.getAttractionStats()
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setStats(null)
      }
    } catch (err) {
      console.error('Failed to fetch attraction stats:', err)
      setError('Failed to load statistics.')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
