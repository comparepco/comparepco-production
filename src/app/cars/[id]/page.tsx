'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaStar, FaShieldAlt, FaTools, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';

interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  price_per_week: number;
  features: string[];
  image_url: string;
  price?: number;
  image_urls?: string[];
  mileage?: number;
  year?: number;
  fuel_type?: string;
  transmission?: string;
  color?: string;
  seats?: number;
  doors?: number;
  engine_size?: string;
  emissions?: string;
  insurance_group?: string;
  tax_band?: string;
  is_available?: boolean;
  location?: string;
  rating?: number;
  reviews?: number;
  business_name?: string;
  business_logo?: string;
  partner_id?: string;
  rental_durations?: string[];
  prices?: { [key: string]: number };
  pricing?: {
    min_term_months?: number;
    deposit_required?: boolean;
    deposit_amount?: number;
    deposit_notes?: string;
  };
  sale_price_per_week?: number;
}

export default function CarDetailPage() {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weeks, setWeeks] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; logo: string } | null>(null);
  const params = useParams();
  const id = params.id;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return;
      try {
        // First try to fetch with partners join
        let { data: carData, error: carError } = await supabase
          .from('vehicles')
          .select(`
            *,
            partners (
              id,
              company_name,
              logo
            )
          `)
          .eq('id', id as string)
          .single();

        // If that fails, try without the partners join
        if (carError && carError.message.includes('relationship')) {
          console.log('Retrying without partners join...');
          const { data: simpleCarData, error: simpleCarError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id as string)
            .single();

          if (simpleCarError) {
            console.error('Error fetching car:', simpleCarError);
            setError('Car not found.');
            setLoading(false);
            return;
          }

          carData = simpleCarData;
          carError = null;
        } else if (carError) {
          console.error('Error fetching car:', carError);
          setError('Car not found.');
          setLoading(false);
          return;
        }

        if (carData) {
          // Transform the vehicle data to match the Car interface
          const transformedCar: Car = {
            id: carData.id,
            name: carData.name || `${carData.make} ${carData.model}`,
            make: carData.make,
            model: carData.model,
            price_per_week: (carData.price_per_day || 0) * 7, // Convert daily to weekly with fallback
            features: carData.features || [],
            image_url: carData.image_urls?.[0] || '',
            image_urls: carData.image_urls || [],
            mileage: carData.mileage || 0,
            year: carData.year || 2024,
            fuel_type: carData.fuel_type || 'Unknown',
            transmission: carData.transmission || 'Automatic',
            color: carData.color || 'Unknown',
            seats: carData.seats || 5,
            doors: carData.doors || 4,
            is_available: carData.is_available || false,
            location: carData.location || 'Location not specified',
            partner_id: carData.partner_id,
            // Extract pricing data from JSONB with fallbacks
            pricing: carData.pricing || {
              min_term_months: 1,
              deposit_required: false,
              deposit_amount: 0
            },
            // Partner info (handle both joined and separate fetch)
            business_name: carData.partners?.company_name || 'Partner',
            business_logo: carData.partners?.logo || '',
            // Sale price
            sale_price_per_week: carData.sale_price_per_day ? carData.sale_price_per_day * 7 : undefined
          };
          
          setCar(transformedCar);
        } else {
          setError('Car not found.');
        }
      } catch (err) {
        console.error('Error fetching car:', err);
        setError('Failed to load car details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  useEffect(() => {
    if (!car) return;
    
    // If we already have partner info from the join, use it
    if (car.business_name || car.business_logo) {
      setPartnerInfo({ name: car.business_name || '', logo: car.business_logo || '' });
    } else if (car.partner_id) {
      // Otherwise fetch partner info separately
      const fetchPartnerInfo = async () => {
        try {
          const { data: partnerData, error: partnerError } = await supabase
            .from('partners')
            .select('company_name, logo')
            .eq('id', car.partner_id)
            .single();

          if (!partnerError && partnerData) {
            setPartnerInfo({ 
              name: partnerData.company_name || '', 
              logo: partnerData.logo || '' 
            });
          }
        } catch (err) {
          console.error('Error fetching partner info:', err);
        }
      };

      fetchPartnerInfo();
    }
  }, [car]);

  useEffect(() => {
    if (car?.pricing?.min_term_months && car.pricing.min_term_months > 0) {
      // Convert months to weeks (approx 4 weeks per month)
      setWeeks(car.pricing.min_term_months * 4);
    } else {
      setWeeks(1);
    }
  }, [car?.pricing?.min_term_months]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-xl font-semibold text-gray-600">Loading car details...</div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-red-500">{error || 'Car not found.'}</div>
      </div>
    );
  }

  // Show sale price if present and lower than price_per_week
  const showSale = !!car.sale_price_per_week && (car.price_per_week !== undefined ? car.sale_price_per_week < car.price_per_week : true);
  const pricePerWeek: number = showSale ? (car.sale_price_per_week ?? 0) : (car.price_per_week ?? car.price ?? 0);
  const total = weeks === 0 ? 0 : pricePerWeek * weeks;
  const images = car.image_urls && car.image_urls.length > 0 ? car.image_urls : [car.image_url];

  const handlePrevImg = () => setImgIdx((prev) => (prev - 1 + images.length) % images.length);
  const handleNextImg = () => setImgIdx((prev) => (prev + 1) % images.length);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'location', label: 'Location' }
  ];

  const requiredTypes = ['driving_license', 'pco_license', 'proof_of_address', 'national_insurance'];

  // After loading car data, extract rentalDurations, minimumCommitment, and prices
  const rentalDurations = car.rental_durations || ['weekly'];
  const prices = car.prices || { weekly: car.price_per_week };
  const durationLabels: Record<'hourly' | 'daily' | 'weekly' | 'monthly', string> = {
    hourly: 'Hourly',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/cars" className="hover:text-blue-600">Cars</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{car.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Left Column - Image Carousel */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-full">
              <div className="relative w-full h-[400px] bg-gray-100 flex-1">
                <img
                  src={images[imgIdx]}
                  alt={car.name}
                  className="w-full h-full object-cover object-center transition-all duration-300"
                />
                {images.length > 1 && (
                  <>
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-blue-700 rounded-full p-3 shadow-lg z-10 transition-all"
                      onClick={handlePrevImg}
                      aria-label="Previous image"
                    >
                      <FaChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-blue-700 rounded-full p-3 shadow-lg z-10 transition-all"
                      onClick={handleNextImg}
                      aria-label="Next image"
                    >
                      <FaChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, i) => (
                        <span 
                          key={i} 
                          className={`inline-block w-3 h-3 rounded-full transition-all ${
                            i === imgIdx ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                          }`}
                        ></span>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="p-4 bg-gray-50">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        i === imgIdx ? 'border-blue-600' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt={`${car.name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Car Info & Booking */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col h-full sticky top-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{car.name}</h1>
                <p className="text-xl text-gray-600">{car.make} {car.model}</p>
                {partnerInfo && (
                  <div className="flex items-center gap-3 mt-2 mb-2">
                    {partnerInfo.logo && <img src={partnerInfo.logo} alt="Business Logo" className="w-10 h-10 rounded-full border" />}
                    <span className="font-semibold text-blue-700 text-lg">{partnerInfo.name}</span>
                  </div>
                )}
                {car.rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < Math.floor(car.rating!) ? 'fill-current' : 'text-gray-300'} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({car.reviews} reviews)</span>
                  </div>
                )}
              </div>

              {/* Price Card (merged design, now only this) */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-4 flex flex-col items-center">
                <span className="text-lg font-semibold text-gray-900 mb-1">Weekly</span>
                {showSale ? (
                  <>
                    <span className="text-xl text-gray-400 line-through mr-2">£{Math.round(car.price_per_week ?? 0)}</span>
                    <span className="text-3xl font-bold text-red-600">£{Math.round(car.sale_price_per_week!)}</span>
                  </>
                ) : (
                  <span className="text-blue-700 text-3xl font-bold">£{car.price_per_week ?? 0}</span>
                )}
                {car.pricing?.min_term_months && (
                  <span className="mt-2 text-gray-600 text-sm">Min {car.pricing.min_term_months} month{car.pricing.min_term_months! > 1 ? 's' : ''}</span>
                )}
                {car.pricing?.deposit_required && (
                  <span className="mt-1 text-red-600 text-sm">Deposit £{car.pricing.deposit_amount || 0}</span>
                )}
                <span className="mt-2 text-gray-700 text-base">Total for {weeks} week{weeks > 1 ? 's' : ''}: £{total}</span>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {car.year && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Year</div>
                    <div className="font-semibold text-gray-900">{car.year}</div>
                  </div>
                )}
                {car.mileage && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Mileage</div>
                    <div className="font-semibold text-gray-900">{car.mileage.toLocaleString()} miles</div>
                  </div>
                )}
                {car.fuel_type && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Fuel Type</div>
                    <div className="font-semibold text-gray-900">{car.fuel_type}</div>
                  </div>
                )}
                {car.transmission && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Transmission</div>
                    <div className="font-semibold text-gray-900">{car.transmission}</div>
                  </div>
                )}
              </div>

              {user && user.role === 'DRIVER' && (
                <p className="text-sm text-yellow-600 mb-2 text-center">Your account is not verified. Partner approval may be required after booking.</p>
              )}
              <Link
                href={user ? `/booking?car=${car.id}&weeks=${weeks}` : '#'}
                className={`block text-center w-full px-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] ${weeks === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                onClick={(e) => {
                  if (weeks === 0) {
                    e.preventDefault();
                  } else if (!user) {
                    e.preventDefault();
                    router.push('/auth/register/driver');
                  }
                }}
              >
                Book This Car
              </Link>

              <div className="mt-4 text-center text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <FaShieldAlt className="text-blue-600" />
                  <span>Fully Insured</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <FaTools className="text-blue-600" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Car Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-800">
                      Experience the perfect blend of comfort and performance with this {car.make} {car.model}. 
                      This {car.year} model offers an exceptional driving experience with its {car.transmission?.toLowerCase()} transmission 
                      and {car.fuel_type?.toLowerCase()} engine.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Highlights</h3>
                    <ul className="space-y-2">
                      {(car.features ?? []).slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-800">
                          <FaCheckCircle className="text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'features' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Features & Equipment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(car.features ?? []).map((feature, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <FaCheckCircle className="text-blue-600 w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                {car.rating ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl font-bold text-gray-900">{car.rating.toFixed(1)}</div>
                        <div>
                          <div className="flex text-yellow-400 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={i < Math.floor(car.rating!) ? 'fill-current' : 'text-gray-300'} />
                            ))}
                          </div>
                          <div className="text-sm text-gray-600">Based on {car.reviews} reviews</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No reviews yet. Be the first to review this car!
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'location' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pickup Location</h2>
                {car.location ? (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FaMapMarkerAlt className="text-blue-600 w-6 h-6" />
                      <span className="text-lg font-medium">{car.location}</span>
                    </div>
                    <div className="aspect-video bg-gray-200 rounded-lg">
                      {/* Add map component here */}
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Map View Coming Soon
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Location information not available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 