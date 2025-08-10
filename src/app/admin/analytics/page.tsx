"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  Truck, 
  FileText, 
  DollarSign,
  FileText as DocumentDuplicateIcon,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

const analyticsSections = [
  {
    title: 'Partner Analytics',
    description: 'Track partner performance, revenue, and fleet metrics',
    href: '/admin/analytics/partners',
    icon: Users,
    color: 'blue',
    metrics: ['Total Partners', 'Active Partners', 'Revenue', 'Fleet Size']
  },
  {
    title: 'Driver Analytics',
    description: 'Monitor driver performance, bookings, and ratings',
    href: '/admin/analytics/drivers',
    icon: Truck,
    color: 'green',
    metrics: ['Total Drivers', 'Active Drivers', 'Bookings', 'Ratings']
  },
  {
    title: 'Booking Analytics',
    description: 'Analyze booking patterns, revenue, and trends',
    href: '/admin/analytics/bookings',
    icon: FileText,
    color: 'purple',
    metrics: ['Total Bookings', 'Active Bookings', 'Revenue', 'Completion Rate']
  },
  {
    title: 'Revenue Analytics',
    description: 'Track revenue trends, payments, and financial metrics',
    href: '/admin/analytics/revenue',
    icon: DollarSign,
    color: 'green',
    metrics: ['Total Revenue', 'Monthly Growth', 'Payments', 'Commissions']
  },
  {
    title: 'Fleet Analytics',
    description: 'Monitor vehicle performance, maintenance, and utilization',
    href: '/admin/analytics/fleet',
    icon: BarChart3,
    color: 'orange',
    metrics: ['Total Vehicles', 'Active Vehicles', 'Maintenance', 'Utilization']
  },
  {
    title: 'Performance Reports',
    description: 'Generate comprehensive reports and insights',
    href: '/admin/analytics/reports',
    icon: DocumentDuplicateIcon,
    color: 'yellow',
    metrics: ['Custom Reports', 'Export Data', 'Trends', 'Insights']
  }
]

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
}

export default function AnalyticsDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Comprehensive analytics and reporting for your platform
          </p>
        </div>

        {/* Analytics Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsSections.map((section) => (
            <Card 
              key={section.title}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${colorClasses[section.color as keyof typeof colorClasses]}`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <Link href={section.href}>
                    <Button variant="ghost" size="sm" className="p-1">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <CardTitle className="text-gray-900 dark:text-white text-lg">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {section.description}
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Key Metrics
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {section.metrics.map((metric) => (
                      <span
                        key={metric}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={section.href}>
                    <Button className="w-full" variant="outline">
                      View Analytics
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Partners</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">£0.00</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Bookings</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Vehicles</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">2</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 