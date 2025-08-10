import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCars,
  getCarById,
  getSavedCars,
  saveCar,
  unsaveCar,
  isCarSaved,
  createBooking,
  getUserBookings,
  getUserProfile,
  updateUserProfile,
  getPartnerData,
  getPartnerFleet,
  getPartnerDrivers,
  getDriverData,
  getDriverTrips,
  getBookingAnalytics,
  getRevenueAnalytics,
  ComponentCar,
  SavedCar,
  Booking,
  User
} from '@/lib/supabase/utils'

// Cars hooks
export const useCars = () => {
  const [cars, setCars] = useState<ComponentCar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true)
        const data = await getCars()
        setCars(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchCars()
  }, [])

  return { cars, loading, error }
}

export const useCar = (id: string) => {
  const [car, setCar] = useState<ComponentCar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCar = async () => {
      try {
        setLoading(true)
        const data = await getCarById(id)
        setCar(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCar()
    }
  }, [id])

  return { car, loading, error }
}

// Saved cars hooks
export const useSavedCars = () => {
  const { user } = useAuth()
  const [savedCars, setSavedCars] = useState<SavedCar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchSavedCars = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getSavedCars(user.id)
        setSavedCars(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchSavedCars()
  }, [user])

  const toggleSave = async (carId: string) => {
    if (!user) return

    try {
      const isSaved = await isCarSaved(user.id, carId)
      
      if (isSaved) {
        await unsaveCar(user.id, carId)
        setSavedCars(prev => prev.filter(car => car.car_id !== carId))
      } else {
        await saveCar(user.id, carId)
        // Refresh saved cars
        const data = await getSavedCars(user.id)
        setSavedCars(data)
      }
    } catch (err) {
      setError(err as Error)
    }
  }

  return { savedCars, loading, error, toggleSave }
}

// Booking hooks
export const useBookings = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getUserBookings(user.id)
        setBookings(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user])

  const createNewBooking = async (bookingData: any) => {
    if (!user) return

    try {
      const newBooking = await createBooking({
        ...bookingData,
        user_id: user.id
      })
      setBookings(prev => [newBooking, ...prev])
      return newBooking
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return { bookings, loading, error, createNewBooking }
}

// User profile hooks
export const useUserProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getUserProfile(user.id)
        setProfile(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const updateProfile = async (updates: any) => {
    if (!user) return

    try {
      const updatedProfile = await updateUserProfile(user.id, updates)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  return { profile, loading, error, updateProfile }
}

// Partner hooks
export const usePartnerData = (partnerId: string) => {
  const [partnerData, setPartnerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!partnerId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getPartnerData(partnerId)
        setPartnerData(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchPartnerData()
  }, [partnerId])

  return { partnerData, loading, error }
}

export const usePartnerFleet = (partnerId: string) => {
  const [fleet, setFleet] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchFleet = async () => {
      if (!partnerId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getPartnerFleet(partnerId)
        setFleet(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchFleet()
  }, [partnerId])

  return { fleet, loading, error }
}

export const usePartnerDrivers = (partnerId: string) => {
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchDrivers = async () => {
      if (!partnerId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getPartnerDrivers(partnerId)
        setDrivers(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [partnerId])

  return { drivers, loading, error }
}

// Driver hooks
export const useDriverData = (driverId: string) => {
  const [driverData, setDriverData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!driverId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getDriverData(driverId)
        setDriverData(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchDriverData()
  }, [driverId])

  return { driverData, loading, error }
}

export const useDriverTrips = (driverId: string) => {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTrips = async () => {
      if (!driverId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getDriverTrips(driverId)
        setTrips(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [driverId])

  return { trips, loading, error }
}

// Analytics hooks
export const useBookingAnalytics = (partnerId?: string) => {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const data = await getBookingAnalytics(partnerId)
        setAnalytics(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [partnerId])

  return { analytics, loading, error }
}

export const useRevenueAnalytics = (partnerId?: string) => {
  const [revenue, setRevenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true)
        const data = await getRevenueAnalytics(partnerId)
        setRevenue(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()
  }, [partnerId])

  return { revenue, loading, error }
} 