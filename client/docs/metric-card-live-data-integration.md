# MetricCard Live Data Integration

## Overview
Successfully refactored the MetricCard component to fetch and display live data from the backend database, with smart role-based functionality for both owner and authority interfaces.

## Key Changes

### 1. Enhanced MetricCard Component (`components/metric-card.tsx`)

#### New Features:
- **Smart Data Fetching**: Component can automatically fetch appropriate data based on user role and context
- **Role-Based Logic**: 
  - **Owner**: Fetches single attraction metrics using `ownerApi.getPerformanceMetrics()`
  - **Authority**: Fetches city-wide metrics using `authorityApi.getCityMetrics()`
- **Flexible Props**: Supports both traditional prop-based usage and smart fetching mode
- **Loading/Error States**: Comprehensive handling of loading, error, and empty states
- **Period Support**: Enhanced to support 'quarter' period in addition to existing options

#### Props Interface:
```typescript
interface MetricCardProps {
  // Traditional usage (when data is already provided)
  title?: string
  value?: string
  change?: string
  trend?: "up" | "down"
  icon?: LucideIcon
  gradient?: string
  
  // Smart fetching mode
  metricType?: 'totalVisitors' | 'revenue' | 'avgDuration' | 'rating' | 'growthRate' | 'capacity' | 'activeAttractions' | 'avgSatisfaction' | 'topAttraction'
  attractionId?: number  // Required for owner mode
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year'
  className?: string
}
```

#### Metric Configuration:
Pre-configured metric types with appropriate titles, icons, and gradients:
- `totalVisitors`: Total visitor count
- `revenue`: Revenue metrics  
- `avgDuration`: Average visit duration
- `rating`: Customer ratings
- `growthRate`: Growth percentage
- `capacity`: Capacity utilization
- `activeAttractions`: Active attractions count (authority only)
- `avgSatisfaction`: Average satisfaction (authority only)  
- `topAttraction`: Top performing attraction (authority only)

### 2. Authority Interface Updates (`pages/authority/city-overview.tsx`)

#### Major Changes:
- **Smart MetricCard Usage**: All metric cards now use the new smart fetching with `metricType` props
- **Live Data Integration**: Removed all mock data dependencies
- **Period Selection**: Added period selector for dynamic data filtering
- **Error Handling**: Added comprehensive loading and error states
- **City-Wide Metrics**: Uses `authorityApi.getCityMetrics()` for fetching city-wide data

#### New Metric Cards:
```tsx
<MetricCard metricType="totalVisitors" period={selectedPeriod} />
<MetricCard metricType="revenue" period={selectedPeriod} />
<MetricCard metricType="activeAttractions" period={selectedPeriod} />
<MetricCard metricType="avgSatisfaction" period={selectedPeriod} />
<MetricCard metricType="growthRate" period={selectedPeriod} />
<MetricCard metricType="topAttraction" period={selectedPeriod} />
```

### 3. Chart Component Updates

#### Enhanced for Authority Use:
- **RevenueTrendChart**: Made `attractionId` optional, added authority support via `authorityApi.getCityAnalytics()`
- **DatabaseVisitorHeatmap**: Added role-based data fetching for city-wide vs attraction-specific data
- **AttractionPerformanceTable**: Enhanced to show all attractions for authority vs single attraction for owner

#### Role Detection:
All chart components now use `useAuth()` to detect user role and fetch appropriate data:
```typescript
const userRole = user?.role?.roleName?.toLowerCase()
if (userRole === 'authority') {
  // Fetch city-wide data
} else if (userRole === 'owner' && attractionId) {
  // Fetch attraction-specific data
}
```

### 4. API Integration

#### Authority Endpoints Used:
- `authorityApi.getCityMetrics()`: City-wide metrics and KPIs
- `authorityApi.getCityAnalytics()`: Detailed city analytics and breakdowns
- `authorityApi.getAttractionComparison()`: Multi-attraction performance data

#### Owner Endpoints Used:
- `ownerApi.getPerformanceMetrics()`: Single attraction metrics
- `ownerApi.getAttractionAnalytics()`: Detailed attraction analytics
- Various specialized chart data endpoints

### 5. Data Processing and Formatting

#### Smart Value Formatting:
- **Currency**: Formatted with proper currency symbols and abbreviations
- **Numbers**: Locale-aware formatting with thousand separators
- **Percentages**: Proper percentage formatting with + indicators
- **Durations**: Hours and minutes formatting
- **Ratings**: X/5 format display

#### Change Calculation:
- Automatic trend detection (up/down) based on change values
- Period-aware change descriptions
- Fallback handling for missing data

## Benefits

### 1. **Live Data Integration**
- All metrics now reflect real-time database state
- No more dependency on mock data
- Accurate business insights

### 2. **Role-Based Functionality** 
- **Owners**: See metrics specific to their attraction
- **Authorities**: See city-wide aggregated metrics
- Same component, different data context

### 3. **Improved User Experience**
- Loading states provide immediate feedback
- Error handling with retry functionality
- Responsive design maintained

### 4. **Maintainability**
- Single MetricCard component handles all use cases
- Centralized metric configuration
- Consistent formatting and styling

### 5. **Scalability**
- Easy to add new metric types
- Flexible API integration
- Supports future role expansions

## Usage Examples

### Owner Interface:
```tsx
// Traditional props usage (already processed data)
<MetricCard 
  title="Total Visitors"
  value="1,234"
  change="+12.3% from last month"
  trend="up"
  icon={Users}
  gradient="bg-gradient-to-br from-blue-500 to-blue-600"
/>

// Smart fetching usage
<MetricCard 
  metricType="totalVisitors" 
  attractionId={123}
  period="month" 
/>
```

### Authority Interface:
```tsx
// Smart fetching for city-wide data
<MetricCard metricType="totalVisitors" period="month" />
<MetricCard metricType="activeAttractions" period="quarter" />
<MetricCard metricType="topAttraction" period="year" />
```

## Testing and Validation

### Verified Components:
- ✅ MetricCard smart fetching functionality
- ✅ Authority city overview page
- ✅ Owner performance overview page  
- ✅ Chart components with role-based data
- ✅ Error handling and loading states
- ✅ TypeScript compilation

### Database Integration:
- ✅ Live data fetching from Prisma schema
- ✅ Role-based API endpoint selection
- ✅ Proper error handling for API failures
- ✅ Data transformation and formatting

## Future Enhancements

### Potential Improvements:
1. **Real-time Updates**: WebSocket integration for live metric updates
2. **Caching**: Implement data caching for better performance
3. **Customization**: Allow users to customize metric display preferences
4. **Alerts**: Integration with notification system for metric thresholds
5. **Drill-down**: Click-through functionality to detailed metric views

## Dependencies Updated

### New Imports Added:
- Enhanced `authorityApi` usage
- `useAuth` hook integration
- Additional Lucide React icons
- Improved error handling utilities

This refactoring successfully transforms all dashboard metrics from mock data to live database integration while maintaining a clean, role-based architecture that scales well for future enhancements.
