// Centralized API utility for making authenticated requests to the TourEase backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()

// Specific API functions for AI insights
export const aiInsightsApi = {
  getPredictiveModels: (limit = 5) => 
    apiClient.get<ApiResponse<any[]>>(`/api/predictive?limit=${limit}`),
  
  getAlerts: (limit = 5) => 
    apiClient.get<ApiResponse<any[]>>(`/api/alerts?resolved=false&limit=${limit}`),
  
  getReports: (limit = 5) => 
    apiClient.get<ApiResponse<any[]>>(`/api/reports?reportType=recommendation&limit=${limit}`)
}

// Specific API functions for alert management
export const alertsApi = {
  // Get all alerts with optional filtering
  getAlerts: (params?: { resolved?: boolean; page?: number; limit?: number; alertType?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.resolved !== undefined) searchParams.set('resolved', params.resolved.toString())
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.alertType) searchParams.set('alertType', params.alertType)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any[]>>(`/api/alerts${query ? `?${query}` : ''}`)
  },

  // Get alert by ID
  getAlert: (id: number) => 
    apiClient.get<ApiResponse<any>>(`/api/alerts/${id}`),

  // Create new alert
  createAlert: (alertData: { alertType: string; alertMessage: string; alertData?: any }) =>
    apiClient.post<ApiResponse<any>>('/api/alerts', alertData),

  // Update alert (mark as resolved)
  updateAlert: (id: number, updates: { alertResolved?: boolean }) =>
    apiClient.put<ApiResponse<any>>(`/api/alerts/${id}`, updates),

  // Delete alert
  deleteAlert: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/api/alerts/${id}`)
}

// Specific API functions for tourist functionality
export const touristApi = {
  // Get all attractions with filtering
  getAttractions: (params?: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    search?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    minRating?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.category) searchParams.set('category', params.category)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.minPrice) searchParams.set('minPrice', params.minPrice.toString())
    if (params?.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString())
    if (params?.minRating) searchParams.set('minRating', params.minRating.toString())
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any[]>>(`/api/attractions${query ? `?${query}` : ''}`)
  },

  // Get attraction by ID
  getAttraction: (id: number) => 
    apiClient.get<ApiResponse<any>>(`/api/attractions/${id}`),

  // Record a visit
  recordVisit: (visitData: any) =>
    apiClient.post<ApiResponse<any>>('/api/visits', visitData),

  // Get user's visits
  getUserVisits: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any[]>>(`/api/visits/my-visits${query ? `?${query}` : ''}`)
  },

  // Get attraction statistics for dashboard
  getAttractionStats: () =>
    apiClient.get<ApiResponse<any>>('/api/attractions/stats'),

  // Get featured attractions
  getFeaturedAttractions: (limit = 6) =>
    apiClient.get<ApiResponse<any[]>>(`/api/attractions/featured?limit=${limit}`),
}

// User profile API functions
export const userApi = {
  // Get current user profile
  getProfile: () =>
    apiClient.get<ApiResponse<any>>('/api/user/profile'),

  // Get current user profile (fresh from database)
  getCurrentUser: () =>
    apiClient.get<ApiResponse<any>>('/api/user/profile'),

  // Update user profile
  updateProfile: (profileData: {
    username?: string
    email?: string
    phoneNumber?: string
    birthDate?: string
    postcode?: string
    gender?: string
    businessName?: string
    businessType?: string
    bio?: string
  }) => apiClient.put<ApiResponse<any>>('/api/user/profile', profileData),

  // Upload profile picture
  uploadProfilePicture: (imageFile: File) => {
    const formData = new FormData()
    formData.append('profilePicture', imageFile)
    
    return fetch(`${API_BASE_URL}/api/user/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed: ${response.status}`)
      }
      return response.json()
    })
  },

  // Change password
  changePassword: (passwordData: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => apiClient.put<ApiResponse<any>>('/api/user/change-password', passwordData),

  // Get user statistics (for business owners)
  getUserStats: () =>
    apiClient.get<ApiResponse<any>>('/api/user/stats'),

  // Update notification settings
  updateNotificationSettings: (settings: {
    emailNotifications?: boolean
    pushNotifications?: boolean
    smsNotifications?: boolean
    marketingEmails?: boolean
  }) => apiClient.put<ApiResponse<any>>('/api/user/notification-settings', settings),

  // Get notification settings
  getNotificationSettings: () =>
    apiClient.get<ApiResponse<any>>('/api/user/notification-settings'),

  // Get user notifications/alerts
  getNotifications: (params?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/user/notifications${query ? `?${query}` : ''}`)
  },

  // Mark notification as read
  markNotificationRead: (notificationId: number) =>
    apiClient.put<ApiResponse<any>>(`/api/user/notifications/${notificationId}/read`, {}),

  // Mark all notifications as read
  markAllNotificationsRead: () =>
    apiClient.put<ApiResponse<any>>('/api/user/notifications/read-all', {}),

  // Get unread notification count
  getUnreadNotificationCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/api/user/notifications/unread-count'),

  // Request business verification
  requestBusinessVerification: (verificationData: {
    businessLicense?: File
    businessRegistration?: File
    additionalDocuments?: File[]
  }) => {
    const formData = new FormData()
    if (verificationData.businessLicense) {
      formData.append('businessLicense', verificationData.businessLicense)
    }
    if (verificationData.businessRegistration) {
      formData.append('businessRegistration', verificationData.businessRegistration)
    }
    if (verificationData.additionalDocuments) {
      verificationData.additionalDocuments.forEach((doc, index) => {
        formData.append(`additionalDocument${index}`, doc)
      })
    }
    
    return fetch(`${API_BASE_URL}/api/user/business-verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Verification request failed: ${response.status}`)
      }
      return response.json()
    })
  },
}

// Owner-specific API functions for attraction management and analytics
export const ownerApi = {
  // Attraction Management
  getMyAttraction: () =>
    apiClient.get<ApiResponse<any>>('/api/owner/attraction'),

  createAttraction: (attractionData: {
    name: string
    description: string
    category: string
    location: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    latitude?: number
    longitude?: number
    phoneNumber?: string
    email?: string
    website?: string
    openingHours: any
    ticketPrice: number
    capacity: number
    amenities?: string[]
    accessibility?: string[]
    ageRestriction?: string
    duration?: number
    difficulty?: string
    tags?: string[]
  }) => apiClient.post<ApiResponse<any>>('/api/owner/attraction', attractionData),

  updateAttraction: (attractionId: number, updateData: any) =>
    apiClient.put<ApiResponse<any>>(`/api/owner/attraction/${attractionId}`, updateData),

  deleteAttraction: (attractionId: number) =>
    apiClient.delete<ApiResponse<void>>(`/api/owner/attraction/${attractionId}`),

  // Image Management
  uploadAttractionImages: (attractionId: number, images: File[]) => {
    const formData = new FormData()
    images.forEach((image, index) => {
      formData.append(`images`, image)
    })
    
    return fetch(`${API_BASE_URL}/api/owner/attraction/${attractionId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Image upload failed: ${response.status}`)
      }
      return response.json()
    })
  },

  deleteAttractionImage: (attractionId: number, imageId: number) =>
    apiClient.delete<ApiResponse<void>>(`/api/owner/attraction/${attractionId}/images/${imageId}`),

  // Analytics and Performance
  getPerformanceMetrics: (attractionId: number, params?: { 
    period?: 'today' | 'week' | 'month' | 'year'
    includeComparisons?: boolean 
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/metrics${query ? `?${query}` : ''}`)
  },

  getAttractionAnalytics: (attractionId: number, params?: { 
    period?: 'day' | 'week' | 'month' | 'year'
    startDate?: string
    endDate?: string 
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/analytics${query ? `?${query}` : ''}`)
  },

  getDailyHighlights: (attractionId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/highlights`),

  // Forecasting and Planning
  getForecastData: (attractionId: number, params?: {
    forecastType?: 'visitors' | 'revenue' | 'capacity'
    period?: 'week' | 'month' | 'quarter'
    includeScenarios?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.forecastType) searchParams.set('forecastType', params.forecastType)
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeScenarios) searchParams.set('includeScenarios', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/forecast${query ? `?${query}` : ''}`)
  },

  getCapacityPlanning: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter'
    includeOptimization?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeOptimization) searchParams.set('includeOptimization', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/capacity-planning${query ? `?${query}` : ''}`)
  },

  getPricingRecommendations: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter'
    includeDynamicPricing?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeDynamicPricing) searchParams.set('includeDynamicPricing', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/pricing-recommendations${query ? `?${query}` : ''}`)
  },

  // Advanced Analytics
  getVisitorTrends: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    groupBy?: 'day' | 'week' | 'month'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.groupBy) searchParams.set('groupBy', params.groupBy)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/visitor-trends${query ? `?${query}` : ''}`)
  },

  getRevenueAnalysis: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    includeBreakdown?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeBreakdown) searchParams.set('includeBreakdown', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/revenue-analysis${query ? `?${query}` : ''}`)
  },

  getCustomerInsights: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    includeSegmentation?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeSegmentation) searchParams.set('includeSegmentation', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/customer-insights${query ? `?${query}` : ''}`)
  },

  // Business Insights
  getCompetitorAnalysis: (attractionId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/competitor-analysis`),

  getMarketTrends: (attractionId: number, params?: {
    region?: string
    category?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.region) searchParams.set('region', params.region)
    if (params?.category) searchParams.set('category', params.category)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/market-trends${query ? `?${query}` : ''}`)
  },

  getBusinessRecommendations: (attractionId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/business-recommendations`),

  // Report Management
  getReports: (attractionId: number, params?: {
    page?: number
    limit?: number
    reportType?: string
    status?: 'pending' | 'processing' | 'completed' | 'failed'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.reportType) searchParams.set('reportType', params.reportType)
    if (params?.status) searchParams.set('status', params.status)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any[]>>(`/api/owner/attraction/${attractionId}/reports${query ? `?${query}` : ''}`)
  },

  generateReport: (attractionId: number, reportConfig: {
    title: string
    description?: string
    reportType: string
    startDate: string
    endDate: string
    metrics: string[]
    exportFormat: 'pdf' | 'excel' | 'csv'
  }) => apiClient.post<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/reports`, reportConfig),

  getReport: (attractionId: number, reportId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/reports/${reportId}`),

  downloadReport: (attractionId: number, reportId: number) => {
    return fetch(`${API_BASE_URL}/api/owner/attraction/${attractionId}/reports/${reportId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
      }
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Download failed: ${response.status}`)
      }
      return response.blob()
    })
  },

  deleteReport: (attractionId: number, reportId: number) =>
    apiClient.delete<ApiResponse<void>>(`/api/owner/attraction/${attractionId}/reports/${reportId}`),

  getReportTypes: () =>
    apiClient.get<ApiResponse<any[]>>('/api/owner/report-types'),

  getAvailableMetrics: (attractionId: number) =>
    apiClient.get<ApiResponse<any[]>>(`/api/owner/attraction/${attractionId}/available-metrics`),

  // Visitor Analysis
  getVisitorAnalytics: (attractionId: number, params?: {
    period?: 'today' | 'week' | 'month' | 'quarter' | 'year'
    startDate?: string
    endDate?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/visitor-analytics${query ? `?${query}` : ''}`)
  },

  getVisitorDemographics: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/visitor-demographics${query ? `?${query}` : ''}`)
  },

  getVisitorBehavior: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    includeComparisons?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/visitor-behavior${query ? `?${query}` : ''}`)
  },

  getVisitorHeatmap: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    type?: 'hourly' | 'daily' | 'weekly'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.type) searchParams.set('type', params.type)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/visitor-heatmap${query ? `?${query}` : ''}`)
  },

  getVisitorOrigins: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    groupBy?: 'city' | 'state' | 'country'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.groupBy) searchParams.set('groupBy', params.groupBy)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/visitor-origins${query ? `?${query}` : ''}`)
  },

  // Chart-specific endpoints for live data visualization
  getVisitorTrendsData: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    groupBy?: 'day' | 'week' | 'month'
    includeRevenue?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.groupBy) searchParams.set('groupBy', params.groupBy)
    if (params?.includeRevenue) searchParams.set('includeRevenue', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/chart/visitor-trends${query ? `?${query}` : ''}`)
  },

  getRevenueChartData: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    groupBy?: 'day' | 'week' | 'month' | 'category'
    includeComparisons?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.groupBy) searchParams.set('groupBy', params.groupBy)
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/chart/revenue${query ? `?${query}` : ''}`)
  },

  getDemographicsChartData: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    breakdown?: 'age' | 'gender' | 'location' | 'all'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.breakdown) searchParams.set('breakdown', params.breakdown)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/chart/demographics${query ? `?${query}` : ''}`)
  },

  getVisitorHeatmapData: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    granularity?: 'hourly' | 'daily'
    includeWeekends?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.granularity) searchParams.set('granularity', params.granularity)
    if (params?.includeWeekends) searchParams.set('includeWeekends', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/chart/visitor-heatmap${query ? `?${query}` : ''}`)
  },

  getAttractionPerformanceData: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    metrics?: string[]
    includeComparisons?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.metrics) params.metrics.forEach(metric => searchParams.append('metrics', metric))
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/chart/attraction-performance${query ? `?${query}` : ''}`)
  },

  getInteractiveDonutChartData: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    breakdown?: 'category' | 'source' | 'age' | 'gender'
    includeValues?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.breakdown) searchParams.set('breakdown', params.breakdown)
    if (params?.includeValues) searchParams.set('includeValues', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/owner/attraction/${attractionId}/chart/interactive-donut${query ? `?${query}` : ''}`)
  },
}

// Tourism Authority API
export const authorityApi = {
  // Get city overview metrics (all attractions)
  getCityMetrics: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    includeComparisons?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/city-metrics${query ? `?${query}` : ''}`)
  },

  // Get all attractions overview
  getAllAttractions: (params?: {
    limit?: number
    offset?: number
    category?: string
    status?: 'active' | 'inactive' | 'all'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.category) searchParams.set('category', params.category)
    if (params?.status) searchParams.set('status', params.status)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/attractions${query ? `?${query}` : ''}`)
  },

  // Get city-wide analytics
  getCityAnalytics: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    startDate?: string
    endDate?: string
    includeBreakdown?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.includeBreakdown) searchParams.set('includeBreakdown', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/analytics${query ? `?${query}` : ''}`)
  },

  // Get performance comparison across attractions
  getAttractionComparison: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    metrics?: string[]
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.metrics) params.metrics.forEach(metric => searchParams.append('metrics', metric))
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/attraction-comparison${query ? `?${query}` : ''}`)
  },

  // Get tourism insights and trends
  getTourismInsights: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    includeForecasts?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeForecasts) searchParams.set('includeForecasts', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/tourism-insights${query ? `?${query}` : ''}`)
  },

  // Get city-wide revenue analysis
  getCityRevenue: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    breakdown?: 'category' | 'attraction' | 'time'
    includeComparisons?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.breakdown) searchParams.set('breakdown', params.breakdown)
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/revenue${query ? `?${query}` : ''}`)
  },

  // Get city-wide visitor trends
  getCityVisitorTrends: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    groupBy?: 'day' | 'week' | 'month'
    includeRevenue?: boolean
    includeComparisons?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.groupBy) searchParams.set('groupBy', params.groupBy)
    if (params?.includeRevenue) searchParams.set('includeRevenue', 'true')
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/visitor-trends${query ? `?${query}` : ''}`)
  },

  // Get city-wide demographics
  getCityDemographics: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    breakdown?: 'age' | 'gender' | 'location' | 'all'
    includeComparisons?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.breakdown) searchParams.set('breakdown', params.breakdown)
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/demographics${query ? `?${query}` : ''}`)
  },

  // Advanced filtering and search
  searchAttractions: (params?: {
    query?: string
    categories?: string[]
    locations?: string[]
    minRating?: number
    maxRating?: number
    minPrice?: number
    maxPrice?: number
    sortBy?: 'name' | 'rating' | 'price' | 'createdDate' | 'visitCount' | 'revenue'
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.query) searchParams.set('query', params.query)
    if (params?.categories) params.categories.forEach(cat => searchParams.append('categories', cat))
    if (params?.locations) params.locations.forEach(loc => searchParams.append('locations', loc))
    if (params?.minRating !== undefined) searchParams.set('minRating', params.minRating.toString())
    if (params?.maxRating !== undefined) searchParams.set('maxRating', params.maxRating.toString())
    if (params?.minPrice !== undefined) searchParams.set('minPrice', params.minPrice.toString())
    if (params?.maxPrice !== undefined) searchParams.set('maxPrice', params.maxPrice.toString())
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/attractions/search${query ? `?${query}` : ''}`)
  },

  // Get filter options (categories, locations, etc.)
  getFilterOptions: () =>
    apiClient.get<ApiResponse<any>>('/api/authority/attractions/filter-options'),

  // Get detailed attraction information
  getAttractionDetails: (attractionId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/authority/attractions/${attractionId}`),

  // Get attraction statistics
  getAttractionStatistics: (attractionId: number, params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/attractions/${attractionId}/statistics${query ? `?${query}` : ''}`)
  },

  // Export filtered results
  exportFilteredAttractions: (params?: {
    format?: 'csv' | 'excel' | 'pdf'
    categories?: string[]
    locations?: string[]
    minRating?: number
    maxRating?: number
    minPrice?: number
    maxPrice?: number
    includeStatistics?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.format) searchParams.set('format', params.format)
    if (params?.categories) params.categories.forEach(cat => searchParams.append('categories', cat))
    if (params?.locations) params.locations.forEach(loc => searchParams.append('locations', loc))
    if (params?.minRating !== undefined) searchParams.set('minRating', params.minRating.toString())
    if (params?.maxRating !== undefined) searchParams.set('maxRating', params.maxRating.toString())
    if (params?.minPrice !== undefined) searchParams.set('minPrice', params.minPrice.toString())
    if (params?.maxPrice !== undefined) searchParams.set('maxPrice', params.maxPrice.toString())
    if (params?.includeStatistics) searchParams.set('includeStatistics', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<any>(`/api/authority/attractions/export${query ? `?${query}` : ''}`)
  },

  // Get comprehensive attraction comparison data
  getAttractionComparisonData: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    metrics?: string[]
    includeBenchmarks?: boolean
    includeRecommendations?: boolean
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.metrics) params.metrics.forEach(metric => searchParams.append('metrics', metric))
    if (params?.includeBenchmarks) searchParams.set('includeBenchmarks', 'true')
    if (params?.includeRecommendations) searchParams.set('includeRecommendations', 'true')
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/attraction-comparison-data${query ? `?${query}` : ''}`)
  },

  // Get category-wise performance statistics
  getCategoryPerformanceStats: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    includeComparisons?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeComparisons) searchParams.set('includeComparisons', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/category-performance${query ? `?${query}` : ''}`)
  },

  // Get performance benchmarks
  getPerformanceBenchmarks: (params?: {
    metrics?: string[]
    includeIndustryData?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.metrics) params.metrics.forEach(metric => searchParams.append('metrics', metric))
    if (params?.includeIndustryData) searchParams.set('includeIndustryData', 'true')
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/performance-benchmarks${query ? `?${query}` : ''}`)
  },

  // Get improvement recommendations
  getImprovementRecommendations: (params?: {
    attractionIds?: number[]
    includeAIInsights?: boolean
    minImpactThreshold?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.attractionIds) params.attractionIds.forEach(id => searchParams.append('attractionIds', id.toString()))
    if (params?.includeAIInsights) searchParams.set('includeAIInsights', 'true')
    if (params?.minImpactThreshold) searchParams.set('minImpactThreshold', params.minImpactThreshold.toString())
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/improvement-recommendations${query ? `?${query}` : ''}`)
  },

  // Get performance ranking table data
  getPerformanceRankings: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    metrics?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.metrics) params.metrics.forEach(metric => searchParams.append('metrics', metric))
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/performance-rankings${query ? `?${query}` : ''}`)
  },

  // Report Management for Authority
  // Get all reports for authority
  getReports: (params?: {
    limit?: number
    offset?: number
    reportType?: string
    dateFrom?: string
    dateTo?: string
    attractionId?: number
    sortBy?: 'date' | 'type' | 'title'
    sortOrder?: 'asc' | 'desc'
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.reportType) searchParams.set('reportType', params.reportType)
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)
    if (params?.attractionId) searchParams.set('attractionId', params.attractionId.toString())
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/reports${query ? `?${query}` : ''}`)
  },

  // Generate a new report
  generateReport: (reportConfig: {
    reportType: 'visitor_analysis' | 'revenue_report' | 'attraction_performance' | 'demographic_insights' | 'custom'
    reportTitle: string
    description?: string
    dateRange: string
    attractionId?: number
    includeCharts?: boolean
    format?: 'pdf' | 'excel' | 'csv'
    filters?: {
      categories?: string[]
      ageGroups?: string[]
      timeOfDay?: string[]
      dayOfWeek?: string[]
    }
    customQueries?: string[]
  }) => apiClient.post<ApiResponse<any>>('/api/authority/reports/generate', reportConfig),

  // Get specific report details
  getReport: (reportId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/authority/reports/${reportId}`),

  // Download report file
  downloadReport: (reportId: number, format?: 'pdf' | 'excel' | 'csv') => {
    const searchParams = new URLSearchParams()
    if (format) searchParams.set('format', format)
    
    const query = searchParams.toString()
    return fetch(`${API_BASE_URL}/api/authority/reports/${reportId}/download${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
      }
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Download failed: ${response.status}`)
      }
      return response.blob()
    })
  },

  // Delete a report
  deleteReport: (reportId: number) =>
    apiClient.delete<ApiResponse<any>>(`/api/authority/reports/${reportId}`),

  // Get report templates
  getReportTemplates: () =>
    apiClient.get<ApiResponse<any>>('/api/authority/reports/templates'),

  // Create custom report template
  createReportTemplate: (template: {
    name: string
    description: string
    reportType: string
    defaultFilters: any
    queries: string[]
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  }) => apiClient.post<ApiResponse<any>>('/api/authority/reports/templates', template),

  // Get report statistics
  getReportStats: () =>
    apiClient.get<ApiResponse<any>>('/api/authority/reports/stats'),

  // Get available report types and their configurations
  getReportTypes: () =>
    apiClient.get<ApiResponse<any>>('/api/authority/reports/types'),

  // Schedule automated report generation
  scheduleReport: (schedule: {
    reportTemplateId: number
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    recipients: string[]
    enabled: boolean
  }) => apiClient.post<ApiResponse<any>>('/api/authority/reports/schedule', schedule),

  // Get scheduled reports
  getScheduledReports: () =>
    apiClient.get<ApiResponse<any>>('/api/authority/reports/scheduled'),

  // Predictive Analytics endpoints
  getPredictiveAnalytics: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    includeForecasts?: boolean
    forecastPeriod?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.includeForecasts) searchParams.set('includeForecasts', 'true')
    if (params?.forecastPeriod) searchParams.set('forecastPeriod', params.forecastPeriod.toString())
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/predictive-analytics${query ? `?${query}` : ''}`)
  },

  // Get forecast accuracy metrics
  getForecastAccuracy: (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    modelType?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.period) searchParams.set('period', params.period)
    if (params?.modelType) searchParams.set('modelType', params.modelType)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/forecast-accuracy${query ? `?${query}` : ''}`)
  },

  // Profile Management endpoints
  getProfile: () =>
    apiClient.get<ApiResponse<any>>('/api/authority/profile'),

  // Update authority profile
  updateProfile: (profileData: {
    email?: string
    phoneNumber?: string
    postcode?: string
    bio?: string
    notifications?: {
      emailAlerts?: boolean
      smsAlerts?: boolean
      weeklyReports?: boolean
      monthlyReports?: boolean
    }
    preferences?: {
      defaultChartType?: string
      dateFormat?: string
      timezone?: string
      theme?: string
    }
  }) => apiClient.put<ApiResponse<any>>('/api/authority/profile', profileData),

  // Upload profile picture
  uploadProfilePicture: (file: File) => {
    const formData = new FormData()
    formData.append('profilePicture', file)
    return fetch(`${API_BASE_URL}/api/authority/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed: ${response.status}`)
      }
      return response.json()
    })
  },

  // Get profile statistics
  getProfileStats: () =>
    apiClient.get<ApiResponse<any>>('/api/authority/profile/stats'),

  // Get activity log
  getActivityLog: (params?: {
    limit?: number
    offset?: number
    type?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.type) searchParams.set('type', params.type)
    
    const query = searchParams.toString()
    return apiClient.get<ApiResponse<any>>(`/api/authority/activity-log${query ? `?${query}` : ''}`)
  },

  // Change password
  changePassword: (passwordData: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => apiClient.post<ApiResponse<any>>('/api/authority/profile/change-password', passwordData),

  // Delete account
  deleteAccount: (password: string) =>
    apiClient.delete<ApiResponse<any>>(`/api/authority/profile?password=${encodeURIComponent(password)}`),
}
