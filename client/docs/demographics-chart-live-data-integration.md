# Demographics Chart Live Data Integration

## Overview
Successfully refactored the `DemographicsChart` component to fetch and display live visitor demographics data from the backend database, supporting both owner (single attraction) and authority (city-wide) interfaces.

## Key Features

### 1. 🔐 Role-Based Data Fetching
- **Owner Interface**: Displays demographic data for the owner's specific attraction
- **Authority Interface**: Shows city-wide demographic data across all attractions
- **Smart Detection**: Automatically detects user role and fetches appropriate data
- **Flexible Attraction ID**: Can accept `attractionId` prop or auto-detect owner's attraction

### 2. 📊 Live Data Integration

#### API Endpoints Used:
```typescript
// Owner: Single attraction demographics
ownerApi.getVisitorDemographics(attractionId, { period })

// Authority: City-wide demographics  
authorityApi.getCityDemographics({ period, breakdown: 'age' })
```

#### Supported Parameters:
- `period`: 'week' | 'month' | 'quarter' | 'year'
- `attractionId`: Optional for owner interface
- `breakdown`: 'age' for demographic analysis

### 3. 📈 Enhanced Visualization

#### Data Transformation:
```typescript
interface DemographicsData {
  name: string          // Age group (e.g., "18-25", "26-35")
  value: number         // Number of visitors
  percentage: number    // Percentage of total
  fill: string         // Chart color
}
```

#### Chart Features:
- **Interactive Pie Chart**: Displays age group distribution
- **Custom Tooltips**: Shows detailed visitor counts and percentages
- **Color-coded Legend**: Clear age group identification
- **Summary Statistics**: Total visitors and largest demographic group

### 4. 🛡️ Robust State Management

#### Loading States:
- Skeleton loading placeholders
- Animated loading indicators
- Progress feedback during data fetch

#### Error Handling:
- User-friendly error messages
- Graceful fallbacks for API failures
- Retry capabilities built-in

#### Empty States:
- Informative messages when no data available
- Guidance for users on data collection
- Visual indicators for empty datasets

### 5. 🎨 Enhanced UI/UX

#### Dynamic Content:
- **Role-based Titles**:
  - Owner: "Visitor Demographics"
  - Authority: "City-wide Visitor Demographics"
- **Context-aware Descriptions**:
  - Owner: "Age group distribution of your visitors"
  - Authority: "Age group distribution across all city attractions"

#### Visual Improvements:
- Color-coded age groups with consistent palette
- Percentage-based legend display
- Total visitor count in description
- Largest demographic group highlight

#### Responsive Design:
- Flexible chart sizing (300px height)
- Grid-based legend layout
- Mobile-friendly statistics display

### 6. ⚡ Performance Optimizations

#### Efficient Data Fetching:
- Automatic attraction ID resolution for owners
- Cached API responses
- Minimal re-renders with proper dependencies

#### Memory Management:
- Clean state management
- Proper component unmounting
- Error boundary protection

## Props Interface

```typescript
interface DemographicsChartProps {
  attractionId?: number      // Optional: specific attraction ID
  period?: 'week' | 'month' | 'quarter' | 'year'  // Data time period
  className?: string         // Additional CSS classes
  title?: string            // Custom chart title
  description?: string      // Custom chart description
}
```

## Usage Examples

### Owner Interface:
```tsx
// Auto-detect owner's attraction
<DemographicsChart period="month" />

// Specific attraction ID
<DemographicsChart attractionId={123} period="quarter" />
```

### Authority Interface:
```tsx
// City-wide demographics
<DemographicsChart period="year" />

// Custom title for reports
<DemographicsChart 
  period="month" 
  title="Regional Tourism Demographics"
  description="Age distribution across metropolitan attractions"
/>
```

## Data Flow

### Owner Flow:
1. Component detects owner role via `useAuth()`
2. If no `attractionId` provided, fetches owner's attraction
3. Calls `ownerApi.getVisitorDemographics()` with attraction ID
4. Transforms response to chart format
5. Renders attraction-specific demographics

### Authority Flow:
1. Component detects authority role via `useAuth()`
2. Calls `authorityApi.getCityDemographics()` with period and breakdown
3. Aggregates city-wide demographic data
4. Transforms response to chart format
5. Renders city-wide demographics

## Database Integration

### Data Source:
- **Primary Table**: `visit` (visitor records)
- **User Data**: `user.birthDate` for age calculation
- **Attraction Link**: `visit.attractionId` for filtering
- **Date Filtering**: `visit.visitDate` for period analysis

### Prisma Schema Fields Used:
```prisma
model Visit {
  id              Int        @id @default(autoincrement())
  attractionId    Int
  visitDate       DateTime
  userId          Int
  // ... other fields
}

model User {
  id               Int                @id @default(autoincrement())
  birthDate        DateTime?
  // ... other fields
}
```

## Future Enhancements

### Potential Improvements:
1. **Multiple Breakdowns**: Gender, location, visit frequency
2. **Comparative Analysis**: Period-over-period comparisons
3. **Export Functionality**: CSV/PDF export capabilities
4. **Real-time Updates**: WebSocket integration for live data
5. **Advanced Filtering**: Custom date ranges, demographic filters
6. **Predictive Analytics**: Demographic trend forecasting

## Error Scenarios Handled

1. **No User Authentication**: Graceful fallback
2. **Invalid Attraction ID**: Clear error messaging
3. **API Failures**: Retry mechanisms and error displays
4. **Empty Data Sets**: Informative empty states
5. **Role Permission Issues**: Appropriate error handling
6. **Network Connectivity**: Offline state handling

## Validation Results

### TypeScript Compliance:
- ✅ No type errors
- ✅ Proper interface definitions
- ✅ Correct API type usage

### Functionality Testing:
- ✅ Owner interface shows single attraction data
- ✅ Authority interface shows city-wide data
- ✅ Proper role detection and API routing
- ✅ Loading and error states working
- ✅ Interactive chart features functional
- ✅ Responsive design verified

## Conclusion

The `DemographicsChart` component has been successfully transformed from a static chart to a fully dynamic, role-aware component that provides meaningful insights for both attraction owners and tourism authorities. The implementation ensures data accuracy, user experience quality, and scalable architecture for future enhancements.
