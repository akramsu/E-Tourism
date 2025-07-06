# TourEase Gemini AI Integration

This document describes the Gemini AI integration for predictive analytics in the TourEase tourism management system.

## Overview

The TourEase application now includes AI-powered predictive analytics using Google's Gemini API. This feature provides:

- **Predictive Forecasting**: Visitor and revenue predictions based on historical data
- **Trend Analysis**: AI-powered identification of tourism trends and patterns
- **Risk Assessment**: Automated detection of potential issues and opportunities
- **Seasonal Insights**: Understanding of seasonal patterns and their impact
- **Performance Optimization**: Recommendations for improving tourism performance

## Setup Instructions

### 1. Install Dependencies

The required Google Generative AI package has been installed:

```bash
cd server
npm install @google/generative-ai
```

### 2. Environment Configuration

Add your Gemini API key to the `.env` file:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

**Important**: Replace `your-actual-gemini-api-key-here` with your real Gemini API key from Google AI Studio.

### 3. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## Architecture

### Backend Components

#### 1. Gemini Service (`/server/src/services/geminiService.js`)

Core AI service that handles:
- **Predictive Analytics Generation**: Analyzes historical data and generates forecasts
- **Trend Analysis**: Identifies patterns and factors affecting tourism
- **Insights Generation**: Provides actionable recommendations
- **Fallback Data**: Ensures graceful degradation if AI service fails

#### 2. Authority Controller Updates

Enhanced with two new endpoints:
- `GET /api/authority/predictive-analytics` - Main predictive analytics endpoint
- `GET /api/authority/forecast-accuracy` - Model accuracy metrics

#### 3. Database Integration

Utilizes existing Prisma schema:
- **Visit Data**: Historical visitor patterns and revenue
- **Attraction Data**: Performance metrics by attraction
- **User Demographics**: Visitor demographic analysis
- **Seasonal Patterns**: Multi-year seasonal trend analysis

### Frontend Components

#### 1. Predictive Analytics Page (`/client/pages/authority/predictive-analytics.tsx`)

Features:
- **Real-time AI Predictions**: Live data from Gemini API
- **Interactive Charts**: Forecast visualizations with confidence intervals
- **Trend Factors**: Visual representation of factors affecting tourism
- **Scenario Analysis**: Optimistic, realistic, and pessimistic forecasts

#### 2. Supporting Components

- **ForecastChart**: Interactive D3.js charts for forecasts
- **AIInsightsPanel**: Display of AI-generated insights and recommendations

## API Endpoints

### Predictive Analytics

```http
GET /api/authority/predictive-analytics
```

**Query Parameters:**
- `period` (optional): 'week' | 'month' | 'quarter' | 'year' (default: 'month')
- `includeForecasts` (optional): 'true' | 'false' (default: 'true')
- `forecastPeriod` (optional): Number of months to forecast (default: 6)

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "forecastMetrics": {
      "nextMonthVisitors": 15000,
      "nextMonthRevenue": 280000,
      "quarterlyRevenue": 850000,
      "seasonalIndex": 1.15,
      "accuracyScore": 94.2,
      "growthRate": 8.5
    },
    "revenueScenarios": [...],
    "visitorScenarios": [...],
    "trendFactors": [...],
    "insights": {
      "keyPredictions": [...],
      "riskFactors": [...],
      "opportunities": [...]
    },
    "modelAccuracy": {
      "overall": 94.2,
      "visitorAccuracy": 93.8,
      "revenueAccuracy": 94.6,
      "trend": "improving"
    },
    "metadata": {
      "generatedAt": "2025-07-06T...",
      "aiProvider": "Gemini"
    }
  }
}
```

### Forecast Accuracy

```http
GET /api/authority/forecast-accuracy
```

**Query Parameters:**
- `period` (optional): 'week' | 'month' | 'quarter' | 'year' (default: 'month')
- `modelType` (optional): Type of model to evaluate (default: 'all')

## AI Prompts and Data Processing

### Data Preparation

The system collects and analyzes:

1. **Historical Visit Data**: 12+ months of visitor patterns
2. **Revenue Trends**: Monthly revenue aggregations
3. **Attraction Performance**: Individual attraction metrics
4. **Demographic Patterns**: Visitor demographic breakdowns
5. **Seasonal Analysis**: 24-month seasonal pattern detection

### Gemini AI Prompts

The system uses structured prompts that include:
- Historical tourism data in JSON format
- Analysis requirements and parameters
- Specific output format requirements
- Context about the tourism domain

### Output Processing

AI responses are:
- Parsed and validated for data integrity
- Sanitized for security
- Enhanced with fallback data if needed
- Cached for performance optimization

## Error Handling and Fallbacks

### Graceful Degradation

If Gemini API is unavailable:
1. **Fallback Data**: Pre-calculated baseline predictions
2. **Historical Trends**: Simple trend-based forecasting
3. **Static Insights**: General tourism industry insights
4. **Error Logging**: Detailed error tracking for debugging

### Data Validation

All AI responses are validated for:
- **Data Types**: Ensuring numeric values are numbers
- **Ranges**: Keeping values within realistic bounds
- **Completeness**: Providing defaults for missing data
- **Security**: Sanitizing all text content

## Performance Considerations

### Caching Strategy

- **Response Caching**: AI responses cached for 1 hour
- **Historical Data**: Database queries optimized with indexes
- **Background Processing**: Long-running AI calls handled asynchronously

### Rate Limiting

- **API Calls**: Limited to prevent quota exhaustion
- **Batch Processing**: Multiple requests batched when possible
- **Request Queuing**: Requests queued during high load

## Security

### API Key Management

- **Environment Variables**: Keys stored securely in .env
- **No Client Exposure**: Keys never sent to frontend
- **Rotation Support**: Easy key rotation process

### Data Privacy

- **Anonymization**: Personal data anonymized before AI processing
- **Minimal Data**: Only necessary data sent to AI service
- **Compliance**: GDPR and privacy regulation compliance

## Monitoring and Analytics

### Metrics Tracked

- **AI Response Times**: Performance monitoring
- **Accuracy Scores**: Model performance tracking
- **Error Rates**: Failure rate monitoring
- **Usage Patterns**: API usage analytics

### Logging

- **Structured Logging**: JSON-formatted logs
- **Error Tracking**: Detailed error information
- **Performance Metrics**: Response time tracking
- **Usage Analytics**: Request pattern analysis

## Troubleshooting

### Common Issues

1. **Missing API Key**
   - Error: "GEMINI_API_KEY environment variable is required"
   - Solution: Add valid API key to .env file

2. **API Quota Exceeded**
   - Error: API quota or rate limit errors
   - Solution: Check Google AI Studio quota and usage

3. **Network Issues**
   - Error: Connection timeout or network errors
   - Solution: Check internet connection and firewall settings

4. **Invalid Response Format**
   - Error: JSON parsing errors from AI
   - Solution: System automatically falls back to default data

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

This provides additional error details and request/response logging.

## Future Enhancements

### Planned Features

1. **Custom Model Training**: Train models on local tourism data
2. **Real-time Predictions**: Live forecasting based on current conditions
3. **Multi-language Support**: Insights in multiple languages
4. **Advanced Visualizations**: Enhanced charts and graphs
5. **Integration APIs**: Connect with external tourism data sources

### Performance Optimizations

1. **Local Caching**: Redis implementation for faster responses
2. **Background Jobs**: Queue-based processing for heavy operations
3. **Database Optimization**: Advanced indexing and query optimization
4. **CDN Integration**: Static asset optimization

## Support

For technical support or questions about the Gemini AI integration:

1. Check the error logs in the server console
2. Verify your Gemini API key is valid and has quota
3. Ensure all environment variables are properly set
4. Review the API response format for any changes

## License

This integration is part of the TourEase project and follows the same licensing terms.
