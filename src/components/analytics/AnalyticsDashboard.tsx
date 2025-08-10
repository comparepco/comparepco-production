import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  Download, 
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react'
import MetricsCard from './MetricsCard'
import AnalyticsChart from './AnalyticsChart'
import { cn } from '@/lib/utils'

interface AnalyticsMetric {
  title: string
  value: string | number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red'
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  detail?: string
}

interface ChartData {
  title: string
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  type?: 'bar' | 'line' | 'pie'
  height?: number
}

interface AnalyticsDashboardProps {
  title: string
  subtitle?: string
  metrics: AnalyticsMetric[]
  charts?: ChartData[]
  showExport?: boolean
  showFilters?: boolean
  showRefresh?: boolean
  onExport?: () => void
  onRefresh?: () => void
  className?: string
  children?: React.ReactNode
}

export default function AnalyticsDashboard({
  title,
  subtitle,
  metrics,
  charts = [],
  showExport = true,
  showFilters = true,
  showRefresh = true,
  onExport,
  onRefresh,
  className,
  children
}: AnalyticsDashboardProps) {
  const [showCharts, setShowCharts] = useState(true)
  const [dateRange, setDateRange] = useState('30d')

  const handleExport = () => {
    if (onExport) {
      onExport()
    }
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", className)}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {showFilters && (
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            )}
            <Button variant="outline" className="flex items-center space-x-2">
              <span>Last {dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : '90 days'}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {showRefresh && (
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            )}
            {showExport && (
              <Button 
                onClick={handleExport}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </Button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <MetricsCard
              key={index}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              trend={metric.trend}
              detail={metric.detail}
            />
          ))}
        </div>

        {/* Charts Section */}
        {charts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics Charts
              </h2>
              <Button
                variant="outline"
                onClick={() => setShowCharts(!showCharts)}
                className="flex items-center space-x-2"
              >
                {showCharts ? <PieChart className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                <span>{showCharts ? 'Hide' : 'Show'} Charts</span>
              </Button>
            </div>

            {showCharts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.map((chart, index) => (
                  <AnalyticsChart
                    key={index}
                    title={chart.title}
                    data={chart.data}
                    type={chart.type}
                    height={chart.height}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Content */}
        {children}
      </div>
    </div>
  )
} 