"use client"

import { useState, useEffect } from "react"
import { attractionsAPI } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TouristDashboardProps {
  onPageChange: (page: string) => void
  onAttractionSelect: (attractionId: number) => void
}

export function TouristDashboard({
  onPageChange,
  onAttractionSelect,
}: TouristDashboardProps) {
  const [attractions, setAttractions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch attractions from backend
  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        setLoading(true)
        console.log('Fetching attractions from API...')
        const response = await attractionsAPI.getAttractions({
          limit: 10,
          sortBy: 'rating',
          sortOrder: 'desc'
        })
        console.log('API Response:', response)
        setAttractions(response.data.data || [])
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch attractions:', err)
        setError('Failed to load attractions. Please try again later.')
        setAttractions([])
      } finally {
        setLoading(false)
      }
    }

    fetchAttractions()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading attractions...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to TourEase
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Discover amazing attractions and plan your perfect trip
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Attractions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {attractions.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-green-600">
                ✅ Connected
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Data Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-purple-600">
                🌐 Backend API
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attractions List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Attractions
          </h2>
          
          {attractions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {attractions.map((attraction) => (
                <Card 
                  key={attraction.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onAttractionSelect(attraction.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{attraction.name}</CardTitle>
                    <CardDescription>{attraction.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📍 {attraction.address}
                      </p>
                      {attraction.rating && (
                        <p className="text-sm">
                          ⭐ Rating: {attraction.rating}/5
                        </p>
                      )}
                      {attraction.price && (
                        <p className="text-sm font-semibold text-green-600">
                          💰 ${attraction.price}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {attraction.description || 'No description available'}
                      </p>
                      <Button 
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAttractionSelect(attraction.id)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏛️</div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Attractions Available
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                We're working to add more amazing destinations for you!
              </p>
            </div>
          )}
        </div>

        {/* Debug Information */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
          <div className="space-y-1 text-sm">
            <p>Backend URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api'}</p>
            <p>Attractions loaded: {attractions.length}</p>
            <p>Loading state: {loading ? 'Yes' : 'No'}</p>
            <p>Error state: {error || 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TouristDashboard
