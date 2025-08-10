import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Car, 
  Star, 
  MapPin, 
  Calendar,
  TrendingUp,
  Building
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PartnerDetail } from '@/lib/supabase/analytics'

interface PartnerCardProps {
  partner: PartnerDetail
  onViewDetails?: (partnerId: string) => void
  className?: string
}

export default function PartnerCard({ 
  partner, 
  onViewDetails,
  className 
}: PartnerCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <Card className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow",
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {partner.companyName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {partner.companyName}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(partner.status)}>
            {partner.status}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {partner.netActiveBookings}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Net Active Bookings
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                £{partner.revenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Revenue
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {partner.rating.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {partner.satisfaction}% satisfaction
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {partner.fleet}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {partner.drivers} drivers
              </p>
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{partner.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Joined: {new Date(partner.joinedDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Transport Company
          </span>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onViewDetails?.(partner.id)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 