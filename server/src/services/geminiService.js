const { GoogleGenerativeAI } = require('@google/generative-ai')

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.log('Warning: GEMINI_API_KEY not configured. Predictive analytics will use fallback data.')
      this.genAI = null
      this.model = null
    } else {
      console.log('Gemini AI initialized successfully')
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    }
  }

  /**
   * Check if we can make a request without hitting rate limits
   */
  canMakeRequest() {
    const now = Date.now()
    
    // Reset daily counter if it's a new day
    if (now >= this.dailyResetTime.getTime()) {
      this.requestCount = 0
      this.dailyResetTime.setTime(now + 24 * 60 * 60 * 1000) // Next 24 hours
      console.log('🔄 Daily request counter reset')
    }
    
    // Check daily limit
    if (this.requestCount >= this.dailyRequestLimit) {
      console.log(`⚠️  Daily request limit reached (${this.requestCount}/${this.dailyRequestLimit})`)
      return false
    }
    
    // Check time interval
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      console.log(`⏱️  Rate limiting: need to wait ${waitTime}ms`)
      return false
    }
    
    return true
  }

  /**
   * Wait for rate limit if needed
   */
  async waitForRateLimit() {
    if (!this.canMakeRequest()) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      const waitTime = Math.max(this.minRequestInterval - timeSinceLastRequest, 0)
      
      if (waitTime > 0) {
        console.log(`⏱️  Waiting ${waitTime}ms for rate limit...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  /**
   * Make a rate-limited request to Gemini AI
   */
  async makeRateLimitedRequest(prompt, retries = 2) {
    // Check daily limit first
    if (this.requestCount >= this.dailyRequestLimit) {
      throw new Error(`Daily request limit exceeded (${this.requestCount}/${this.dailyRequestLimit}). Using fallback data.`)
    }
    
    await this.waitForRateLimit()
    
    try {
      console.log(`🤖 Making Gemini AI request (${this.requestCount + 1}/${this.dailyRequestLimit})`)
      
      this.lastRequestTime = Date.now()
      this.requestCount++
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log(`✅ AI response received successfully`)
      return text
      
    } catch (error) {
      console.log(`❌ AI request failed: ${error.message}`)
      
      // Handle specific rate limit errors
      if (error.status === 429 || error.message.includes('Too Many Requests')) {
        console.log('🚫 Rate limit hit - implementing exponential backoff')
        
        if (retries > 0) {
          const backoffTime = (3 - retries) * 5000 + Math.random() * 2000 // 5-7s, then 10-12s
          console.log(`⏳ Waiting ${backoffTime}ms before retry (${retries} retries left)`)
          
          await new Promise(resolve => setTimeout(resolve, backoffTime))
          return this.makeRateLimitedRequest(prompt, retries - 1)
        }
      }
      
      throw error
    }
  }

  /**
   * Generate predictive analytics based on historical tourism data
   * @param {Object} historicalData - Historical visit and revenue data
   * @param {Object} options - Analysis options (period, forecast horizon, etc.)
   * @returns {Object} Predictive analytics results
   */
  async generatePredictiveAnalytics(historicalData, options = {}) {
    try {
      const {
        period = 'month',
        forecastHorizon = 6,
        includeSeasonality = true,
        includeTrends = true
      } = options

      // Check if API key is available
      if (!this.model) {
        console.log('Gemini API not available, using fallback data')
        return this.generateFallbackPredictiveData(options)
      }

      console.log(`Generating AI-powered predictive analytics for ${period} with real data...`)

      const prompt = this.buildPredictiveAnalyticsPrompt(historicalData, options)
      console.log(`Prompt length: ${prompt.length} characters`)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log(`AI response received, length: ${text.length} characters`)
      
      // Parse the structured response
      return this.parsePredictiveResponse(text, options)
      
    } catch (error) {
      console.error('❌ Error generating predictive analytics:', error.message)
      
      // For rate limit errors, throw the error to let the caller handle it
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
        throw new Error(`AI service temporarily unavailable due to rate limits. Please try again later. (${error.message})`)
      }
      
      console.error('Full error:', error)
      console.log('🔄 Falling back to default predictive data')
      // Return fallback data for other errors
      return this.generateFallbackPredictiveData(options)
    }
  }

  /**
   * Generate insights and recommendations based on tourism data
   * @param {Object} data - Current tourism data and metrics
   * @returns {Object} AI insights and recommendations
   */
  async generateInsights(data) {
    try {
      if (!this.model) {
        return this.generateFallbackInsights()
      }

      const prompt = this.buildInsightsPrompt(data)
      
      // Use rate-limited request
      const text = await this.makeRateLimitedRequest(prompt)
      
      return this.parseInsightsResponse(text)
    } catch (error) {
      console.error('Error generating insights:', error.message)
      return this.generateFallbackInsights()
    }
  }

  /**
   * Analyze trend factors affecting tourism
   * @param {Object} data - Tourism and external factor data
   * @returns {Array} Trend factors with impact analysis
   */
  async analyzeTrendFactors(data) {
    try {
      if (!this.model) {
        return this.generateFallbackTrendFactors()
      }

      const prompt = this.buildTrendAnalysisPrompt(data)
      
      // Use rate-limited request
      const text = await this.makeRateLimitedRequest(prompt)
      
      return this.parseTrendFactorsResponse(text)
    } catch (error) {
      console.error('Error analyzing trend factors:', error.message)
      return this.generateFallbackTrendFactors()
    }
  }

  /**
   * Build prompt for predictive analytics
   */
  buildPredictiveAnalyticsPrompt(data, options) {
    const { period, forecastHorizon } = options
    
    // Period-specific analysis instructions
    const periodInstructions = {
      'week': 'Focus on short-term daily patterns, weekend vs weekday trends, and immediate booking patterns. Analyze hourly/daily fluctuations. Provide week-specific insights.',
      'month': 'Analyze monthly trends, seasonal effects, and holiday impacts. Focus on mid-term planning and monthly revenue cycles. Provide month-specific insights.',
      'quarter': 'Focus on quarterly business cycles, seasonal tourism patterns, and strategic planning metrics. Emphasize 3-month trend analysis. Provide quarter-specific insights.',
      'year': 'Analyze annual patterns, long-term growth trends, economic cycles, and year-over-year comparisons. Focus on strategic insights. Provide yearly planning insights.'
    }

    // Period-specific metrics adjustments
    const periodMetrics = {
      'week': {
        growthRange: '2-8%',
        visitorRange: '5000-20000',
        insights: 'daily operations and short-term optimization'
      },
      'month': {
        growthRange: '5-15%', 
        visitorRange: '12000-30000',
        insights: 'monthly planning and seasonal preparation'
      },
      'quarter': {
        growthRange: '8-25%',
        visitorRange: '25000-60000', 
        insights: 'quarterly strategy and long-term trends'
      },
      'year': {
        growthRange: '10-40%',
        visitorRange: '50000-150000',
        insights: 'annual planning and strategic decisions'
      }
    }

    const currentDate = new Date().toISOString().split('T')[0]
    const metrics = periodMetrics[period] || periodMetrics['month']
    
    return `
As a tourism analytics expert, analyze the following historical tourism data and generate predictive analytics 
SPECIFICALLY FOR ${period.toUpperCase()} ANALYSIS:

ANALYSIS CONTEXT:
- Current Date: ${currentDate}
- Analysis Period: ${period} 
- Forecast Horizon: ${forecastHorizon} months
- Target Metrics: ${metrics.insights}
- Expected Growth Range: ${metrics.growthRange}
- Expected Visitor Range: ${metrics.visitorRange}

PERIOD-SPECIFIC REQUIREMENTS:
${periodInstructions[period] || periodInstructions['month']}

HISTORICAL DATA:
${JSON.stringify(data, null, 2)}

CRITICAL INSTRUCTIONS:
- Generate predictions that are UNIQUELY RELEVANT to ${period} analysis timeframe
- Use growth rates within ${metrics.growthRange} range
- Use visitor forecasts within ${metrics.visitorRange} range  
- Create insights that are ACTIONABLE for ${period} planning
- Ensure ALL predictions vary meaningfully based on ${period} context
- Make trend factors specific to ${period} decision-making needs

Please provide a JSON response with the following structure:
{
  "forecastMetrics": {
    "nextMonthVisitors": number (within ${metrics.visitorRange}),
    "nextMonthRevenue": number,
    "quarterlyRevenue": number,
    "seasonalIndex": number (0.5-2.0),
    "accuracyScore": number (85-98),
    "growthRate": number (within ${metrics.growthRange})
  },
  "revenueScenarios": [
    {
      "month": "YYYY-MM",
      "optimistic": number,
      "realistic": number,
      "pessimistic": number,
      "confidence": number (70-95)
    }
  ],
  "visitorScenarios": [
    {
      "month": "YYYY-MM",
      "optimistic": number,
      "realistic": number,
      "pessimistic": number,
      "confidence": number (70-95)
    }
  ],
  "insights": {
    "keyPredictions": [
      "Prediction SPECIFIC to ${period} analysis and planning",
      "Trend prediction RELEVANT for ${period} timeframe",
      "Forecast insight ACTIONABLE for ${period} decisions"
    ],
    "riskFactors": [
      "Risk factor SPECIFIC to ${period} timeframe", 
      "Challenge RELEVANT for ${period} planning"
    ],
    "opportunities": [
      "Opportunity ALIGNED with ${period} strategy",
      "Growth potential for ${period} execution"
    ]
  }
}

MANDATORY: All numbers, predictions, and insights must be DISTINCTLY DIFFERENT for each period type (week/month/quarter/year). Use the period context to generate meaningfully different results.
`
  }

  /**
   * Build prompt for insights generation
   */
  buildInsightsPrompt(data) {
    return `
As a tourism expert, analyze the following current tourism data and provide actionable insights:

CURRENT DATA:
${JSON.stringify(data, null, 2)}

Please provide insights in JSON format:
{
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "alerts": ["alert1", "alert2"],
  "performance": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "improvements": ["improvement1", "improvement2"]
  }
}

Focus on actionable insights that can help improve tourism performance and visitor satisfaction.
`
  }

  /**
   * Build prompt for trend factor analysis
   */
  buildTrendAnalysisPrompt(data) {
    return `
Analyze the following tourism data and identify key trend factors affecting visitor patterns:

DATA:
${JSON.stringify(data, null, 2)}

Provide analysis in JSON format:
{
  "trendFactors": [
    {
      "factor": "Factor Name",
      "impact": "positive|negative|neutral",
      "description": "Detailed description",
      "expectedChange": number (percentage),
      "category": "weather|events|economic|seasonal|marketing|external",
      "confidence": number (70-95)
    }
  ],
  "seasonalPatterns": {
    "peakSeason": "description",
    "offSeason": "description",
    "transitions": ["pattern1", "pattern2"]
  }
}

Consider seasonal patterns, economic factors, events, weather, and marketing impacts.
`
  }

  /**
   * Parse predictive analytics response from Gemini
   */
  parsePredictiveResponse(text, options) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return this.generateFallbackPredictiveData(options)
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and sanitize the response
      return {
        forecastMetrics: {
          nextMonthVisitors: Math.max(0, parsed.forecastMetrics?.nextMonthVisitors || 15000),
          nextMonthRevenue: Math.max(0, parsed.forecastMetrics?.nextMonthRevenue || 280000),
          quarterlyRevenue: Math.max(0, parsed.forecastMetrics?.quarterlyRevenue || 850000),
          seasonalIndex: Math.max(0.5, Math.min(2.0, parsed.forecastMetrics?.seasonalIndex || 1.15)),
          accuracyScore: Math.max(85, Math.min(98, parsed.forecastMetrics?.accuracyScore || 94.2)),
          growthRate: parsed.forecastMetrics?.growthRate || 8.5
        },
        revenueScenarios: parsed.revenueScenarios || this.generateDefaultScenarios('revenue', options.forecastHorizon),
        visitorScenarios: parsed.visitorScenarios || this.generateDefaultScenarios('visitors', options.forecastHorizon),
        insights: {
          keyPredictions: parsed.insights?.keyPredictions || [
            "Tourism growth expected to continue",
            "Seasonal patterns indicate strong Q3 performance",
            "Digital engagement driving younger demographics"
          ],
          riskFactors: parsed.insights?.riskFactors || [
            "Weather dependency remains significant",
            "Economic uncertainty may impact international visitors"
          ],
          opportunities: parsed.insights?.opportunities || [
            "Growing eco-tourism segment",
            "Digital marketing showing strong ROI"
          ]
        }
      }
    } catch (error) {
      console.error('Error parsing predictive response:', error)
      return this.generateFallbackPredictiveData(options)
    }
  }

  /**
   * Parse insights response from Gemini
   */
  parseInsightsResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return this.generateFallbackInsights()
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Error parsing insights response:', error)
      return this.generateFallbackInsights()
    }
  }

  /**
   * Parse trend factors response from Gemini
   */
  parseTrendFactorsResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return this.generateFallbackTrendFactors()
      }

      const parsed = JSON.parse(jsonMatch[0])
      return parsed.trendFactors || this.generateFallbackTrendFactors()
    } catch (error) {
      console.error('Error parsing trend factors response:', error)
      return this.generateFallbackTrendFactors()
    }
  }

  /**
   * Generate fallback predictive data if AI fails
   */
  generateFallbackPredictiveData(options) {
    const { forecastHorizon = 6 } = options
    
    return {
      forecastMetrics: {
        nextMonthVisitors: 15000,
        nextMonthRevenue: 280000,
        quarterlyRevenue: 850000,
        seasonalIndex: 1.15,
        accuracyScore: 94.2,
        growthRate: 8.5
      },
      revenueScenarios: this.generateDefaultScenarios('revenue', forecastHorizon),
      visitorScenarios: this.generateDefaultScenarios('visitors', forecastHorizon),
      insights: {
        keyPredictions: [
          "Tourism growth expected to continue based on historical trends",
          "Seasonal patterns suggest strong performance in upcoming months",
          "Digital engagement initiatives showing positive impact"
        ],
        riskFactors: [
          "Weather dependency remains a significant factor",
          "Economic uncertainty may impact visitor spending"
        ],
        opportunities: [
          "Growing interest in sustainable tourism options",
          "Digital marketing channels showing strong conversion rates"
        ]
      }
    }
  }

  /**
   * Generate fallback insights
   */
  generateFallbackInsights() {
    return {
      keyInsights: [
        "Visitor engagement remains strong across all attraction categories",
        "Revenue per visitor showing consistent upward trend",
        "Digital marketing initiatives contributing to growth"
      ],
      recommendations: [
        "Focus on peak season capacity optimization",
        "Enhance digital visitor experience platforms",
        "Develop weather-resilient attraction options"
      ],
      alerts: [
        "Monitor capacity during upcoming peak season",
        "Weather patterns may affect outdoor attractions"
      ],
      performance: {
        strengths: [
          "Strong visitor satisfaction ratings",
          "Consistent revenue growth patterns"
        ],
        weaknesses: [
          "Weather dependency for outdoor attractions",
          "Limited off-season activity options"
        ],
        improvements: [
          "Diversify attraction portfolio",
          "Enhance visitor data collection systems"
        ]
      }
    }
  }

  /**
   * Generate fallback trend factors
   */
  generateFallbackTrendFactors() {
    return [
      {
        factor: "Seasonal Tourism Patterns",
        impact: "positive",
        description: "Favorable season approaching with expected 25% increase in visitors",
        expectedChange: 25,
        category: "seasonal",
        confidence: 90
      },
      {
        factor: "Economic Indicators",
        impact: "positive", 
        description: "Strong economic outlook supporting discretionary travel spending",
        expectedChange: 12,
        category: "economic",
        confidence: 85
      },
      {
        factor: "Weather Conditions",
        impact: "positive",
        description: "Favorable weather forecasts expected to boost outdoor attraction visits",
        expectedChange: 18,
        category: "weather",
        confidence: 75
      },
      {
        factor: "Marketing Campaigns",
        impact: "positive",
        description: "Digital marketing initiatives showing strong ROI and visitor acquisition",
        expectedChange: 15,
        category: "marketing",
        confidence: 88
      }
    ]
  }

  /**
   * Generate chat response based on tourism database context
   * @param {string} userMessage - User's chat message
   * @param {Object} databaseContext - Current database context and statistics
   * @param {Array} chatHistory - Previous chat messages for context
   * @returns {Object} Chat response with message and suggestions
   */
  async generateChatResponse(userMessage, databaseContext = {}, chatHistory = []) {
    try {
      if (!this.model) {
        return this.generateFallbackChatResponse(userMessage)
      }

      console.log('🤖 Generating AI chat response for:', userMessage.substring(0, 100) + '...')

      const prompt = this.buildChatPrompt(userMessage, databaseContext, chatHistory)
      
      // Use rate-limited request
      const text = await this.makeRateLimitedRequest(prompt)
      
      return this.parseChatResponse(text, userMessage, databaseContext)
    } catch (error) {
      console.error('Error generating chat response:', error.message)
      return this.generateFallbackChatResponse(userMessage, databaseContext)
    }
  }

  /**
   * Build chat prompt with database context
   */
  buildChatPrompt(userMessage, databaseContext, chatHistory) {
    const conversationHistory = chatHistory.slice(-5).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n')

    // Build detailed database insights
    const categoryBreakdown = databaseContext.categoryBreakdown?.map(cat => 
      `${cat.category}: ${cat.count} attractions (${cat.percentage}%), avg rating: ${cat.avgRating}, avg price: $${cat.avgPrice}`
    ).join('\n- ') || 'No category data available'

    const topAttractionsInfo = databaseContext.topAttractions?.slice(0, 5).map(attr => 
      `${attr.name} (${attr.category}) - Rating: ${attr.rating}, Price: $${attr.price}, Visits: ${attr.visitCount}`
    ).join('\n- ') || 'No attraction data available'

    const categoryStatsInfo = databaseContext.categoryStats?.map(stat => 
      `${stat.category}: ${stat.attractionCount} attractions, ${stat.totalVisits} visits, $${stat.totalRevenue} revenue, avg rating: ${stat.avgRating}`
    ).join('\n- ') || 'No category statistics available'

    const monthlyTrendsInfo = databaseContext.monthlyTrends?.slice(-3).map(trend => 
      `${trend.month}: $${trend.revenue} revenue, ${trend.visits} visits, $${trend.avgRevenuePerVisit} per visit`
    ).join('\n- ') || 'No trend data available'

    return `
You are TourEase AI, an intelligent tourism database assistant with REAL-TIME ACCESS to comprehensive tourism data. You help tourism authorities analyze data, understand trends, and make informed decisions about attractions, visitors, and tourism management.

LIVE DATABASE CONTEXT (Current Real Data):
═══════════════════════════════════════════════

📊 OVERVIEW STATISTICS:
- Total Attractions: ${databaseContext.totalAttractions}
- Total Visits: ${databaseContext.totalVisits}
- Total Revenue: $${databaseContext.totalRevenue?.toLocaleString()}
- Average Rating: ${databaseContext.avgRating}/5.0
- Active Attraction Owners: ${databaseContext.activeOwners}
- Categories Available: ${databaseContext.categories?.join(', ')}

🏛️ CATEGORY BREAKDOWN (Live Data):
- ${categoryBreakdown}

🎯 TOP PERFORMING ATTRACTIONS (Live Data):
- ${topAttractionsInfo}

📈 CATEGORY PERFORMANCE STATISTICS (Live Data):
- ${categoryStatsInfo}

📅 RECENT MONTHLY TRENDS (Live Data):
- ${monthlyTrendsInfo}

🔥 RECENT ACTIVITY INSIGHTS:
- Last Week Visits: ${databaseContext.recentActivity?.lastWeekVisits || 0}
- Average Recent Rating: ${databaseContext.recentActivity?.avgRecentRating || 0}/5.0
- Popular Recent Categories: ${Object.entries(databaseContext.recentActivity?.topRecentCategories || {}).map(([cat, count]) => `${cat} (${count})`).join(', ')}

CAPABILITIES WITH LIVE DATA:
- Real-time attraction performance analysis
- Live visitor behavior patterns
- Current revenue and pricing insights
- Category distribution and performance comparison
- Recent trends and seasonal patterns
- Specific attraction recommendations based on actual data

RECENT CONVERSATION:
${conversationHistory || 'No previous conversation'}

USER QUESTION: ${userMessage}

CRITICAL INSTRUCTIONS:
- You have COMPLETE ACCESS to the live database shown above
- Use SPECIFIC NUMBERS and DATA from the context in your responses
- Provide CONCRETE INSIGHTS based on the real data provided
- When discussing categories, use the EXACT BREAKDOWN and statistics shown
- Reference SPECIFIC ATTRACTIONS by name when relevant
- Use ACTUAL REVENUE FIGURES and visit counts in your analysis
- Provide ACTIONABLE RECOMMENDATIONS based on the real performance data
- If asked about trends, use the ACTUAL MONTHLY DATA provided
- Be SPECIFIC about performance differences between categories
- Mention EXACT PERCENTAGES and comparisons from the live data

RESPONSE FORMAT:
{
  "message": "Your detailed response using SPECIFIC DATA from the database context above",
  "suggestions": [
    "Follow-up question based on actual data patterns",
    "Specific analysis suggestion using real numbers", 
    "Actionable insight based on live database trends"
  ],
  "dataInsights": [
    "Key insight with SPECIFIC NUMBERS from live data",
    "Relevant statistic or trend with EXACT FIGURES"
  ],
  "actionItems": [
    "Specific recommendation based on actual performance data"
  ]
}

Respond in JSON format only. Use the live database context extensively to provide intelligent, data-driven responses.
`
  }

  /**
   * Parse chat response from Gemini
   */
  parseChatResponse(text, userMessage, databaseContext = {}) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return this.generateFallbackChatResponse(userMessage, databaseContext)
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        message: parsed.message || "I understand your question about tourism data. Let me help you with that.",
        suggestions: parsed.suggestions || [
          "Show me attraction statistics",
          "What are the top-performing categories?",
          "Tell me about visitor trends"
        ],
        dataInsights: parsed.dataInsights || [
          "Your tourism database contains valuable insights",
          "Data analysis can help improve decision making"
        ],
        actionItems: parsed.actionItems || [
          "Review the data dashboard for more details"
        ]
      }
    } catch (error) {
      console.error('Error parsing chat response:', error)
      return this.generateFallbackChatResponse(userMessage, databaseContext)
    }
  }

  /**
   * Generate fallback chat response
   */
  generateFallbackChatResponse(userMessage, databaseContext = {}) {
    const lowerMessage = userMessage.toLowerCase()
    
    // Use real database context if available
    const hasRealData = databaseContext.totalAttractions > 0
    
    // Category-specific responses with real data
    if (lowerMessage.includes('category') || lowerMessage.includes('categories')) {
      if (hasRealData && databaseContext.categoryBreakdown) {
        const topCategory = databaseContext.categoryBreakdown.reduce((max, cat) => 
          cat.count > max.count ? cat : max, databaseContext.categoryBreakdown[0])
        
        return {
          message: `Based on your current database, you have ${databaseContext.totalAttractions} attractions across ${databaseContext.totalCategories} categories. The largest category is ${topCategory.category} with ${topCategory.count} attractions (${topCategory.percentage}% of total). The category breakdown shows: ${databaseContext.categoryBreakdown.map(cat => `${cat.category}: ${cat.count} attractions`).join(', ')}.`,
          suggestions: [
            `Tell me more about ${topCategory.category} attractions`,
            "Which category has the best performance?",
            "Show me category revenue comparison"
          ],
          dataInsights: [
            `${topCategory.category} is your most represented category with ${topCategory.percentage}% of attractions`,
            `Average rating across categories ranges from ${Math.min(...databaseContext.categoryBreakdown.map(c => parseFloat(c.avgRating)))} to ${Math.max(...databaseContext.categoryBreakdown.map(c => parseFloat(c.avgRating)))}`
          ],
          actionItems: [
            `Consider balancing your portfolio - ${topCategory.category} dominates with ${topCategory.percentage}% of attractions`
          ]
        }
      }
    }
    
    // Revenue-specific responses with real data
    if (lowerMessage.includes('revenue') || lowerMessage.includes('money') || lowerMessage.includes('profit')) {
      if (hasRealData && databaseContext.totalRevenue) {
        return {
          message: `Your tourism database shows total revenue of $${databaseContext.totalRevenue.toLocaleString()} from ${databaseContext.totalVisits} visits. This gives an average revenue per visit of $${(databaseContext.totalRevenue / databaseContext.totalVisits).toFixed(2)}. ${databaseContext.categoryStats ? `Top revenue categories include: ${databaseContext.categoryStats.slice(0, 3).map(cat => `${cat.category} ($${cat.totalRevenue.toLocaleString()})`).join(', ')}.` : ''}`,
          suggestions: [
            "Which attractions generate the most revenue?",
            "Show me revenue trends over time",
            "How can I optimize pricing strategies?"
          ],
          dataInsights: [
            `Average revenue per visit: $${(databaseContext.totalRevenue / databaseContext.totalVisits).toFixed(2)}`,
            `Total visits generating revenue: ${databaseContext.totalVisits.toLocaleString()}`
          ],
          actionItems: [
            "Analyze pricing strategies for underperforming categories"
          ]
        }
      }
    }
    
    // Attraction-specific responses
    if (lowerMessage.includes('attraction') || lowerMessage.includes('tourist')) {
      if (hasRealData && databaseContext.topAttractions) {
        const topAttraction = databaseContext.topAttractions[0]
        return {
          message: `You have ${databaseContext.totalAttractions} attractions with an average rating of ${databaseContext.avgRating}/5.0. Your top-performing attraction is "${topAttraction.name}" in the ${topAttraction.category} category with ${topAttraction.visitCount} visits and a ${topAttraction.rating}/5.0 rating. ${databaseContext.recentActivity ? `Recently, you've had ${databaseContext.recentActivity.lastWeekVisits} visits in the past week with an average rating of ${databaseContext.recentActivity.avgRecentRating}/5.0.` : ''}`,
          suggestions: [
            `Analyze ${topAttraction.name}'s success factors`,
            "Which attractions need improvement?",
            "Show me visitor satisfaction trends"
          ],
          dataInsights: [
            `${topAttraction.name} leads with ${topAttraction.visitCount} visits`,
            `${databaseContext.recentActivity?.lastWeekVisits || 0} visits recorded in the past week`
          ],
          actionItems: [
            `Study ${topAttraction.name}'s success to improve other attractions`
          ]
        }
      }
    }
    
    // Predictive/forecast responses
    if (lowerMessage.includes('predict') || lowerMessage.includes('forecast') || lowerMessage.includes('future')) {
      if (hasRealData && databaseContext.monthlyTrends) {
        const latestTrend = databaseContext.monthlyTrends[databaseContext.monthlyTrends.length - 1]
        return {
          message: `Based on your historical data, I can generate predictive analytics for tourism trends. Your latest monthly data shows $${latestTrend?.revenue || 0} in revenue from ${latestTrend?.visits || 0} visits. With ${databaseContext.totalAttractions} attractions across ${databaseContext.totalCategories} categories, we can forecast visitor patterns, revenue projections, and seasonal trends.`,
          suggestions: [
            "Generate next month's visitor forecast",
            "Predict seasonal revenue trends",
            "What factors affect tourism growth?"
          ],
          dataInsights: [
            `Recent monthly performance: $${latestTrend?.revenue || 0} revenue`,
            `Current database contains ${databaseContext.totalVisits} historical visits for analysis`
          ],
          actionItems: [
            "Use historical patterns to optimize future marketing campaigns"
          ]
        }
      }
    }
    
    // Default response with real data context
    if (hasRealData) {
      return {
        message: `Hello! I'm TourEase AI with access to your live tourism database. You currently have ${databaseContext.totalAttractions} attractions generating $${databaseContext.totalRevenue?.toLocaleString()} in revenue from ${databaseContext.totalVisits} visits. Your attractions have an average rating of ${databaseContext.avgRating}/5.0 across ${databaseContext.totalCategories} categories. I can help you analyze this data, understand visitor patterns, and make data-driven decisions.`,
        suggestions: [
          `Analyze your ${databaseContext.totalAttractions} attractions performance`,
          "Show detailed category breakdown",
          "Generate revenue optimization insights"
        ],
        dataInsights: [
          `${databaseContext.totalAttractions} attractions with ${databaseContext.avgRating}/5.0 average rating`,
          `$${databaseContext.totalRevenue?.toLocaleString()} total revenue from ${databaseContext.totalVisits} visits`
        ],
        actionItems: [
          "Ask me specific questions about your tourism performance data"
        ]
      }
    }
    
    // Final fallback if no data
    return {
      message: "Hello! I'm TourEase AI, your tourism data assistant. I can help you analyze attractions, understand visitor patterns, predict trends, and make data-driven decisions for tourism management.",
      suggestions: [
        "Tell me about attraction performance",
        "Show me visitor statistics", 
        "Generate predictive insights"
      ],
      dataInsights: [
        "Your database contains tourism data ready for analysis",
        "AI analysis can reveal hidden patterns"
      ],
      actionItems: [
        "Ask me specific questions about your tourism data"
      ]
    }
  }

  /**
   * Generate default scenarios for fallback data
   */
  generateDefaultScenarios(type, forecastHorizon = 6) {
    const baseValue = type === 'revenue' ? 50000 : 1000;
    const scenarios = [];
    
    // Generate scenarios for each month in forecast horizon
    for (let i = 1; i <= forecastHorizon; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      // Generate optimistic scenario (15-25% growth)
      const optimisticGrowth = 0.15 + (Math.random() * 0.1);
      const optimisticValue = Math.round(baseValue * (1 + optimisticGrowth));
      
      // Generate realistic scenario (5-15% growth)
      const realisticGrowth = 0.05 + (Math.random() * 0.1);
      const realisticValue = Math.round(baseValue * (1 + realisticGrowth));
      
      // Generate conservative scenario (0-8% growth)
      const conservativeGrowth = Math.random() * 0.08;
      const conservativeValue = Math.round(baseValue * (1 + conservativeGrowth));
      
      scenarios.push({
        period: date.toISOString().slice(0, 7), // YYYY-MM format
        date: date.toISOString(),
        optimistic: optimisticValue,
        realistic: realisticValue,
        conservative: conservativeValue,
        confidence: {
          optimistic: 65 + Math.round(Math.random() * 15), // 65-80%
          realistic: 80 + Math.round(Math.random() * 15), // 80-95%
          conservative: 85 + Math.round(Math.random() * 10) // 85-95%
        },
        factors: [
          `Seasonal ${type} patterns for ${date.toLocaleDateString('en-US', { month: 'long' })}`,
          "Market trend analysis",
          "Historical performance indicators"
        ]
      });
    }
    
    return scenarios;
  }
}

module.exports = new GeminiService()
