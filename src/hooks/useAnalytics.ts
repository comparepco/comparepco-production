import { useState, useEffect } from 'react'
import { 
  getPartnerAnalytics, 
  getPartnerPerformance, 
  getRevenueAnalytics, 
  getBookingAnalytics, 
  getFleetAnalytics,
  PartnerAnalytics,
  AnalyticsFilters
} from '@/lib/supabase/analytics'

// Hook for admin partner analytics
export const usePartnerAnalytics = (filters: AnalyticsFilters = {}) => {
  const [analytics, setAnalytics] = useState<PartnerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getPartnerAnalytics(filters)
        setAnalytics(data)
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching partner analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [filters])

  const refetch = () => {
    setLoading(true)
    setError(null)
    getPartnerAnalytics(filters)
      .then(setAnalytics)
      .catch((err) => {
        setError(err)
        console.error('Error refetching partner analytics:', err)
      })
      .finally(() => setLoading(false))
  }

  return { analytics, loading, error, refetch }
}

// Hook for individual partner performance
export const usePartnerPerformance = (partnerId: string) => {
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getPartnerPerformance(partnerId)
        setPerformance(data)
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching partner performance:', err)
      } finally {
        setLoading(false)
      }
    }

    if (partnerId) {
      fetchPerformance()
    }
  }, [partnerId])

  const refetch = () => {
    if (!partnerId) return
    setLoading(true)
    setError(null)
    getPartnerPerformance(partnerId)
      .then(setPerformance)
      .catch((err) => {
        setError(err)
        console.error('Error refetching partner performance:', err)
      })
      .finally(() => setLoading(false))
  }

  return { performance, loading, error, refetch }
}

// Hook for revenue analytics
export const useRevenueAnalytics = (partnerId?: string) => {
  const [revenue, setRevenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getRevenueAnalytics(partnerId)
        setRevenue(data)
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching revenue analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()
  }, [partnerId])

  const refetch = () => {
    setLoading(true)
    setError(null)
    getRevenueAnalytics(partnerId)
      .then(setRevenue)
      .catch((err) => {
        setError(err)
        console.error('Error refetching revenue analytics:', err)
      })
      .finally(() => setLoading(false))
  }

  return { revenue, loading, error, refetch }
}

// Hook for booking analytics
export const useBookingAnalytics = (partnerId?: string) => {
  const [bookings, setBookings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getBookingAnalytics(partnerId)
        setBookings(data)
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching booking analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [partnerId])

  const refetch = () => {
    setLoading(true)
    setError(null)
    getBookingAnalytics(partnerId)
      .then(setBookings)
      .catch((err) => {
        setError(err)
        console.error('Error refetching booking analytics:', err)
      })
      .finally(() => setLoading(false))
  }

  return { bookings, loading, error, refetch }
}

// Hook for fleet analytics
export const useFleetAnalytics = (partnerId?: string) => {
  const [fleet, setFleet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getFleetAnalytics(partnerId)
        setFleet(data)
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching fleet analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFleet()
  }, [partnerId])

  const refetch = () => {
    setLoading(true)
    setError(null)
    getFleetAnalytics(partnerId)
      .then(setFleet)
      .catch((err) => {
        setError(err)
        console.error('Error refetching fleet analytics:', err)
      })
      .finally(() => setLoading(false))
  }

  return { fleet, loading, error, refetch }
}

// Hook for comprehensive partner analytics (combines all analytics)
export const useComprehensivePartnerAnalytics = (partnerId?: string) => {
  const { performance, loading: performanceLoading, error: performanceError, refetch: refetchPerformance } = usePartnerPerformance(partnerId || '')
  const { revenue, loading: revenueLoading, error: revenueError, refetch: refetchRevenue } = useRevenueAnalytics(partnerId)
  const { bookings, loading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useBookingAnalytics(partnerId)
  const { fleet, loading: fleetLoading, error: fleetError, refetch: refetchFleet } = useFleetAnalytics(partnerId)

  const loading = performanceLoading || revenueLoading || bookingsLoading || fleetLoading
  const error = performanceError || revenueError || bookingsError || fleetError

  const refetch = () => {
    if (partnerId) {
      refetchPerformance()
    }
    refetchRevenue()
    refetchBookings()
    refetchFleet()
  }

  return {
    performance,
    revenue,
    bookings,
    fleet,
    loading,
    error,
    refetch
  }
} 