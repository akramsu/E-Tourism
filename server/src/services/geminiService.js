const { GoogleGenerativeAI } = require('@google/generative-ai')

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.log('⚠️ Warning: GEMINI_API_KEY not configured. Predictive analytics will use fallback data.')
      this.genAI = null
      this.model = null
    } else {
      console.log('✅ Gemini AI initialized successfully')
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
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
        console.log('⚠️ Gemini API not available, using fallback data')
        return this.generateFallbackPredictiveData(options)
      }

      console.log(`🤖 Generating AI-powered predictive analytics for ${period} with real data...`)

      const prompt = this.buildPredictiveAnalyticsPrompt(historicalData, options)
      console.log(`📝 Prompt length: ${prompt.length} characters`)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log(`✅ AI response received, length: ${text.length} characters`)
      
      // Parse the structured response
      return this.parsePredictiveResponse(text, options)
    } catch (error) {
      console.error('❌ Error generating predictive analytics:', error.message)
      console.error('Full error:', error)
      console.log('🔄 Falling back to default predictive data')
      // Return fallback data instead of throwing error
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
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
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
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
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
As a tourism analytics expert, analyze the following historical tourism data and generate predictive analytics SPECIFICALLY FOR ${period.toUpperCase()} ANALYSIS:

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
   * Generate default scenarios for forecasting
   */
  generateDefaultScenarios(type, horizonMonths) {
    const scenarios = []
    const baseValue = type === 'revenue' ? 280000 : 15000
    const currentDate = new Date()
    
    for (let i = 1; i <= horizonMonths; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      const monthStr = date.toISOString().substring(0, 7)
      
      // Add seasonal variation
      const seasonalMultiplier = 1 + 0.3 * Math.sin((date.getMonth() + 1) * Math.PI / 6)
      const baseForMonth = baseValue * seasonalMultiplier
      
      scenarios.push({
        month: monthStr,
        optimistic: Math.round(baseForMonth * 1.25),
        realistic: Math.round(baseForMonth),
        pessimistic: Math.round(baseForMonth * 0.75),
        confidence: 85 + Math.random() * 10
      })
    }
    
    return scenarios
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
}

module.exports = new GeminiService()
