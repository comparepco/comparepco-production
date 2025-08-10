import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface AnalyticsChartProps {
  title: string
  data: ChartDataPoint[]
  type?: 'bar' | 'line' | 'pie'
  height?: number
  className?: string
}

export default function AnalyticsChart({
  title,
  data,
  type = 'bar',
  height = 200,
  className
}: AnalyticsChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  const getBarChart = () => (
    <div className="flex items-end justify-between h-full space-x-2">
      {data.map((point, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div 
            className={cn(
              "w-full rounded-t transition-all duration-300",
              point.color || "bg-blue-500"
            )}
            style={{ 
              height: `${(point.value / maxValue) * 100}%`,
              minHeight: '4px'
            }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  )

  const getLineChart = () => (
    <div className="relative h-full">
      <svg className="w-full h-full" viewBox={`0 0 100 ${height}`}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = height - ((point.value / maxValue) * height)
            return `${x},${y}`
          }).join(' ')}
          className="text-blue-500"
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100
          const y = height - ((point.value / maxValue) * height)
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="currentColor"
              className="text-blue-500"
            />
          )
        })}
      </svg>
    </div>
  )

  const getPieChart = () => {
    const total = data.reduce((sum, point) => sum + point.value, 0)
    let currentAngle = 0
    
    return (
      <div className="relative h-full flex items-center justify-center">
        <svg className="w-32 h-32" viewBox="0 0 100 100">
          {data.map((point, index) => {
            const percentage = point.value / total
            const angle = percentage * 360
            const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180)
            const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180)
            const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180)
            const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180)
            
            const largeArcFlag = angle > 180 ? 1 : 0
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ')
            
            currentAngle += angle
            
            return (
              <path
                key={index}
                d={pathData}
                fill={point.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                stroke="white"
                strokeWidth="1"
              />
            )
          })}
        </svg>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return getLineChart()
      case 'pie':
        return getPieChart()
      default:
        return getBarChart()
    }
  }

  return (
    <Card className={cn("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700", className)}>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }} className="w-full">
          {renderChart()}
        </div>
        
        {/* Legend */}
        {type === 'pie' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.map((point, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: point.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {point.label}: {point.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 