# Analytics System Documentation

## Overview

The analytics system provides comprehensive business intelligence and reporting capabilities for the ComparePCO platform. It supports both admin-level analytics (for platform-wide insights) and partner-level analytics (for individual partner performance tracking).

## Features

### ✅ Implemented Features

- **Real-time Data Integration**: Direct connection to Supabase database
- **Multi-level Analytics**: Admin and Partner-specific dashboards
- **Comprehensive Metrics**: Revenue, bookings, fleet, ratings, and more
- **Visual Charts**: Bar charts, line charts, and pie charts
- **Dark/Light Mode Support**: Full theme compatibility
- **Export Functionality**: Report export capabilities
- **Responsive Design**: Mobile-friendly interface
- **Loading States**: Smooth loading experiences
- **Error Handling**: Comprehensive error management

### 📊 Analytics Metrics

#### Admin Analytics
- Total Partners
- Active Partners
- Total Revenue
- Net Active Bookings
- Total Vehicles
- Average Rating
- Monthly Growth

#### Partner Analytics
- Net Active Bookings
- Revenue
- Rating & Satisfaction
- Fleet Size
- Driver Count
- Performance Trends

## Architecture

### File Structure

```
src/
├── lib/supabase/
│   └── analytics.ts          # Analytics service functions
├── hooks/
│   └── useAnalytics.ts       # Analytics hooks
├── components/analytics/
│   ├── MetricsCard.tsx       # Metric display component
│   ├── PartnerCard.tsx       # Partner profile card
│   ├── AnalyticsChart.tsx    # Chart components
│   └── AnalyticsDashboard.tsx # Main dashboard component
└── app/
    ├── admin/analytics/
    │   └── partners/
    │       └── page.tsx      # Admin partner analytics
    └── partner/
        └── analytics/
            └── page.tsx      # Partner analytics
```

### Core Components

#### 1. Analytics Service (`src/lib/supabase/analytics.ts`)

Provides data access layer for all analytics functions:

```typescript
// Get comprehensive partner analytics
export const getPartnerAnalytics = async (filters: AnalyticsFilters) => Promise<PartnerAnalytics>

// Get individual partner performance
export const getPartnerPerformance = async (partnerId: string) => Promise<PartnerPerformance>

// Get revenue analytics
export const getRevenueAnalytics = async (partnerId?: string) => Promise<RevenueAnalytics>

// Get booking analytics
export const getBookingAnalytics = async (partnerId?: string) => Promise<BookingAnalytics>

// Get fleet analytics
export const getFleetAnalytics = async (partnerId?: string) => Promise<FleetAnalytics>
```

#### 2. Analytics Hooks (`src/hooks/useAnalytics.ts`)

Custom React hooks for easy data fetching:

```typescript
// Admin analytics hook
export const usePartnerAnalytics = (filters: AnalyticsFilters) => {
  return { analytics, loading, error, refetch }
}

// Individual partner analytics hook
export const useComprehensivePartnerAnalytics = (partnerId?: string) => {
  return { performance, revenue, bookings, fleet, loading, error, refetch }
}
```

#### 3. UI Components

**MetricsCard**: Displays individual metrics with icons, trends, and colors
**PartnerCard**: Shows partner profile with key performance indicators
**AnalyticsChart**: Renders bar, line, and pie charts
**AnalyticsDashboard**: Main dashboard layout component

## Usage Examples

### Admin Analytics Dashboard

```typescript
import { usePartnerAnalytics } from '@/hooks/useAnalytics'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export default function AdminAnalyticsPage() {
  const { analytics, loading, error } = usePartnerAnalytics({
    dateRange: '30d',
    status: 'all'
  })

  const metrics = [
    {
      title: "Total Partners",
      value: analytics?.totalPartners || 0,
      icon: <Users className="w-6 h-6" />,
      color: "blue"
    },
    // ... more metrics
  ]

  const charts = [
    {
      title: "Revenue by Partner",
      data: revenueData,
      type: "bar",
      height: 300
    }
    // ... more charts
  ]

  return (
    <AnalyticsDashboard
      title="Partner Analytics"
      subtitle="Track partner performance and business metrics"
      metrics={metrics}
      charts={charts}
      onExport={handleExport}
    />
  )
}
```

### Partner Analytics Dashboard

```typescript
import { useComprehensivePartnerAnalytics } from '@/hooks/useAnalytics'

export default function PartnerAnalyticsPage() {
  const { user } = useAuth()
  const { performance, revenue, bookings, fleet, loading } = useComprehensivePartnerAnalytics(user?.id)

  const metrics = [
    {
      title: "Net Active Bookings",
      value: performance?.activeBookings || 0,
      icon: <Car className="w-6 h-6" />,
      color: "blue"
    },
    // ... more metrics
  ]

  return (
    <AnalyticsDashboard
      title="Partner Analytics"
      subtitle="Track your business performance and metrics"
      metrics={metrics}
    />
  )
}
```

## Data Models

### PartnerAnalytics Interface

```typescript
interface PartnerAnalytics {
  totalPartners: number
  activePartners: number
  totalRevenue: number
  netActiveBookings: number
  totalVehicles: number
  avgRating: number
  monthlyGrowth: number
  partnerDetails: PartnerDetail[]
}
```

### PartnerDetail Interface

```typescript
interface PartnerDetail {
  id: string
  companyName: string
  status: string
  location: string
  joinedDate: string
  netActiveBookings: number
  revenue: number
  rating: number
  fleet: number
  drivers: number
  satisfaction: number
}
```

## Styling & Theming

### Color Scheme

The analytics system uses a consistent color scheme:

- **Blue**: Primary metrics, bookings, general data
- **Green**: Revenue, success metrics, active status
- **Yellow**: Ratings, warnings, pending status
- **Purple**: Fleet, vehicles, premium features
- **Orange**: Alerts, maintenance, attention items
- **Red**: Errors, negative trends, critical issues

### Dark Mode Support

All components support both light and dark modes:

```typescript
// Example dark mode classes
"bg-white dark:bg-gray-800"
"text-gray-900 dark:text-white"
"border-gray-200 dark:border-gray-700"
```

## Performance Considerations

### Data Fetching

- **Optimized Queries**: Efficient Supabase queries with proper filtering
- **Caching**: React hooks provide automatic caching and refetching
- **Loading States**: Smooth loading experiences with skeleton screens
- **Error Boundaries**: Comprehensive error handling and user feedback

### Chart Performance

- **SVG-based Charts**: Lightweight, scalable chart rendering
- **Responsive Design**: Charts adapt to different screen sizes
- **Smooth Animations**: CSS transitions for better UX

## Future Enhancements

### Planned Features

- [ ] **Real-time Updates**: WebSocket integration for live data
- [ ] **Advanced Filtering**: Date ranges, status filters, custom criteria
- [ ] **Export Formats**: PDF, Excel, CSV export options
- [ ] **Drill-down Analytics**: Click-through to detailed views
- [ ] **Custom Dashboards**: User-configurable dashboard layouts
- [ ] **Scheduled Reports**: Automated report generation
- [ ] **Mobile App**: Native mobile analytics app
- [ ] **API Integration**: RESTful API for external integrations

### Technical Improvements

- [ ] **Caching Layer**: Redis for improved performance
- [ ] **Data Warehouse**: Advanced analytics with historical data
- [ ] **Machine Learning**: Predictive analytics and insights
- [ ] **Real-time Charts**: Live updating chart components
- [ ] **Advanced Visualizations**: Heatmaps, scatter plots, etc.

## Troubleshooting

### Common Issues

1. **Data Not Loading**
   - Check Supabase connection
   - Verify database permissions
   - Check console for errors

2. **Charts Not Rendering**
   - Ensure data is properly formatted
   - Check for null/undefined values
   - Verify chart component props

3. **Performance Issues**
   - Implement pagination for large datasets
   - Use React.memo for expensive components
   - Optimize database queries

### Debug Mode

Enable debug logging by setting:

```typescript
const DEBUG_ANALYTICS = true
```

This will log all analytics operations to the console.

## Contributing

When adding new analytics features:

1. **Follow the existing patterns** in the codebase
2. **Add proper TypeScript types** for all new interfaces
3. **Include dark mode support** for all new components
4. **Write comprehensive tests** for new functionality
5. **Update documentation** for any new features
6. **Consider performance implications** of new features

## Support

For analytics-related issues:

1. Check the console for error messages
2. Verify Supabase connection and permissions
3. Review the analytics service functions
4. Test with sample data to isolate issues
5. Contact the development team for complex issues 