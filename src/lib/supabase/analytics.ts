import { supabase } from './client'
import { Database } from './types'

type Partner = Database['public']['Tables']['partners']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']
type Payment = Database['public']['Tables']['payments']['Row']

export interface PartnerAnalytics {
  totalPartners: number
  activePartners: number
  totalRevenue: number
  netActiveBookings: number
  totalVehicles: number
  avgRating: number
  monthlyGrowth: number
  partnerDetails: PartnerDetail[]
}

export interface PartnerDetail {
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

export interface AnalyticsFilters {
  dateRange?: '7d' | '30d' | '90d' | '1y'
  status?: 'all' | 'active' | 'inactive' | 'pending'
  location?: string
}

// Get partner analytics overview
export const getPartnerAnalytics = async (filters: AnalyticsFilters = {}): Promise<PartnerAnalytics> => {
  try {
    // Get all partners
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*')

    if (partnersError) throw partnersError

    // Get all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')

    if (bookingsError) throw bookingsError

    // Get all vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')

    if (vehiclesError) throw vehiclesError

    // Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')

    if (paymentsError) throw paymentsError

    // Calculate metrics
    const totalPartners = partners?.length || 0
    const activePartners = partners?.filter(p => p.status === 'active').length || 0
    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const netActiveBookings = bookings?.filter(b => b.status === 'active').length || 0
    const totalVehicles = vehicles?.length || 0
    const avgRating = 0.0 // Mock data - would come from ratings table
    const monthlyGrowth = 0.0 // Mock data - would calculate from historical data

    // Build partner details
    const partnerDetails: PartnerDetail[] = (partners || []).map(partner => {
      const partnerBookings = bookings?.filter(b => b.partner_id === partner.id) || []
      const partnerVehicles = vehicles?.filter(v => v.partner_id === partner.id) || []
      const partnerPayments = payments?.filter(p => {
        const booking = bookings?.find(b => b.id === p.booking_id)
        return booking?.partner_id === partner.id
      }) || []

      return {
        id: partner.id,
        companyName: partner.company_name || 'Unknown',
        status: partner.status || 'unknown',
        location: 'United Kingdom', // Mock data
        joinedDate: partner.created_at || new Date().toISOString(),
        netActiveBookings: partnerBookings.filter(b => b.status === 'active').length,
        revenue: partnerPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        rating: 0.0, // Mock data
        fleet: partnerVehicles.length,
        drivers: 0, // Mock data - would come from drivers table
        satisfaction: 85, // Mock data
      }
    })

    return {
      totalPartners,
      activePartners,
      totalRevenue,
      netActiveBookings,
      totalVehicles,
      avgRating,
      monthlyGrowth,
      partnerDetails,
    }
  } catch (error) {
    console.error('Error fetching partner analytics:', error)
    throw error
  }
}

// Get partner performance metrics
export const getPartnerPerformance = async (partnerId: string) => {
  try {
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('partner_id', partnerId)

    if (bookingsError) throw bookingsError

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('partner_id', partnerId)

    if (vehiclesError) throw vehiclesError

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')

    if (paymentsError) throw paymentsError

    // Calculate partner-specific metrics
    const totalBookings = bookings?.length || 0
    const activeBookings = bookings?.filter(b => b.status === 'active').length || 0
    const totalRevenue = payments?.reduce((sum, p) => {
      const booking = bookings?.find(b => b.id === p.booking_id)
      return booking?.partner_id === partnerId ? sum + (p.amount || 0) : sum
    }, 0) || 0
    const fleetSize = vehicles?.length || 0

    return {
      totalBookings,
      activeBookings,
      totalRevenue,
      fleetSize,
      avgRating: 0.0, // Mock data
      satisfaction: 85, // Mock data
    }
  } catch (error) {
    console.error('Error fetching partner performance:', error)
    throw error
  }
}

// Get revenue analytics
export const getRevenueAnalytics = async (partnerId?: string) => {
  try {
    let query = supabase.from('payments').select('*')
    
    if (partnerId) {
      // Get payments for specific partner through bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('partner_id', partnerId)
      
      const bookingIds = bookings?.map(b => b.id) || []
      query = query.in('booking_id', bookingIds)
    }

    const { data: payments, error } = await query

    if (error) throw error

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const successfulPayments = payments?.filter(p => p.status === 'completed').length || 0
    const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0

    return {
      totalRevenue,
      successfulPayments,
      pendingPayments,
      totalPayments: payments?.length || 0,
    }
  } catch (error) {
    console.error('Error fetching revenue analytics:', error)
    throw error
  }
}

// Get booking analytics
export const getBookingAnalytics = async (partnerId?: string) => {
  try {
    let query = supabase.from('bookings').select('*')
    
    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }

    const { data: bookings, error } = await query

    if (error) throw error

    const totalBookings = bookings?.length || 0
    const activeBookings = bookings?.filter(b => b.status === 'active').length || 0
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0

    return {
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
    }
  } catch (error) {
    console.error('Error fetching booking analytics:', error)
    throw error
  }
}

// Get fleet analytics
export const getFleetAnalytics = async (partnerId?: string) => {
  try {
    let query = supabase.from('vehicles').select('*')
    
    if (partnerId) {
      query = query.eq('partner_id', partnerId)
    }

    const { data: vehicles, error } = await query

    if (error) throw error

    const totalVehicles = vehicles?.length || 0
    const activeVehicles = vehicles?.filter(v => v.status === 'active').length || 0
    const maintenanceVehicles = vehicles?.filter(v => v.status === 'maintenance').length || 0
    const inactiveVehicles = vehicles?.filter(v => v.status === 'inactive').length || 0

    return {
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      inactiveVehicles,
    }
  } catch (error) {
    console.error('Error fetching fleet analytics:', error)
    throw error
  }
}

// Export analytics data
export const exportAnalyticsData = async (filters: AnalyticsFilters = {}) => {
  try {
    const analytics = await getPartnerAnalytics(filters)
    
    // Convert to CSV format
    const csvData = [
      ['Company Name', 'Status', 'Location', 'Joined Date', 'Active Bookings', 'Revenue', 'Rating', 'Fleet Size', 'Drivers', 'Satisfaction'],
      ...analytics.partnerDetails.map(partner => [
        partner.companyName,
        partner.status,
        partner.location,
        new Date(partner.joinedDate).toLocaleDateString(),
        partner.netActiveBookings.toString(),
        `£${partner.revenue.toFixed(2)}`,
        partner.rating.toString(),
        partner.fleet.toString(),
        partner.drivers.toString(),
        `${partner.satisfaction}%`
      ])
    ]

    return csvData
  } catch (error) {
    console.error('Error exporting analytics data:', error)
    throw error
  }
} 