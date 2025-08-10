import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  detail?: string
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red'
  className?: string
}

const colorClasses = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  purple: 'text-purple-600 dark:text-purple-400',
  orange: 'text-orange-600 dark:text-orange-400',
  red: 'text-red-600 dark:text-red-400',
}

const bgColorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20',
  green: 'bg-green-50 dark:bg-green-900/20',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
  purple: 'bg-purple-50 dark:bg-purple-900/20',
  orange: 'bg-orange-50 dark:bg-orange-900/20',
  red: 'bg-red-50 dark:bg-red-900/20',
}

export default function MetricsCard({
  title,
  value,
  icon,
  trend,
  detail,
  color = 'blue',
  className
}: MetricsCardProps) {
  return (
    <Card className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <p className={cn(
                "text-2xl font-bold",
                colorClasses[color]
              )}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <span className={cn(
                  "text-xs font-medium",
                  trend.isPositive 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                )}>
                  {trend.isPositive ? '↗' : '↘'} {trend.value}%
                </span>
              )}
            </div>
            {detail && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {detail}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
              bgColorClasses[color]
            )}>
              <div className={cn("w-6 h-6", colorClasses[color])}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 