'use client';
import React, { useEffect, useState, Suspense, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCarSide, FaShieldAlt, FaTools, FaBolt, FaStar, FaCheckCircle, FaDollarSign, FaClipboardList, FaBoxOpen, FaSearch, FaCalendarAlt, FaSmile, FaPoundSign, FaHeart, FaShareAlt, FaMapMarkerAlt, FaGlobe, FaCog, FaMoneyBillWave, FaFilter, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const featureIcons: Record<string, React.ReactNode> = {
  Insurance: <FaShieldAlt className="inline mr-1 text-blue-500" />,
  MOT: <FaTools className="inline mr-1 text-yellow-500" />,
  'EV Assist': <FaBolt className="inline mr-1 text-green-500" />,
  Breakdown: <FaTools className="inline mr-1 text-red-500" />,
  Warranty: <FaStar className="inline mr-1 text-purple-500" />,
};

const categories = ['UberX', 'Comfort', 'Exec', 'Lux', 'Uber Pet', 'Uber Green'];
const fuelTypes = ['Electric', 'Hybrid', 'Petrol', 'Diesel'];
const carSizes = ['Small', 'Medium', 'Large', 'SUV', 'MPV'];
const transmissions = ['Automatic', 'Manual'];
const seatCounts = [4, 5, 6, 7, 8];
const bootSizes = ['Small', 'Medium', 'Large'];
const ulezOptions = ['Any', 'Yes', 'No'];
const insuranceOptions = ['Any', 'Included', 'Not included'];
const mileageOptions = ['Any', 'Unlimited', '<1000/week', '<500/week'];
const ageOptions = ['Any', 'New', '<2 years', '<5 years', '<10 years'];
const sortOptions = ['Lowest Price', 'Highest Price', 'Newest'];

interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  pricePerWeek: number;
  features: string[];
  imageUrl: string;
  imageUrls?: string[];
  category?: string;
  fuelType?: string;
  valueScore?: number;
  isPopular?: boolean;
  partnerId: string;
  partnerName: string;
  description?: string;
  specifications?: {
    year: number;
    mileage: number;
    transmission: string;
    doors: number;
    seats: number;
  };
  availability?: boolean;
  insuranceIncluded?: boolean;
  pricing?: {
    minTermMonths?: number;
    depositRequired?: boolean;
    depositAmount?: number;
  };
}

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter states (UI only)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFuel, setSelectedFuel] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [selectedCarSize, setSelectedCarSize] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedSeatCount, setSelectedSeatCount] = useState('');
  const [selectedBootSize, setSelectedBootSize] = useState('');
  const [selectedUlez, setSelectedUlez] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [selectedMileage, setSelectedMileage] = useState('');
  const [selectedAge, setSelectedAge] = useState('');

  // Make/Model filter state
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Generate make/model options from cars (like HeroFilter)
  const makeOptions = useMemo(() => {
    const set = new Set<string>();
    cars.forEach((c) => c.make && set.add(c.make));
    return Array.from(set);
  }, [cars]);

  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    cars.forEach((c) => {
      if (c.make === selectedMake && c.model) set.add(c.model);
    });
    return Array.from(set);
  }, [cars, selectedMake]);

  useEffect(() => {
    // Initialize filters from URL search params
    const urlCategories = searchParams.get('categories');
    const urlFuel = searchParams.get('fuel');
    const urlSearch = searchParams.get('search');
    const urlMin = searchParams.get('min');
    const urlMax = searchParams.get('max');
    const urlSort = searchParams.get('sort');

    if (urlCategories) setSelectedCategories(urlCategories.split(','));
    if (urlFuel) setSelectedFuel(urlFuel);
    if (urlSearch) setSearchTerm(urlSearch);
    if (urlMin) setMinPrice(urlMin);
    if (urlMax) setMaxPrice(urlMax);
    if (urlSort) setSortBy(urlSort);
  }, [searchParams]);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        // Fetch only available cars from the new API endpoint
        const response = await fetch('/api/cars/available');
        const data = await response.json();
        
        if (data.success) {
          setCars(data.cars);
          if (data.cars.length === 0) {
            setError('No cars available at the moment. Please check back later.');
          }
        } else {
          console.error('Error fetching available cars:', data.error);
          setError('Failed to load cars. Please try again later.');
          setCars([]);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load cars. Please try again later.');
        setCars([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedFuel('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('');
    setSelectedCarSize('');
    setSelectedTransmission('');
    setSelectedSeatCount('');
    setSelectedBootSize('');
    setSelectedUlez('');
    setSelectedInsurance('');
    setSelectedMileage('');
    setSelectedAge('');
    setSelectedMake('');
    setSelectedModel('');
  };
  
  // The rest of the component logic (filtering, sorting, booking) remains the same
  const filteredCars = cars.filter(car => {
    const categoryMatch = selectedCategories.length === 0 || (car.category && selectedCategories.includes(car.category));
    const fuelMatch = !selectedFuel || car.fuelType === selectedFuel;
    const searchMatch = !searchTerm || 
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase());
    const minPriceMatch = !minPrice || car.pricePerWeek >= parseInt(minPrice);
    const maxPriceMatch = !maxPrice || car.pricePerWeek <= parseInt(maxPrice);

    return categoryMatch && fuelMatch && searchMatch && minPriceMatch && maxPriceMatch;
  });

  const sortedCars = [...filteredCars];
  if (sortBy === 'Lowest Price') sortedCars.sort((a, b) => a.pricePerWeek - b.pricePerWeek);
  if (sortBy === 'Highest Price') sortedCars.sort((a, b) => b.pricePerWeek - a.pricePerWeek);
  if (sortBy === 'Newest') sortedCars.sort((a, b) => (b.id > a.id ? 1 : -1));

  const carCount = sortedCars.length;

  const handleViewCar = (carId: string) => {
    router.push(`/cars/${carId}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Car Listing */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-500 text-lg">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCars.map(car => (
                <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full">
                  <div className="relative w-full h-48">
                    {car.imageUrl || car.imageUrls?.[0] ? (
                      <Image 
                        src={(car.imageUrl || car.imageUrls?.[0]) as string} 
                        alt={car.name} 
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <FaCarSide className="text-gray-400 text-4xl" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{car.name}</h3>
                    <p className="text-gray-600 mb-2">{car.make} {car.model}</p>
                    <p className="text-2xl font-bold text-blue-600 mb-3">£{car.pricePerWeek}/week</p>
                    
                    {/* Tags - flex-grow to push button to bottom */}
                    <div className="mb-4 flex-grow">
                      {/* Count non-insurance tags */}
                      {(() => {
                        const nonInsuranceTags = [
                          car.pricing?.minTermMonths,
                          car.pricing?.depositRequired,
                          car.fuelType,
                          car.category
                        ].filter(Boolean).length;
                        
                        const totalTags = nonInsuranceTags + (car.insuranceIncluded !== undefined ? 1 : 0);
                        
                        return (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {car.pricing?.minTermMonths && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800">
                                  Min {car.pricing.minTermMonths} {car.pricing.minTermMonths === 1 ? 'month' : 'months'}
                                </span>
                              )}
                              {car.pricing?.depositRequired && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                                  Deposit £{car.pricing.depositAmount}
                                </span>
                              )}
                              {car.fuelType && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                  {car.fuelType}
                                </span>
                              )}
                              {car.category && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {car.category}
                                </span>
                              )}
                              {/* Put insurance on same line if more than 2 tags total */}
                              {car.insuranceIncluded !== undefined && totalTags > 2 && (
                                car.insuranceIncluded ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                    <FaShieldAlt className="w-3 h-3" /> Insurance Included
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                                    <FaExclamationTriangle className="w-3 h-3" /> Insurance Not Included
                                  </span>
                                )
                              )}
                            </div>
                            {/* Put insurance on separate line if 2 tags or fewer */}
                            {car.insuranceIncluded !== undefined && totalTags <= 2 && (
                              <div className="mt-2">
                                {car.insuranceIncluded ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                    <FaShieldAlt className="w-3 h-3" /> Insurance Included
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                                    <FaExclamationTriangle className="w-3 h-3" /> Insurance Not Included
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Button always at bottom */}
                    <button 
                        onClick={() => handleViewCar(car.id)}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-auto"
                    >
                        View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Floating Filter and Sort Button */}
      <button
        className="fixed left-1/2 bottom-24 sm:bottom-6 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-colors text-lg"
        style={{boxShadow: '0 4px 24px rgba(0,0,0,0.10)'}}
        type="button"
        aria-label="Filter and sort"
        onClick={() => setShowFilterModal(true)}
      >
        <FaFilter className="text-xl text-white" />
        Filter and sort
      </button>
      {/* Modal Overlay */}
      {showFilterModal && (
        <>
          {/* Overlay only on mobile */}
          <div
            className="fixed inset-0 z-50 transition-opacity duration-300 bg-black bg-opacity-40 sm:bg-transparent"
            onClick={() => setShowFilterModal(false)}
            style={{ display: 'block', pointerEvents: 'auto' }}
          />
          {/* Modal container: full-screen on mobile, sidebar on desktop */}
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-start sm:justify-start"
            style={{ pointerEvents: 'none' }}
          >
            {/* Sidebar: only width on desktop, full on mobile */}
            <div
              className="w-full h-full sm:w-[400px] sm:max-w-md sm:h-full sm:rounded-none sm:shadow-2xl"
              style={{ pointerEvents: 'auto', background: 'transparent' }}
            >
              <div className="bg-white border-t border-blue-100 h-full sm:h-full p-0 animate-slideUp sm:animate-slideInLeft relative flex flex-col sm:shadow-2xl sm:rounded-none sm:w-[400px] sm:fixed sm:top-0 sm:left-0 sm:bottom-0">
                <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900">Filter and sort</h2>
                  <button
                    className="text-blue-600 text-2xl hover:text-blue-800 focus:outline-none"
                    onClick={() => setShowFilterModal(false)}
                    aria-label="Close filter and sort"
                  >
                    <FaTimes />
                  </button>
                </div>
                {/* Filter & Sort Controls */}
                <div className="space-y-4 flex-1 overflow-y-auto px-6 py-4">
                  {/* Make/Model Dropdowns */}
                  <div className="flex gap-4">
                    <select
                      value={selectedMake}
                      onChange={e => {
                        setSelectedMake(e.target.value);
                        setSelectedModel('');
                      }}
                      className="w-1/2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Make</option>
                      {makeOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      disabled={!selectedMake}
                      className={`w-1/2 px-4 py-3 rounded-lg border text-gray-700 focus:outline-none ${selectedMake ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                    >
                      <option value="">Model</option>
                      {modelOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="Search by make, model..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {/* Category Multi-select */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${selectedCategories.includes(cat) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-50'}`}
                          onClick={() => handleCategoryToggle(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Fuel Type */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Fuel type</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedFuel}
                      onChange={(e) => setSelectedFuel(e.target.value)}
                    >
                      <option value="">All Fuel Types</option>
                      {fuelTypes.map((fuel) => (
                        <option key={fuel} value={fuel}>{fuel}</option>
                      ))}
                    </select>
                  </div>
                  {/* Price Range */}
                  <div className="flex gap-4">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min £/week"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Max £/week"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                  {/* Sort By */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Sort by</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="">Sort by</option>
                      {sortOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  {/* Car Size/Class */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Car size/class</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedCarSize}
                      onChange={(e) => setSelectedCarSize(e.target.value)}
                    >
                      <option value="">All Sizes/Classes</option>
                      {carSizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  {/* Transmission */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Transmission</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedTransmission}
                      onChange={(e) => setSelectedTransmission(e.target.value)}
                    >
                      <option value="">All Transmissions</option>
                      {transmissions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  {/* Seats */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Seats</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedSeatCount}
                      onChange={(e) => setSelectedSeatCount(e.target.value)}
                    >
                      <option value="">Any Seats</option>
                      {seatCounts.map((n) => (
                        <option key={n} value={n.toString()}>{n} seats</option>
                      ))}
                    </select>
                  </div>
                  {/* Boot Size */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Boot size</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedBootSize}
                      onChange={(e) => setSelectedBootSize(e.target.value)}
                    >
                      <option value="">Any Boot Size</option>
                      {bootSizes.map((b) => (
                        <option key={b} value={b}>{b} Boot</option>
                      ))}
                    </select>
                  </div>
                  {/* ULEZ */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">ULEZ compliant</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedUlez}
                      onChange={(e) => setSelectedUlez(e.target.value)}
                    >
                      {ulezOptions.map((u) => (
                        <option key={u} value={u}>{u === 'Any' ? 'ULEZ Compliant?' : u}</option>
                      ))}
                    </select>
                  </div>
                  {/* Insurance */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Insurance included</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedInsurance}
                      onChange={(e) => setSelectedInsurance(e.target.value)}
                    >
                      {insuranceOptions.map((i) => (
                        <option key={i} value={i}>{i === 'Any' ? 'Insurance Included?' : i}</option>
                      ))}
                    </select>
                  </div>
                  {/* Mileage */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Mileage limit</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedMileage}
                      onChange={(e) => setSelectedMileage(e.target.value)}
                    >
                      {mileageOptions.map((m) => (
                        <option key={m} value={m}>{m === 'Any' ? 'Mileage Limit' : m}</option>
                      ))}
                    </select>
                  </div>
                  {/* Car Age */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Car age</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500 text-base"
                      value={selectedAge}
                      onChange={(e) => setSelectedAge(e.target.value)}
                    >
                      {ageOptions.map((a) => (
                        <option key={a} value={a}>{a === 'Any' ? 'Car Age' : a}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Modal Actions */}
                <div className="flex gap-3 mt-6 px-6 pb-6">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex-1 py-3 rounded-full bg-gray-100 text-blue-600 font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilterModal(false)}
                    className="flex-1 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Slide up animation */}
          <style jsx global>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            @keyframes slideInLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            .animate-slideUp {
              animation: slideUp 0.35s cubic-bezier(0.4,0,0.2,1);
            }
            @media (min-width: 640px) {
              .sm\:animate-slideInLeft {
                animation: slideInLeft 0.35s cubic-bezier(0.4,0,0.2,1);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-50 py-8">
        <ComparePageContent />
      </div>
    </Suspense>
  );
} 